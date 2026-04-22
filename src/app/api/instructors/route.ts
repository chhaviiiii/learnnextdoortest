import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { provider } = await requireProvider();
  const { name, email, phone, specialty } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const i = await prisma.instructor.create({
    data: { providerId: provider.id, name, email: email || null, phone: phone || null, specialty: specialty || null },
  });
  return NextResponse.json({ ok: true, instructor: i });
}
