import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCancelScope } from "@/lib/cancellation";

/**
 * POST /api/cancellations/preview
 * Dry-run for the confirmation modal. Returns the list of students affected
 * and their individual refund amounts. Does not mutate anything.
 *
 * body: { classId, batchId?, scope: "WORKSHOP" | "COURSE" | "BATCH" }
 */
export async function POST(req: Request) {
  const { provider } = await requireProvider();
  const body = await req.json().catch(() => ({}));
  const { classId, batchId, scope } = body ?? {};

  if (!isCancelScope(scope)) {
    return NextResponse.json({ error: "scope must be WORKSHOP | COURSE | BATCH" }, { status: 400 });
  }
  if (!classId) return NextResponse.json({ error: "classId required" }, { status: 400 });

  const cls = await prisma.class.findFirst({
    where: { id: classId, providerId: provider.id },
    include: { batches: { select: { id: true, name: true } } },
  });
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  let batchIds: string[] = [];
  if (scope === "BATCH") {
    if (!batchId) return NextResponse.json({ error: "batchId required for scope=BATCH" }, { status: 400 });
    if (!cls.batches.some((b) => b.id === batchId)) {
      return NextResponse.json({ error: "Batch does not belong to this class" }, { status: 400 });
    }
    batchIds = [batchId];
  } else {
    batchIds = cls.batches.map((b) => b.id);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      batchId: { in: batchIds },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: {
      user: { select: { name: true } },
      batch: { select: { name: true } },
    },
  });

  const lines = bookings.map((bk) => {
    const remaining = bk.mode === "TRIAL" ? 0 : Math.max(0, bk.amount - bk.refundAmount);
    return {
      bookingId: bk.id,
      studentName: bk.user.name ?? "Learner",
      batchName: bk.batch.name,
      mode: bk.mode,
      amountPaid: bk.amount,
      alreadyRefunded: bk.refundAmount,
      refundAmount: remaining,
    };
  });

  const totalRefund = lines.reduce((a, l) => a + l.refundAmount, 0);

  return NextResponse.json({
    ok: true,
    scope,
    classTitle: cls.title,
    affectedBookings: bookings.length,
    totalRefund,
    lines,
  });
}
