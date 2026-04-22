import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  utr: z.string().trim().min(6).max(32),
  method: z.enum(["ORIGINAL", "UPI", "MANUAL"]).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload. UTR must be 6–32 characters." },
      { status: 400 },
    );
  }
  const { utr, method } = parsed.data;

  const refund = await prisma.refund.findUnique({
    where: { id: params.id },
    include: {
      booking: {
        include: {
          user: { select: { id: true } },
          class: { select: { title: true } },
        },
      },
    },
  });
  if (!refund) return NextResponse.json({ error: "Refund not found." }, { status: 404 });

  if (refund.status === "COMPLETED") {
    return NextResponse.json({ error: "Refund is already processed." }, { status: 400 });
  }

  const before = { status: refund.status, utr: refund.utr };

  await prisma.$transaction(async (tx) => {
    await tx.refund.update({
      where: { id: refund.id },
      data: {
        status: "COMPLETED",
        utr,
        method: method ?? refund.method,
        completedAt: new Date(),
      },
    });
    await tx.notification.create({
      data: {
        userId: refund.booking.user.id,
        type: "REFUND_PROCESSED",
        title: "Refund processed",
        body: `Your refund of ₹${refund.amount.toLocaleString("en-IN")} for "${refund.booking.class.title}" has been sent. UTR: ${utr}. It should reflect in your account within 3–5 business days.`,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "PAYMENTS",
    action: "PROCESS_REFUND",
    entityType: "Refund",
    entityId: refund.id,
    before,
    after: { status: "COMPLETED", utr, method: method ?? refund.method },
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, status: "COMPLETED", utr });
}
