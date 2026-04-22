import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, deviceFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { channel, identifier, code, role, name } = await req.json();
    if (!identifier || !code) {
      return NextResponse.json({ error: "identifier and code required" }, { status: 400 });
    }

    // Find most recent unused OTP for this identifier
    const otp = await prisma.otpCode.findFirst({
      where: { identifier, used: false, expiresAt: { gt: new Date() } },
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

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Find or create user
    const isEmail = channel === "email" || identifier.includes("@");
    const where = isEmail ? { email: identifier } : { phone: identifier };
    let user = await prisma.user.findUnique({ where });
    if (!user) {
      user = await prisma.user.create({
        data: {
          ...(isEmail ? { email: identifier } : { phone: identifier }),
          name: name ?? null,
          role: role ?? "STUDENT",
        },
      });
    } else if (name && !user.name) {
      user = await prisma.user.update({ where: { id: user.id }, data: { name } });
    }

    // Suspended accounts cannot sign in — matches PRD §6 user suspension lifecycle.
    if (user.suspended) {
      return NextResponse.json(
        {
          error: "This account has been suspended. Contact support for assistance.",
        },
        { status: 403 },
      );
    }

    // Promote to PROVIDER role if signing in via provider flow
    if (role === "PROVIDER" && user.role === "STUDENT") {
      user = await prisma.user.update({ where: { id: user.id }, data: { role: "PROVIDER" } });
    }

    await createSession(user.id, deviceFromRequest());

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to verify OTP" }, { status: 500 });
  }
}
