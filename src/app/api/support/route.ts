import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupportCategories } from "@/lib/support";

export async function POST(req: Request) {
  const user = await requireUser();
  const { subject, category, message } = await req.json();
  const subjectText = String(subject ?? "").trim();
  const messageText = String(message ?? "").trim();
  if (!subjectText || !messageText) {
    return NextResponse.json({ error: "subject and message are required" }, { status: 400 });
  }
  const categories = await getSupportCategories();
  const selectedCategory = String(category || categories[0] || "Other").trim();
  if (!categories.includes(selectedCategory)) {
    return NextResponse.json({ error: "Choose a valid support category." }, { status: 400 });
  }
  const count = await prisma.supportTicket.count();
  const code = "T" + String(count + 1).padStart(3, "0");

  const t = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      code,
      subject: subjectText,
      category: selectedCategory,
      message: messageText,
      status: "OPEN",
    },
  });
  return NextResponse.json({ ok: true, ticket: t });
}
