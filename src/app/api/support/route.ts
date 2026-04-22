import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireUser();
  const { subject, category, message } = await req.json();
  if (!subject || !message) {
    return NextResponse.json({ error: "subject and message are required" }, { status: 400 });
  }
  const count = await prisma.supportTicket.count();
  const code = "T" + String(count + 1).padStart(3, "0");

  const t = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      code,
      subject,
      category: category || "Other",
      message,
      status: "OPEN",
    },
  });
  return NextResponse.json({ ok: true, ticket: t });
}
