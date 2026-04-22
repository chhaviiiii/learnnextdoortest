import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  utr: z.string().trim().min(6).max(32),
  notes: z.string().trim().max(500).optional(),
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
  const { utr, notes } = parsed.data;

  const settlement = await prisma.settlement.findUnique({
    where: { id: params.id },
    include: { provider: { select: { userId: true, instituteName: true, providerCode: true } } },
  });
  if (!settlement) return NextResponse.json({ error: "Settlement not found." }, { status: 404 });

  if (settlement.status === "PAID") {
    return NextResponse.json({ error: "Settlement is already marked paid." }, { status: 400 });
  }
  if (settlement.status === "FUTURE") {
    return NextResponse.json(
      { error: "Future settlements can't be paid yet — wait for the cycle to close." },
      { status: 400 },
    );
  }

  const before = { status: settlement.status, utr: settlement.utr, paidAt: settlement.paidAt };

  await prisma.$transaction(async (tx) => {
    await tx.settlement.update({
      where: { id: settlement.id },
      data: {
        status: "PAID",
        utr,
        paidAt: new Date(),
        paidBy: admin.id,
        notes: notes ?? settlement.notes,
      },
    });
    await tx.notification.create({
      data: {
        userId: settlement.provider.userId,
        type: "SETTLEMENT_PROCESSED",
        title: "Payout processed",
        body: `Your settlement ${settlement.code.toUpperCase()} has been paid. UTR: ${utr}. Net credited: ₹${settlement.net.toLocaleString("en-IN")}.`,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "PAYMENTS",
    action: "MARK_SETTLEMENT_PAID",
    entityType: "Settlement",
    entityId: settlement.id,
    before,
    after: { status: "PAID", utr, paidAt: new Date().toISOString() },
    reason: notes ?? null,
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, status: "PAID", utr });
}
