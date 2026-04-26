import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/notifications/[id]  →  mark read/unread
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const read = body.read === undefined ? true : !!body.read;

  const notif = await prisma.notification.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!notif) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { read },
  });
  return NextResponse.json({ ok: true, notification: updated });
}
