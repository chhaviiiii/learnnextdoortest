import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Shared helper: load a batch that belongs to the caller's provider, or return null.
async function ownedBatch(id: string, providerId: string) {
  return prisma.batch.findFirst({
    where: { id, class: { providerId } },
    include: {
      class: { select: { type: true } },
      _count: { select: { bookings: true } },
    },
  });
}

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function validDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

// PATCH /api/batches/[id]  →  update editable fields
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { provider } = await requireProvider();

  const batch = await ownedBatch(params.id, provider.id);
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
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

  // If maxStudents is being lowered, make sure we're not going below current enrolled.
  if (maxStudents !== undefined && Number(maxStudents) < batch.enrolled) {
    return NextResponse.json(
      {
        error: `Cannot set max to ${maxStudents} — ${batch.enrolled} students are already enrolled.`,
      },
      { status: 400 }
    );
  }

  const nextName = name !== undefined ? String(name).trim() : batch.name;
  if (nextName.length < 3) return invalid("Batch name must be at least 3 characters.");
  const nextStartDate = startDate !== undefined ? validDate(startDate) : batch.startDate;
  if (batch.class.type === "REGULAR" && !nextStartDate) return invalid("Start date is required.");
  const nextClassDays = classDaysCsv !== undefined ? String(classDaysCsv).trim() : batch.classDaysCsv ?? "";
  if (batch.class.type !== "WORKSHOP" && !nextClassDays) return invalid("Class days are required.");
  const nextFrom = fromTime !== undefined ? String(fromTime).trim() : batch.fromTime;
  const nextTo = toTime !== undefined ? String(toTime).trim() : batch.toTime;
  if (!nextFrom || !nextTo || nextTo <= nextFrom) return invalid("End time must be after start time.");
  const nextPrice = pricePer4Weeks !== undefined ? Number(pricePer4Weeks) : batch.pricePer4Weeks;
  const nextCapacity = maxStudents !== undefined ? Number(maxStudents) : batch.maxStudents;
  if (nextPrice < 100 || nextCapacity < 1) return invalid("Price and capacity are invalid.");
  const nextTrialEnabled = freeTrialEnabled !== undefined ? !!freeTrialEnabled : batch.freeTrialEnabled;
  const nextTrialSessions = freeTrialSessions !== undefined ? Number(freeTrialSessions) : batch.freeTrialSessions;
  if (nextTrialEnabled && (nextTrialSessions < 1 || nextTrialSessions > 3)) {
    return invalid("Free trial sessions must be between 1 and 3.");
  }

  // If instructorId is provided, validate ownership
  if (instructorId) {
    const ok = await prisma.instructor.findFirst({
      where: { id: instructorId, providerId: provider.id },
      select: { id: true },
    });
    if (!ok) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 400 });
    }
  }

  const updated = await prisma.batch.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: nextName }),
      ...(classDaysCsv !== undefined && { classDaysCsv: batch.class.type === "WORKSHOP" ? "" : nextClassDays }),
      ...(startDate !== undefined && { startDate: nextStartDate }),
      ...(fromTime !== undefined && { fromTime: nextFrom }),
      ...(toTime !== undefined && { toTime: nextTo }),
      ...(pricePer4Weeks !== undefined && { pricePer4Weeks: nextPrice }),
      ...(maxStudents !== undefined && { maxStudents: nextCapacity }),
      ...(freeTrialEnabled !== undefined && { freeTrialEnabled: !!freeTrialEnabled }),
      ...(freeTrialSessions !== undefined && { freeTrialSessions: nextTrialEnabled ? nextTrialSessions : 0 }),
      ...(instructorId !== undefined && { instructorId: instructorId || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
    },
  });

  return NextResponse.json({ ok: true, batch: updated });
}

// DELETE /api/batches/[id]  →  refuse if anyone is enrolled
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { provider } = await requireProvider();

  const batch = await ownedBatch(params.id, provider.id);
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  if (batch.enrolled > 0 || batch._count.bookings > 0) {
    return NextResponse.json(
      {
        error: `This batch has ${batch.enrolled} enrolled students and cannot be deleted. Edit its schedule or archive the class instead.`,
      },
      { status: 400 }
    );
  }

  await prisma.batch.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
