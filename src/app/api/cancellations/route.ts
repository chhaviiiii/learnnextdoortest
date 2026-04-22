import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCancelScope } from "@/lib/cancellation";

/**
 * POST /api/cancellations
 * Full cancellation of a workshop, course, or a single batch (regular class).
 *
 * body: {
 *   classId: string,
 *   batchId?: string,            // required when scope=BATCH
 *   scope: "WORKSHOP" | "COURSE" | "BATCH",
 *   reason: string,              // min 10 chars
 *   confirm: "CANCEL"            // PRD double-confirmation: typed literal
 * }
 *
 * Effects:
 *   - All affected bookings → status=CANCELLED, cancelledAt=now.
 *   - A Refund row per booking at full amount paid (mode != TRIAL), QUEUED.
 *   - Batch.enrolled reset to 0 (for BATCH scope) or the class's batches (for COURSE/WORKSHOP).
 *   - Class.status → ARCHIVED for COURSE and WORKSHOP; unchanged for BATCH (class may still have other batches).
 *   - A provider Notification summarising the impact.
 */
export async function POST(req: Request) {
  const { user, provider } = await requireProvider();
  const body = await req.json().catch(() => ({}));
  const { classId, batchId, scope, reason, confirm } = body ?? {};

  if (!isCancelScope(scope)) {
    return NextResponse.json({ error: "scope must be WORKSHOP | COURSE | BATCH" }, { status: 400 });
  }
  if (confirm !== "CANCEL") {
    return NextResponse.json(
      { error: 'Type CANCEL exactly to confirm. Include {"confirm":"CANCEL"}.' },
      { status: 400 },
    );
  }
  if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
    return NextResponse.json({ error: "Reason must be at least 10 characters" }, { status: 400 });
  }
  if (!classId) {
    return NextResponse.json({ error: "classId required" }, { status: 400 });
  }

  // Ownership check on the class.
  const cls = await prisma.class.findFirst({
    where: { id: classId, providerId: provider.id },
    include: { batches: { select: { id: true } } },
  });
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  // Resolve the list of batch IDs this cancellation touches.
  let batchIds: string[] = [];
  if (scope === "BATCH") {
    if (!batchId) return NextResponse.json({ error: "batchId required for scope=BATCH" }, { status: 400 });
    if (!cls.batches.some((b) => b.id === batchId)) {
      return NextResponse.json({ error: "Batch does not belong to this class" }, { status: 400 });
    }
    batchIds = [batchId];
  } else {
    // COURSE and WORKSHOP cancel every batch on the class.
    batchIds = cls.batches.map((b) => b.id);
  }

  if (batchIds.length === 0) {
    return NextResponse.json({ error: "No batches to cancel" }, { status: 400 });
  }

  // Collect active bookings on those batches.
  const bookings = await prisma.booking.findMany({
    where: {
      batchId: { in: batchIds },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    select: { id: true, amount: true, mode: true, refundAmount: true },
  });

  // Create the CancellationRequest first so refunds can link to it.
  const cancellation = await prisma.cancellationRequest.create({
    data: {
      providerId: provider.id,
      classId: cls.id,
      batchId: scope === "BATCH" ? batchId : null,
      scope,
      reason: reason.trim(),
      affectedBookings: bookings.length,
      status: "PROCESSING",
    },
  });

  // Walk every booking: cancel, refund the full remaining amount (amount - already-refunded).
  let totalRefund = 0;
  for (const bk of bookings) {
    await prisma.booking.update({
      where: { id: bk.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    if (bk.mode !== "TRIAL" && bk.amount > 0) {
      const remaining = Math.max(0, bk.amount - bk.refundAmount);
      if (remaining > 0) {
        totalRefund += remaining;
        await prisma.refund.create({
          data: {
            cancellationId: cancellation.id,
            bookingId: bk.id,
            amount: remaining,
            status: "QUEUED",
            method: "ORIGINAL",
          },
        });
        await prisma.booking.update({
          where: { id: bk.id },
          data: { refundAmount: { increment: remaining }, status: "REFUNDED" },
        });
      }
    }
  }

  // Zero out enrollment counters on affected batches.
  await prisma.batch.updateMany({
    where: { id: { in: batchIds } },
    data: { enrolled: 0 },
  });

  // Archive the class when the cancellation is total.
  if (scope === "WORKSHOP" || scope === "COURSE") {
    await prisma.class.update({
      where: { id: cls.id },
      data: { status: "ARCHIVED" },
    });
  }

  await prisma.cancellationRequest.update({
    where: { id: cancellation.id },
    data: { totalRefund, completedAt: new Date(), status: "COMPLETED" },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "CANCELLATION_PROCESSED",
      title: `${scope.charAt(0) + scope.slice(1).toLowerCase()} cancellation confirmed`,
      body: `${bookings.length} booking(s) cancelled. ₹${totalRefund} queued for refund over 5–7 business days.`,
    },
  });

  return NextResponse.json({
    ok: true,
    cancellationId: cancellation.id,
    affectedBookings: bookings.length,
    totalRefund,
    scope,
  });
}

/**
 * GET /api/cancellations
 * History for the current provider.
 */
export async function GET() {
  const { provider } = await requireProvider();
  const history = await prisma.cancellationRequest.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: "desc" },
    include: {
      class: { select: { title: true, type: true } },
      batch: { select: { name: true } },
      refunds: { select: { id: true, status: true } },
    },
    take: 50,
  });
  return NextResponse.json({ history });
}
