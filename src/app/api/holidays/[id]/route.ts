import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/holidays/:id
 * Undo a declared holiday. Safe ONLY while the compensation is still reversible:
 *   - EXTEND: we don't rewind booking.extendedUntil here (a batch-level holiday
 *     may have multiple shifts stacked; safer to leave the date in place and
 *     let the provider adjust manually). We still remove the Holiday row so
 *     future reporting is correct.
 *   - REFUND: any still-QUEUED refunds for this holiday's batch+date are voided.
 *     Refunds already in PROCESSING/COMPLETED are left alone.
 *   - NONE: nothing to reverse.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { provider } = await requireProvider();
  const holiday = await prisma.holiday.findFirst({
    where: { id: params.id, providerId: provider.id },
  });
  if (!holiday) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If we queued refunds, try to void the ones that haven't been processed yet.
  // We can identify them by looking at refunds on bookings for this batch
  // that were created after the holiday row was created.
  if (holiday.compensation === "REFUND" && holiday.batchId) {
    const bookings = await prisma.booking.findMany({
      where: { batchId: holiday.batchId },
      select: { id: true },
    });
    const bookingIds = bookings.map((b) => b.id);
    const reversible = await prisma.refund.findMany({
      where: {
        bookingId: { in: bookingIds },
        status: "QUEUED",
        createdAt: { gte: holiday.createdAt },
      },
    });
    for (const r of reversible) {
      await prisma.refund.update({
        where: { id: r.id },
        data: { status: "FAILED", completedAt: new Date() },
      });
      await prisma.booking.update({
        where: { id: r.bookingId },
        data: { refundAmount: { decrement: r.amount } },
      });
    }
  }

  await prisma.holiday.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
