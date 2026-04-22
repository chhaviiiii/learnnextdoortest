import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  action: z.enum(["SUSPEND", "REINSTATE"]),
  reason: z.string().trim().min(10).max(500).optional(),
  blacklist: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const { action, reason, blacklist } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admin accounts are managed from Settings → Admin Credentials." },
      { status: 400 },
    );
  }

  if (action === "SUSPEND") {
    if (user.suspended) {
      return NextResponse.json({ error: "User is already suspended." }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: "Reason is required to suspend." }, { status: 400 });
    }

    const before = { suspended: user.suspended };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          suspended: true,
          suspendedAt: new Date(),
          suspensionReason: reason,
        },
      });
      // Kill all active sessions — matches PRD §6 "immediately blocks sign-in"
      await tx.authSession.deleteMany({ where: { userId: user.id } });
      // Notify the user of the suspension
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "USER_ACCOUNT_SUSPENDED",
          title: "Account suspended",
          body: `Your LearnNextDoor account has been suspended. Reason: ${reason}. Contact support for assistance.`,
        },
      });
      if (blacklist) {
        if (user.email) {
          await tx.emailBlacklist.upsert({
            where: { email: user.email },
            create: { email: user.email, reason: reason, addedBy: admin.id },
            update: { reason: reason, addedBy: admin.id },
          });
        }
        if (user.phone) {
          await tx.phoneBlacklist.upsert({
            where: { phone: user.phone },
            create: { phone: user.phone, reason: reason, addedBy: admin.id },
            update: { reason: reason, addedBy: admin.id },
          });
        }
      }
    });

    await writeAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      module: "USERS",
      action: "SUSPEND_USER",
      entityType: "User",
      entityId: user.id,
      before,
      after: { suspended: true, blacklistApplied: !!blacklist },
      reason: reason,
      ip: adminIpFromRequest(),
    });

    return NextResponse.json({ ok: true, suspended: true });
  }

  // REINSTATE
  if (!user.suspended) {
    return NextResponse.json({ error: "User is not suspended." }, { status: 400 });
  }

  const before = { suspended: user.suspended, suspensionReason: user.suspensionReason };
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { suspended: false, suspendedAt: null, suspensionReason: null },
    });
    if (user.email) await tx.emailBlacklist.deleteMany({ where: { email: user.email } });
    if (user.phone) await tx.phoneBlacklist.deleteMany({ where: { phone: user.phone } });
    await tx.notification.create({
      data: {
        userId: user.id,
        type: "USER_ACCOUNT_REINSTATED",
        title: "Account reinstated",
        body: "Welcome back. Your LearnNextDoor account has been reinstated.",
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "USERS",
    action: "REINSTATE_USER",
    entityType: "User",
    entityId: user.id,
    before,
    after: { suspended: false },
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, suspended: false });
}
