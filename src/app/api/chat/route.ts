import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// Floor for reasonable responses; Claude Haiku is fast enough for ~<2s roundtrips.
const MAX_TOKENS = 700;
// Keep it to the last 10 messages so the context stays small.
const MAX_HISTORY = 10;

type ClientMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = (body?.messages ?? []) as ClientMsg[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }
    if (messages[messages.length - 1]?.role !== "user") {
      return NextResponse.json({ error: "last message must be from user" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY is not set on the server. Add it to your .env file and restart the dev server.",
        },
        { status: 500 }
      );
    }

    // Fetch the live catalog from the DB. Cap at 100 since Pitampura is hyperlocal.
    const classes = await prisma.class.findMany({
      where: { status: "ACTIVE", liveStatus: "APPROVED" },
      include: {
        provider: true,
        batches: {
          orderBy: { createdAt: "asc" },
        },
      },
      take: 100,
    });

    // Condense to a compact JSON representation the model can reason over.
    const catalog = classes.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      type: c.type, // REGULAR | COURSE | WORKSHOP
      provider: c.provider.instituteName,
      area: c.provider.area ?? "Pitampura",
      description: (c.description ?? "").slice(0, 200),
      tags: c.tagsCsv ?? "",
      rating: c.rating ?? null,
      batches: c.batches.map((b) => ({
        name: b.name,
        days: b.classDaysCsv ?? "",
        time: `${b.fromTime}–${b.toTime}`,
        pricePer4Weeks: b.pricePer4Weeks,
        seatsLeft: Math.max(0, b.maxStudents - b.enrolled),
        freeTrial: b.freeTrialEnabled,
        freeTrialSessions: b.freeTrialSessions,
      })),
    }));

    const system = `You are "Zoe", the friendly class-discovery assistant for LearnNextDoor — a hyperlocal learning marketplace for Pitampura, Delhi.

Your ONE job: help a visitor (often a parent) find the right class for themselves or their child from the catalog below.

HARD RULES (do not break these):
1. You may ONLY recommend classes that appear in the catalog. Never invent classes, prices, schedules, or teachers. If nothing fits, say so honestly.
2. When you recommend a class, cite it using a markdown link like this: [Class title](/class/<id>) — use the exact id from the catalog. Do not add any other formatting around the link.
3. Always include price (as "₹X / 4 weeks") and whether a free trial is available, when you recommend.
4. Keep responses short: 1–3 sentences of reasoning, then 1–3 recommendations. No preamble ("Great question!"), no sign-off.
5. If the request is vague ("I want a hobby", "something for my kid"), ask ONE targeted clarifying question (age, subject, days/times, or budget) BEFORE recommending. Do not recommend and ask in the same turn.
6. Never make up contact details, reviews, or policies. If asked about things not in the catalog (refunds, certificates, pickup), say you'll hand off to support.
7. Use Indian rupees (₹) and 12-hour time. Be warm but efficient — this is a local, neighbourhood app, not a corporate one.

STYLE:
- Address the user in second person ("you", "your kid").
- Use exactly one line break between your sentence of reasoning and the list of recommendations.
- Recommendations should be a bullet list, each bullet starting with "• " (bullet dot + space), then the markdown link, then a short reason.

CATALOG (live data, JSON):
${JSON.stringify(catalog)}

If the catalog is empty, tell the user the marketplace is onboarding new providers right now and offer to notify them when classes in their category are live.`;

    const trimmedHistory = messages
      .slice(-MAX_HISTORY)
      .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content.slice(0, 2000),
      }));

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const resp = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: MAX_TOKENS,
      system,
      messages: trimmedHistory,
    });

    const reply = resp.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();

    return NextResponse.json({ reply });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/chat] error:", e);
    const msg = typeof e?.message === "string" ? e.message : "Chat failed";
    // Surface useful info in dev without leaking internals in prod.
    const safe =
      process.env.NODE_ENV === "production"
        ? "The assistant ran into an error. Please try again."
        : msg;
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}
