import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REVOKE"]),
  reason: z.string().trim().min(10).max(500).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action payload." }, { status: 400 });
  }
  const { action, reason } = parsed.data;
  if (action !== "APPROVE" && !reason) {
    return NextResponse.json({ error: "Reason is required for reject/revoke." }, { status: 400 });
  }

  const provider = await prisma.provider.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!provider) return NextResponse.json({ error: "Provider not found." }, { status: 404 });

  const before = {
    kycStatus: provider.kycStatus,
    kycVerifiedAt: provider.kycVerifiedAt,
    kycRejectionReason: provider.kycRejectionReason,
  };

  let nextStatus: string;
  let updateData: Record<string, unknown> = {};
  let notifType: string;
  let notifTitle: string;
  let notifBody: string;

  if (action === "APPROVE") {
    if (provider.kycStatus === "VERIFIED") {
      return NextResponse.json({ error: "Provider is already verified." }, { status: 400 });
    }
    nextStatus = "VERIFIED";
    updateData = {
      kycStatus: "VERIFIED",
      kycVerifiedAt: new Date(),
      kycRejectionReason: null,
      kycRevokedAt: null,
    };
    notifType = "KYC_APPROVED";
    notifTitle = "KYC approved";
    notifBody = "Your KYC has been verified. The verified badge is now active on your listings.";
  } else if (action === "REJECT") {
    if (provider.kycStatus === "REJECTED") {
      return NextResponse.json({ error: "Provider KYC is already rejected." }, { status: 400 });
    }
    nextStatus = "REJECTED";
    updateData = {
      kycStatus: "REJECTED",
      kycRejectionReason: reason,
      kycVerifiedAt: null,
    };
    notifType = "KYC_REJECTED";
    notifTitle = "KYC rejected";
    notifBody = `Your KYC was rejected. Reason: ${reason}. Please resubmit corrected documents.`;
  } else {
    // REVOKE
    if (provider.kycStatus !== "VERIFIED") {
      return NextResponse.json({ error: "Can only revoke a verified KYC." }, { status: 400 });
    }
    nextStatus = "REJECTED";
    updateData = {
      kycStatus: "REJECTED",
      kycRejectionReason: reason,
      kycRevokedAt: new Date(),
      kycVerifiedAt: null,
    };
    notifType = "KYC_REVOKED";
    notifTitle = "KYC approval revoked";
    notifBody = `Your KYC approval has been revoked. Reason: ${reason}. The verified badge has been removed. Please resubmit documents.`;
  }

  await prisma.$transaction(async (tx) => {
    await tx.provider.update({ where: { id: provider.id }, data: updateData });
    await tx.notification.create({
      data: {
        userId: provider.userId,
        type: notifType,
        title: notifTitle,
        body: notifBody,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "KYC",
    action: action === "APPROVE" ? "APPROVE_KYC" : action === "REJECT" ? "REJECT_KYC" : "REVOKE_KYC",
    entityType: "Provider",
    entityId: provider.id,
    before,
    after: { kycStatus: nextStatus, reason: reason ?? null },
    reason: reason ?? null,
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, kycStatus: nextStatus });
}
