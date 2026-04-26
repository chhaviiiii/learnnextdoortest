import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function validDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

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
    select: { id: true, type: true, _count: { select: { batches: true } } },
  });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  if (cls.type === "REGULAR" && cls._count.batches >= 5) {
    return invalid("Regular listings can have up to 5 batches.");
  }
  if (cls.type !== "REGULAR" && cls._count.batches >= 1) {
    return invalid("Courses and workshops can only have one schedule.");
  }

  const batchName = String(name).trim();
  if (batchName.length < 3) return invalid("Batch name must be at least 3 characters.");
  const start = validDate(startDate);
  if (cls.type === "REGULAR" && !start) return invalid("Start date is required.");
  const days = String(classDaysCsv ?? "").trim();
  if (cls.type !== "WORKSHOP" && !days) return invalid("Class days are required.");
  const from = String(fromTime ?? "").trim();
  const to = String(toTime ?? "").trim();
  if (!from || !to || to <= from) return invalid("End time must be after start time.");
  const price = Number(pricePer4Weeks ?? 0);
  const capacity = Number(maxStudents ?? 20);
  const trialSessions = Number(freeTrialSessions ?? 0);
  if (price < 100 || capacity < 1) return invalid("Price and capacity are invalid.");
  if (freeTrialEnabled && (trialSessions < 1 || trialSessions > 3)) {
    return invalid("Free trial sessions must be between 1 and 3.");
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
      name: batchName,
      classDaysCsv: cls.type === "WORKSHOP" ? "" : days,
      startDate: start,
      fromTime: from,
      toTime: to,
      pricePer4Weeks: price,
      maxStudents: capacity,
      freeTrialEnabled: !!freeTrialEnabled,
      freeTrialSessions: freeTrialEnabled ? trialSessions : 0,
      instructorId: instructorId || null,
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json({ ok: true, batch });
}
