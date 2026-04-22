import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  action: z.enum(["BLOCK", "UNBLOCK"]),
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
    include: { provider: { select: { userId: true } } },
  });
  if (!cls) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  if (action === "BLOCK") {
    if (!reason) {
      return NextResponse.json({ error: "Reason is required to block a listing." }, { status: 400 });
    }
    if (cls.liveStatus === "BLOCKED") {
      return NextResponse.json({ error: "Listing is already blocked." }, { status: 400 });
    }
  } else {
    if (cls.liveStatus !== "BLOCKED") {
      return NextResponse.json({ error: "Listing is not blocked." }, { status: 400 });
    }
  }

  const before = { liveStatus: cls.liveStatus, liveReason: cls.liveReason };
  const after =
    action === "BLOCK"
      ? { liveStatus: "BLOCKED", liveReason: reason!, liveDecidedAt: new Date(), liveDecidedBy: admin.id }
      : { liveStatus: "APPROVED", liveReason: null, liveDecidedAt: new Date(), liveDecidedBy: admin.id };

  await prisma.$transaction(async (tx) => {
    await tx.class.update({ where: { id: cls.id }, data: after });
    await tx.notification.create({
      data: {
        userId: cls.provider.userId,
        type: action === "BLOCK" ? "LISTING_BLOCKED" : "LISTING_APPROVED",
        title: action === "BLOCK" ? "Listing blocked" : "Listing reinstated",
        body:
          action === "BLOCK"
            ? `Your listing "${cls.title}" has been blocked by admin. Reason: ${reason}.`
            : `Your listing "${cls.title}" has been reinstated and is now live.`,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "LISTINGS",
    action: action === "BLOCK" ? "BLOCK_LISTING" : "UNBLOCK_LISTING",
    entityType: "Class",
    entityId: cls.id,
    before,
    after,
    reason: reason ?? null,
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, liveStatus: after.liveStatus });
}
