import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, deliverOtp, isDevMode } from "@/lib/otp";

// Simple DB-backed rate limiting (no Redis).
// We count recent rows in the OtpCode table.
//   - Per identifier (the actual email/phone the user typed): 3 sends / 10 min
//   - Per IP (tracked via synthetic marker rows prefixed `__ip:`): 10 sends / hour
const MAX_PER_IDENTIFIER_10MIN = 3;
const MAX_PER_IP_1HOUR = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{8,15}$/;

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
    if (!["whatsapp", "sms", "email"].includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    // Validate identifier shape for the channel
    const id = String(identifier).trim();
    if (channel === "email") {
      if (!EMAIL_RE.test(id)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }
    } else {
      // whatsapp / sms
      if (!PHONE_RE.test(id.replace(/\s+/g, ""))) {
        return NextResponse.json({ error: "Please enter a valid phone number (with country code)." }, { status: 400 });
      }
    }

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
      const normPhone = id.replace(/\s+/g, "");
      const blacklisted = await prisma.phoneBlacklist.findUnique({ where: { phone: normPhone } });
      if (blacklisted) {
        return NextResponse.json(
          { error: "This number cannot be used to sign in. Contact support." },
          { status: 403 },
        );
      }
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
          role: role ?? "STUDENT",
          expiresAt: new Date(now + 60 * 60 * 1000),
        },
      });
    }

    const code = generateOtp(6);
    const expiresAt = new Date(now + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        identifier: id,
        code,
        channel,
        role: role ?? "STUDENT",
        expiresAt,
      },
    });

    await deliverOtp(channel as "email" | "whatsapp" | "sms", id, code);

    return NextResponse.json({
      ok: true,
      // Only leak the code back to the client when we're in dev mode
      // (no real delivery happened), so users aren't locked out during local dev.
      devCode: isDevMode() ? code : undefined,
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
