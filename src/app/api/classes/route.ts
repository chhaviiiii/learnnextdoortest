import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { provider } = await requireProvider();
  const body = await req.json();
  const {
    type,
    title,
    category,
    description,
    tagsCsv,
    imagesCsv,
    earlyBird,
    startDate,
    durationWeeks,
    batches,
  } = body ?? {};

  if (!title || !type || !category) {
    return NextResponse.json({ error: "title, type and category are required" }, { status: 400 });
  }
  if (!["REGULAR", "COURSE", "WORKSHOP"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!Array.isArray(batches) || batches.length === 0) {
    return NextResponse.json({ error: "At least one batch is required" }, { status: 400 });
  }

  const cls = await prisma.class.create({
    data: {
      providerId: provider.id,
      title,
      type,
      category,
      description: description ?? null,
      tagsCsv: tagsCsv ?? null,
      imagesCsv: imagesCsv ?? null,
      earlyBird: !!earlyBird,
      startDate: startDate ? new Date(startDate) : null,
      durationWeeks: durationWeeks ?? null,
      status: "ACTIVE",
      batches: {
        create: batches.map((b: any) => ({
          name: b.name || "Default batch",
          classDaysCsv: b.classDaysCsv ?? "",
          fromTime: b.fromTime ?? "09:00",
          toTime: b.toTime ?? "10:00",
          pricePer4Weeks: Number(b.pricePer4Weeks ?? 0),
          maxStudents: Number(b.maxStudents ?? 20),
          freeTrialEnabled: !!b.freeTrialEnabled,
          freeTrialSessions: Number(b.freeTrialSessions ?? 0),
          instructorId: b.instructorId || null,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, class: cls });
}
