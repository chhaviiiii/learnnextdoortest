import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, deviceFromRequest } from "@/lib/auth";
import { isOtpChannel, normalizeOtpIdentifier, normalizeOtpRole } from "@/lib/identifiers";

export async function POST(req: Request) {
  try {
    const { channel, identifier, code, role, name } = await req.json();
    if (!channel || !identifier || !code) {
      return NextResponse.json({ error: "channel, identifier and code required" }, { status: 400 });
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

    // Find most recent unused OTP for this exact identifier/channel/role tuple.
    const otp = await prisma.otpCode.findFirst({
      where: {
        identifier: id,
        channel,
        role: normalizedRole,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "OTP not found or expired. Request a new one." }, { status: 400 });
    }

    if (otp.attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts. Request a new OTP." }, { status: 429 });
    }

    if (otp.code !== code) {
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    const isEmail = channel === "email";
    const where = isEmail ? { email: id } : { phone: id };
    let user = await prisma.user.findUnique({ where, include: { provider: true } });

    // Suspended accounts cannot sign in — matches PRD §6 user suspension lifecycle.
    if (user?.suspended) {
      return NextResponse.json(
        {
          error: "This account has been suspended. Contact support for assistance.",
        },
        { status: 403 },
      );
    }

    if (normalizedRole === "PROVIDER" && user?.role === "STUDENT" && !user.provider) {
      return NextResponse.json(
        { error: "This login is already registered as a learner. Use a separate provider email/phone or contact support." },
        { status: 409 },
      );
    }

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          ...(isEmail ? { email: id } : { phone: id }),
          name: name ?? null,
          role: normalizedRole,
        },
        include: { provider: true },
      });
    } else if (name && !user.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name },
        include: { provider: true },
      });
    }

    if (normalizedRole === "PROVIDER" && user.role !== "PROVIDER") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "PROVIDER" },
        include: { provider: true },
      });
    }

    await createSession(user.id, deviceFromRequest());

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to verify OTP" }, { status: 500 });
  }
}
