import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().min(10).max(500).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const { action, reason } = parsed.data;

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: { provider: { include: { user: true } } },
  });
  if (!cls) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  if (cls.liveStatus !== "PENDING_APPROVAL") {
    return NextResponse.json(
      { error: `Listing is not pending — current state: ${cls.liveStatus}.` },
      { status: 400 },
    );
  }

  if (action === "APPROVE" && cls.provider.kycStatus !== "VERIFIED") {
    return NextResponse.json(
      { error: "Provider KYC must be verified before listing can go live." },
      { status: 400 },
    );
  }

  if (action === "REJECT" && !reason) {
    return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
  }

  const before = { liveStatus: cls.liveStatus, liveReason: cls.liveReason };
  const after =
    action === "APPROVE"
      ? { liveStatus: "APPROVED", liveReason: null, liveDecidedAt: new Date(), liveDecidedBy: admin.id }
      : { liveStatus: "REJECTED", liveReason: reason!, liveDecidedAt: new Date(), liveDecidedBy: admin.id };

  await prisma.$transaction(async (tx) => {
    await tx.class.update({ where: { id: cls.id }, data: after });
    await tx.notification.create({
      data: {
        userId: cls.provider.userId,
        type: action === "APPROVE" ? "LISTING_APPROVED" : "LISTING_REJECTED",
        title: action === "APPROVE" ? "Listing approved" : "Listing rejected",
        body:
          action === "APPROVE"
            ? `Your listing "${cls.title}" is now live on LearnNextDoor.`
            : `Your listing "${cls.title}" was rejected. Reason: ${reason}. Edit and resubmit to go live.`,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "LISTINGS",
    action: action === "APPROVE" ? "APPROVE_LISTING" : "REJECT_LISTING",
    entityType: "Class",
    entityId: cls.id,
    before,
    after,
    reason: reason ?? null,
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, liveStatus: after.liveStatus });
}
