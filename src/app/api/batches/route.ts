import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/batches  →  create a new batch on a class the caller owns
export async function POST(req: Request) {
  const { provider } = await requireProvider();
  const body = await req.json();
  const {
    classId,
    name,
    classDaysCsv,
    startDate,
    fromTime,
    toTime,
    pricePer4Weeks,
    maxStudents,
    freeTrialEnabled,
    freeTrialSessions,
    instructorId,
    imageUrl,
  } = body ?? {};

  if (!classId || !name) {
    return NextResponse.json({ error: "classId and name are required" }, { status: 400 });
  }

  const cls = await prisma.class.findFirst({
    where: { id: classId, providerId: provider.id },
    select: { id: true },
  });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  // Optional: make sure the instructor (if any) belongs to the same provider
  if (instructorId) {
    const ok = await prisma.instructor.findFirst({
      where: { id: instructorId, providerId: provider.id },
      select: { id: true },
    });
    if (!ok) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 400 });
    }
  }

  const batch = await prisma.batch.create({
    data: {
      classId,
      name: String(name),
      classDaysCsv: classDaysCsv ?? "",
      startDate: startDate ? new Date(startDate) : null,
      fromTime: fromTime ?? "09:00",
      toTime: toTime ?? "10:00",
      pricePer4Weeks: Number(pricePer4Weeks ?? 0),
      maxStudents: Number(maxStudents ?? 20),
      freeTrialEnabled: !!freeTrialEnabled,
      freeTrialSessions: Number(freeTrialSessions ?? 0),
      instructorId: instructorId || null,
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json({ ok: true, batch });
}
