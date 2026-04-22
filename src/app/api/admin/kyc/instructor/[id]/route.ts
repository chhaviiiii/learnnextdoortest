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

  const instructor = await prisma.instructor.findUnique({
    where: { id: params.id },
    include: { provider: { include: { user: true } } },
  });
  if (!instructor) return NextResponse.json({ error: "Instructor not found." }, { status: 404 });

  const before = {
    kycStatus: instructor.kycStatus,
    kycVerifiedAt: instructor.kycVerifiedAt,
    kycRejectionReason: instructor.kycRejectionReason,
  };

  let nextStatus: string;
  let updateData: Record<string, unknown> = {};
  let notifTitle: string;
  let notifBody: string;
  let notifType: string;

  if (action === "APPROVE") {
    if (instructor.kycStatus === "VERIFIED") {
      return NextResponse.json({ error: "Instructor is already verified." }, { status: 400 });
    }
    nextStatus = "VERIFIED";
    updateData = {
      kycStatus: "VERIFIED",
      kycVerifiedAt: new Date(),
      kycRejectionReason: null,
    };
    notifType = "KYC_APPROVED";
    notifTitle = `Instructor KYC approved — ${instructor.name}`;
    notifBody = `KYC for ${instructor.name} has been verified.`;
  } else if (action === "REJECT") {
    if (instructor.kycStatus === "REJECTED") {
      return NextResponse.json({ error: "Instructor KYC is already rejected." }, { status: 400 });
    }
    nextStatus = "REJECTED";
    updateData = {
      kycStatus: "REJECTED",
      kycRejectionReason: reason,
      kycVerifiedAt: null,
    };
    notifType = "KYC_REJECTED";
    notifTitle = `Instructor KYC rejected — ${instructor.name}`;
    notifBody = `KYC for ${instructor.name} was rejected. Reason: ${reason}. Please resubmit corrected documents.`;
  } else {
    if (instructor.kycStatus !== "VERIFIED") {
      return NextResponse.json({ error: "Can only revoke a verified KYC." }, { status: 400 });
    }
    nextStatus = "REJECTED";
    updateData = {
      kycStatus: "REJECTED",
      kycRejectionReason: reason,
      kycVerifiedAt: null,
    };
    notifType = "KYC_REVOKED";
    notifTitle = `Instructor KYC revoked — ${instructor.name}`;
    notifBody = `Instructor ${instructor.name}'s KYC approval has been revoked. Reason: ${reason}.`;
  }

  await prisma.$transaction(async (tx) => {
    await tx.instructor.update({ where: { id: instructor.id }, data: updateData });
    await tx.notification.create({
      data: {
        userId: instructor.provider.userId,
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
    entityType: "Instructor",
    entityId: instructor.id,
    before,
    after: { kycStatus: nextStatus, reason: reason ?? null },
    reason: reason ?? null,
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, kycStatus: nextStatus });
}
