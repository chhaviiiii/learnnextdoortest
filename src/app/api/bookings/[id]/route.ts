import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking || booking.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ ok: true });
  }
  await prisma.booking.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });
  // Release the seat
  await prisma.batch.update({
    where: { id: booking.batchId },
    data: { enrolled: { decrement: 1 } },
  });
  return NextResponse.json({ ok: true });
}
