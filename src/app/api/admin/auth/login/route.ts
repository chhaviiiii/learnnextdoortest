import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  adminIpFromRequest,
  adminUserAgent,
  createAdminSession,
  ensureSuperAdminSeeded,
  verifyAdminPassword,
} from "@/lib/admin-auth";

const LoginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

// Simple in-memory throttle (per-username). Resets on process restart.
// Sufficient for early MVP; move to persistent store before scale.
const ATTEMPT_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; firstAt: number }>();

function recordAttempt(username: string): { blocked: boolean; waitMs?: number } {
  const now = Date.now();
  const entry = attempts.get(username);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(username, { count: 1, firstAt: now });
    return { blocked: false };
  }
  entry.count += 1;
  if (entry.count > ATTEMPT_LIMIT) {
    return { blocked: true, waitMs: WINDOW_MS - (now - entry.firstAt) };
  }
  return { blocked: false };
}

function clearAttempts(username: string) {
  attempts.delete(username);
}

export async function POST(req: Request) {
  // On-demand seed so deploys don't need a separate seed step
  await ensureSuperAdminSeeded().catch(() => {});

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }
  const { username, password } = parsed.data;

  const throttle = recordAttempt(username);
  if (throttle.blocked) {
    return NextResponse.json(
      {
        error: `Too many failed attempts. Try again in ${Math.ceil((throttle.waitMs ?? 0) / 60000)} minute(s).`,
      },
      { status: 429 },
    );
  }

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin || admin.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const ok = await verifyAdminPassword(password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  clearAttempts(username);
  await createAdminSession(admin.id, adminIpFromRequest(), adminUserAgent());

  return NextResponse.json({
    ok: true,
    mustChangePw: admin.mustChangePw,
    role: admin.role,
  });
}
