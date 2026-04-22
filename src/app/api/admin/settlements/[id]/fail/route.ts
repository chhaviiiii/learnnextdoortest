import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  reason: z.string().trim().min(10).max(500),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Reason is required (min 10 characters) when marking a settlement failed." },
      { status: 400 },
    );
  }
  const { reason } = parsed.data;

  const settlement = await prisma.settlement.findUnique({
    where: { id: params.id },
    include: { provider: { select: { userId: true } } },
  });
  if (!settlement) return NextResponse.json({ error: "Settlement not found." }, { status: 404 });

  if (settlement.status === "PAID") {
    return NextResponse.json({ error: "Can't fail a settlement that is already paid." }, { status: 400 });
  }
  if (settlement.status === "FAILED") {
    return NextResponse.json({ error: "Settlement is already marked failed." }, { status: 400 });
  }

  const before = { status: settlement.status, notes: settlement.notes };

  await prisma.$transaction(async (tx) => {
    await tx.settlement.update({
      where: { id: settlement.id },
      data: { status: "FAILED", notes: reason },
    });
    await tx.notification.create({
      data: {
        userId: settlement.provider.userId,
        type: "SETTLEMENT_FAILED",
        title: "Payout failed",
        body: `Your settlement ${settlement.code.toUpperCase()} could not be paid out. Reason: ${reason}. Our team will retry shortly — please verify your payout details.`,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "PAYMENTS",
    action: "MARK_SETTLEMENT_FAILED",
    entityType: "Settlement",
    entityId: settlement.id,
    before,
    after: { status: "FAILED", notes: reason },
    reason,
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, status: "FAILED" });
}
