import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  if (batch.enrolled >= batch.maxStudents) {
    return NextResponse.json({ error: "This batch is sold out" }, { status: 400 });
  }

  const isTrial = mode === "TRIAL" && batch.freeTrialEnabled;

  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      classId,
      batchId,
      mode: isTrial ? "TRIAL" : "ENROLL",
      amount: isTrial ? 0 : batch.pricePer4Weeks,
      status: "CONFIRMED",
    },
  });

  await prisma.batch.update({
    where: { id: batchId },
    data: { enrolled: { increment: 1 } },
  });

  // Notify provider
  await prisma.notification.create({
    data: {
      userId: batch.class.provider.userId,
      type: "NEW_ENROLLMENT",
      title: "New enrollment",
      body: `${user.name ?? "A student"} enrolled in ${batch.class.title} (${batch.name}).`,
    },
  });

  return NextResponse.json({ ok: true, booking });
}
