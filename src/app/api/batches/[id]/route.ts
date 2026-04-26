import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Shared helper: load a batch that belongs to the caller's provider, or return null.
async function ownedBatch(id: string, providerId: string) {
  return prisma.batch.findFirst({
    where: { id, class: { providerId } },
    include: { _count: { select: { bookings: true } } },
  });
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
      ...(name !== undefined && { name: String(name) }),
      ...(classDaysCsv !== undefined && { classDaysCsv: String(classDaysCsv) }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(fromTime !== undefined && { fromTime: String(fromTime) }),
      ...(toTime !== undefined && { toTime: String(toTime) }),
      ...(pricePer4Weeks !== undefined && { pricePer4Weeks: Number(pricePer4Weeks) }),
      ...(maxStudents !== undefined && { maxStudents: Number(maxStudents) }),
      ...(freeTrialEnabled !== undefined && { freeTrialEnabled: !!freeTrialEnabled }),
      ...(freeTrialSessions !== undefined && { freeTrialSessions: Number(freeTrialSessions) }),
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
