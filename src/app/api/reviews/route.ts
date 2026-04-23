import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const { classId, rating, comment } = body ?? {};

  // Validate inputs
  if (!classId || !rating || !comment?.trim()) {
    return NextResponse.json({ error: "classId, rating and comment are required." }, { status: 400 });
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }

  // Verify the user has an active booking for this class
  const booking = await prisma.booking.findFirst({
    where: {
      userId: user.id,
      classId,
      status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
    },
  });
  if (!booking) {
    return NextResponse.json(
      { error: "You can only review a class you have booked." },
      { status: 403 }
    );
  }

  // Prevent duplicate reviews
  const existing = await prisma.review.findFirst({
    where: { userId: user.id, classId },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this class." }, { status: 409 });
  }

  // Create review and update class aggregate stats in a transaction
  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: { classId, userId: user.id, rating, comment: comment.trim() },
    });

    // Recalculate avg rating from all reviews for this class
    const agg = await tx.review.aggregate({
      where: { classId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await tx.class.update({
      where: { id: classId },
      data: {
        rating: agg._avg.rating ?? rating,
        reviewsCount: agg._count._all,
      },
    });

    return r;
  });

  return NextResponse.json({ ok: true, review });
}
