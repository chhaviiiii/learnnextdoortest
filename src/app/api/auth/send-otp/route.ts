import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, deliverOtp, isDevMode } from "@/lib/otp";
import { isOtpChannel, normalizeOtpIdentifier, normalizeOtpRole } from "@/lib/identifiers";

// Simple DB-backed rate limiting (no Redis).
// We count recent rows in the OtpCode table.
//   - Per identifier (the actual email/phone the user typed): 3 sends / 10 min
//   - Per IP (tracked via synthetic marker rows prefixed `__ip:`): 10 sends / hour
const MAX_PER_IDENTIFIER_10MIN = 3;
const MAX_PER_IP_1HOUR = 10;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const { channel, identifier, role } = await req.json();

    if (!channel || !identifier) {
      return NextResponse.json({ error: "channel and identifier required" }, { status: 400 });
    }
    if (!isOtpChannel(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const normalizedRole = normalizeOtpRole(role);
    const parsed = normalizeOtpIdentifier(channel, identifier);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const id = parsed.value;

    // Admin-enforced blacklists — return a generic error so the UI doesn't reveal
    // that a specific identifier was banned (prevents enumeration).
    if (channel === "email") {
      const blacklisted = await prisma.emailBlacklist.findUnique({ where: { email: id } });
      if (blacklisted) {
        return NextResponse.json(
          { error: "This address cannot be used to sign in. Contact support." },
          { status: 403 },
        );
      }
    } else {
      const blacklisted = await prisma.phoneBlacklist.findUnique({ where: { phone: id } });
      if (blacklisted) {
        return NextResponse.json(
          { error: "This number cannot be used to sign in. Contact support." },
          { status: 403 },
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: channel === "email" ? { email: id } : { phone: id },
      include: { provider: true },
    });
    if (existingUser?.suspended) {
      return NextResponse.json(
        { error: "This account has been suspended. Contact support for assistance." },
        { status: 403 },
      );
    }
    if (normalizedRole === "PROVIDER" && existingUser?.role === "STUDENT" && !existingUser.provider) {
      return NextResponse.json(
        { error: "This login is already registered as a learner. Use a separate provider email/phone or contact support." },
        { status: 409 },
      );
    }

    const now = Date.now();
    const tenMinAgo = new Date(now - 10 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const ip = clientIp(req);

    // Per-identifier rate limit
    const perIdentifier = await prisma.otpCode.count({
      where: { identifier: id, createdAt: { gt: tenMinAgo } },
    });
    if (perIdentifier >= MAX_PER_IDENTIFIER_10MIN) {
      return NextResponse.json(
        { error: "Too many codes requested for this address. Please wait ~10 minutes and try again." },
        { status: 429 }
      );
    }

    // Per-IP rate limit (best effort — counts marker rows)
    if (ip !== "unknown") {
      const ipMarker = `__ip:${ip}`;
      const perIp = await prisma.otpCode.count({
        where: { identifier: ipMarker, createdAt: { gt: oneHourAgo } },
      });
      if (perIp >= MAX_PER_IP_1HOUR) {
        return NextResponse.json(
          { error: "Too many OTP requests from this network. Please try again later." },
          { status: 429 }
        );
      }
      // Leave a marker row so future requests from the same IP count
      await prisma.otpCode.create({
        data: {
          identifier: ipMarker,
          code: "000000",
          channel,
          role: normalizedRole,
          expiresAt: new Date(now + 60 * 60 * 1000),
        },
      });
    }

    const code = generateOtp(6);
    const expiresAt = new Date(now + 10 * 60 * 1000);

    const otp = await prisma.otpCode.create({
      data: {
        identifier: id,
        code,
        channel,
        role: normalizedRole,
        expiresAt,
      },
    });

    try {
      await deliverOtp(channel, id, code);
    } catch (deliveryError) {
      await prisma.otpCode
        .update({
          where: { id: otp.id },
          data: { used: true, attempts: 5 },
        })
        .catch(() => null);
      throw deliveryError;
    }

    return NextResponse.json({
      ok: true,
      // Only leak the code back to the client when we're in dev mode
      // (no real delivery happened), so users aren't locked out during local dev.
      devCode: isDevMode(channel) ? code : undefined,
    });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[send-otp] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to send OTP" },
      { status: 500 }
    );
  }
}
