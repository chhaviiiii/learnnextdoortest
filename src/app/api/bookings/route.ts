import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

class BookingError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export async function POST(req: Request) {
  const user = await requireUser();
  const { classId, batchId, mode } = await req.json();
  if (!classId || !batchId) {
    return NextResponse.json({ error: "classId and batchId are required" }, { status: 400 });
  }

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { class: { include: { provider: true } } },
  });
  if (!batch || batch.classId !== classId) {
    return NextResponse.json({ error: "Invalid batch" }, { status: 400 });
  }
  if (
    batch.class.status !== "ACTIVE" ||
    batch.class.liveStatus !== "APPROVED" ||
    batch.class.provider.kycStatus !== "VERIFIED"
  ) {
    return NextResponse.json({ error: "This class is not currently accepting bookings" }, { status: 400 });
  }
  if (batch.class.provider.userId === user.id) {
    return NextResponse.json({ error: "Providers cannot book their own listing." }, { status: 400 });
  }
  if (batch.enrolled >= batch.maxStudents) {
    return NextResponse.json({ error: "This batch is sold out" }, { status: 400 });
  }

  const isTrial = mode === "TRIAL" && batch.freeTrialEnabled;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findFirst({
        where: {
          userId: user.id,
          batchId,
          status: { in: ["CONFIRMED", "PENDING"] },
        },
      });
      if (existing) {
        throw new BookingError("You already have an active booking for this batch.", 409);
      }

      const capacity = await tx.batch.updateMany({
        where: { id: batchId, enrolled: { lt: batch.maxStudents } },
        data: { enrolled: { increment: 1 } },
      });
      if (capacity.count === 0) {
        throw new BookingError("This batch is sold out.", 409);
      }

      const created = await tx.booking.create({
        data: {
          userId: user.id,
          classId,
          batchId,
          mode: isTrial ? "TRIAL" : "ENROLL",
          amount: isTrial ? 0 : batch.pricePer4Weeks,
          status: "CONFIRMED",
        },
      });

      await tx.notification.create({
        data: {
          userId: batch.class.provider.userId,
          type: "NEW_ENROLLMENT",
          title: "New enrollment",
          body: `${user.name ?? "A student"} enrolled in ${batch.class.title} (${batch.name}).`,
        },
      });

      return created;
    });

    return NextResponse.json({ ok: true, booking });
  } catch (err: any) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
