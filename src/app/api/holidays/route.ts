import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addClassDays,
  isClassDay,
  isCompensation,
  perStudentRefund,
} from "@/lib/cancellation";

/**
 * POST /api/holidays
 * Declare a holiday scoped to a batch, a class, or all the provider's batches.
 *
 * body: {
 *   date: "YYYY-MM-DD",             // required
 *   reason?: string,
 *   scope: "ALL" | "CLASS" | "BATCH",
 *   classId?: string,               // required when scope=CLASS or BATCH
 *   batchId?: string,               // required when scope=BATCH
 *   compensation?: "EXTEND" | "REFUND" | "NONE"  // defaults to EXTEND
 * }
 */
export async function POST(req: Request) {
  const { user, provider } = await requireProvider();
  const body = await req.json().catch(() => ({}));
  const { date, reason, scope, classId, batchId, compensation } = body ?? {};

  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }
  const holidayDate = new Date(date);
  if (Number.isNaN(holidayDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  // Refuse past dates (you can't declare a holiday for yesterday).
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (holidayDate < today) {
    return NextResponse.json({ error: "Date is in the past" }, { status: 400 });
  }
  const comp = isCompensation(compensation) ? compensation : "EXTEND";

  // Resolve scope → target batches.
  let targetBatches: { id: string; classId: string; classDaysCsv: string | null; pricePer4Weeks: number }[] = [];

  if (scope === "BATCH") {
    if (!batchId) return NextResponse.json({ error: "batchId required for scope=BATCH" }, { status: 400 });
    const b = await prisma.batch.findFirst({
      where: { id: batchId, class: { providerId: provider.id } },
      select: { id: true, classId: true, classDaysCsv: true, pricePer4Weeks: true },
    });
    if (!b) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    targetBatches = [b];
  } else if (scope === "CLASS") {
    if (!classId) return NextResponse.json({ error: "classId required for scope=CLASS" }, { status: 400 });
    const cls = await prisma.class.findFirst({
      where: { id: classId, providerId: provider.id },
      select: {
        id: true,
        batches: { select: { id: true, classId: true, classDaysCsv: true, pricePer4Weeks: true } },
      },
    });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    targetBatches = cls.batches;
  } else {
    // scope === "ALL" (default)
    const batches = await prisma.batch.findMany({
      where: { class: { providerId: provider.id } },
      select: { id: true, classId: true, classDaysCsv: true, pricePer4Weeks: true },
    });
    targetBatches = batches;
  }

  // For each batch, check if the date is a scheduled class day. Skip batches where it isn't.
  const affected = targetBatches.filter((b) => isClassDay(holidayDate, b.classDaysCsv));
  if (affected.length === 0) {
    return NextResponse.json(
      {
        error:
          "This date is not a scheduled class day for the selected scope. No sessions would be affected.",
      },
      { status: 400 },
    );
  }

  // Persist the Holiday record(s) and apply compensation to affected bookings.
  // One Holiday row per affected batch (so per-batch scope is queryable).
  const createdIds: string[] = [];
  let totalAffectedBookings = 0;
  let totalRefundQueued = 0;

  for (const b of affected) {
    const holiday = await prisma.holiday.create({
      data: {
        providerId: provider.id,
        classId: b.classId,
        batchId: b.id,
        date: holidayDate,
        reason: reason || null,
        affectsAll: scope === "ALL",
        compensation: comp,
        sessionsAffected: 1,
      },
    });
    createdIds.push(holiday.id);

    // Affected bookings = active enrollments in this batch.
    const bookings = await prisma.booking.findMany({
      where: {
        batchId: b.id,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      select: { id: true, amount: true, extendedUntil: true, createdAt: true, mode: true },
    });

    for (const bk of bookings) {
      totalAffectedBookings += 1;
      if (comp === "EXTEND") {
        const base = bk.extendedUntil ?? bk.createdAt;
        const newEnd = addClassDays(base, b.classDaysCsv, 1);
        await prisma.booking.update({
          where: { id: bk.id },
          data: { extendedUntil: newEnd },
        });
      } else if (comp === "REFUND" && bk.mode !== "TRIAL") {
        const refundAmt = perStudentRefund(b.pricePer4Weeks, 1);
        if (refundAmt > 0) {
          totalRefundQueued += refundAmt;
          await prisma.refund.create({
            data: {
              bookingId: bk.id,
              amount: refundAmt,
              status: "QUEUED",
              method: "ORIGINAL",
            },
          });
          await prisma.booking.update({
            where: { id: bk.id },
            data: { refundAmount: { increment: refundAmt } },
          });
        }
      }
      // comp === "NONE" → no booking mutation.
    }
  }

  // Fire a provider-side notification so they see what just happened.
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "HOLIDAY_DECLARED",
      title: `Holiday declared for ${holidayDate.toDateString()}`,
      body:
        comp === "REFUND"
          ? `${totalAffectedBookings} booking(s) affected. ₹${totalRefundQueued} queued for refund.`
          : comp === "EXTEND"
          ? `${totalAffectedBookings} booking(s) extended by one session.`
          : `${totalAffectedBookings} booking(s) marked as holiday with no compensation.`,
    },
  });

  return NextResponse.json({
    ok: true,
    holidayIds: createdIds,
    affectedBookings: totalAffectedBookings,
    totalRefundQueued,
    compensation: comp,
  });
}

/**
 * GET /api/holidays
 * List holidays for the current provider. Optional ?batchId= and ?classId= filters.
 */
export async function GET(req: Request) {
  const { provider } = await requireProvider();
  const url = new URL(req.url);
  const batchId = url.searchParams.get("batchId") ?? undefined;
  const classId = url.searchParams.get("classId") ?? undefined;
  const holidays = await prisma.holiday.findMany({
    where: {
      providerId: provider.id,
      ...(batchId ? { batchId } : {}),
      ...(classId ? { classId } : {}),
    },
    orderBy: { date: "asc" },
    include: { batch: { select: { name: true } }, class: { select: { title: true } } },
  });
  return NextResponse.json({ holidays });
}
