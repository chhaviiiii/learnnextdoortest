import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "./prisma";

const ADMIN_COOKIE = "lnd_admin_session";
export const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes per PRD §2
const ABSOLUTE_MAX_MS = 12 * 60 * 60 * 1000; // 12-hour absolute cap

function token() {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashAdminPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyAdminPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function validatePasswordStrength(pw: string): { ok: boolean; reason?: string } {
  if (pw.length < 12) return { ok: false, reason: "Password must be at least 12 characters." };
  if (!/[A-Z]/.test(pw)) return { ok: false, reason: "Password must include an uppercase letter." };
  if (!/[a-z]/.test(pw)) return { ok: false, reason: "Password must include a lowercase letter." };
  if (!/[0-9]/.test(pw)) return { ok: false, reason: "Password must include a digit." };
  if (!/[^A-Za-z0-9]/.test(pw)) return { ok: false, reason: "Password must include a symbol." };
  return { ok: true };
}

export async function createAdminSession(adminId: string, ip?: string | null, userAgent?: string | null) {
  // Single-session policy per PRD §2: invalidate any existing sessions first
  await prisma.adminSession.deleteMany({ where: { adminId } });

  const t = token();
  const expiresAt = new Date(Date.now() + ABSOLUTE_MAX_MS);
  await prisma.adminSession.create({
    data: {
      adminId,
      token: t,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
      expiresAt,
    },
  });

  // Cookie is sliding — we'll re-check lastActive vs IDLE_TIMEOUT_MS on every request.
  cookies().set(ADMIN_COOKIE, t, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(ABSOLUTE_MAX_MS / 1000),
    path: "/",
  });

  await prisma.adminUser.update({
    where: { id: adminId },
    data: { lastLoginAt: new Date() },
  });
}

export async function destroyAdminSession() {
  const t = cookies().get(ADMIN_COOKIE)?.value;
  if (t) await prisma.adminSession.deleteMany({ where: { token: t } });
  cookies().delete(ADMIN_COOKIE);
}

export async function getCurrentAdmin() {
  const t = cookies().get(ADMIN_COOKIE)?.value;
  if (!t) return null;
  const session = await prisma.adminSession.findUnique({
    where: { token: t },
    include: { admin: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { id: session.id } });
    return null;
  }
  // Idle timeout enforcement
  const idleMs = Date.now() - session.lastActive.getTime();
  if (idleMs > IDLE_TIMEOUT_MS) {
    await prisma.adminSession.delete({ where: { id: session.id } });
    return null;
  }
  // Suspended admin cannot continue
  if (session.admin.status !== "ACTIVE") {
    await prisma.adminSession.delete({ where: { id: session.id } });
    return null;
  }
  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastActive: new Date() },
  });
  return session.admin;
}

export async function requireAdmin() {
  const a = await getCurrentAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

export async function requireSuperAdmin() {
  const a = await requireAdmin();
  if (a.role !== "SUPER_ADMIN") redirect("/admin");
  return a;
}

export function adminIpFromRequest() {
  const h = headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

export function adminUserAgent() {
  return headers().get("user-agent") ?? null;
}

/**
 * Seed the Super Admin account from env vars if not present.
 * Called on first admin login attempt or via a seed script.
 *
 * ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD / ADMIN_SEED_EMAIL must be set.
 */
export async function ensureSuperAdminSeeded() {
  const username = process.env.ADMIN_SEED_USERNAME;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const email = process.env.ADMIN_SEED_EMAIL;
  const name = process.env.ADMIN_SEED_NAME ?? "Super Admin";
  if (!username || !password) return { seeded: false };

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) return { seeded: false, existing: true };

  const passwordHash = await hashAdminPassword(password);
  await prisma.adminUser.create({
    data: {
      username,
      email: email ?? null,
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      mustChangePw: false, // seed admin is trusted
    },
  });
  return { seeded: true };
}

/**
 * Append an entry to the immutable audit log.
 * Keep snapshot JSON small — pass only the fields that matter.
 */
export async function writeAuditLog(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  ip?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      module: params.module,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeJson: params.before ? JSON.stringify(params.before) : null,
      afterJson: params.after ? JSON.stringify(params.after) : null,
      reason: params.reason ?? null,
      ip: params.ip ?? null,
    },
  });
}
