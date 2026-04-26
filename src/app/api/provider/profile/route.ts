import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeOtpIdentifier } from "@/lib/identifiers";

function nextProviderCode(n: number) {
  return "P" + String(n).padStart(3, "0");
}

// Create or upsert provider profile for current user
export async function POST(req: Request) {
  const user = await requireUser();
  const data = await req.json();
  const { instituteName, bio, area, address, upiId } = data ?? {};
  if (!instituteName) {
    return NextResponse.json({ error: "instituteName required" }, { status: 400 });
  }
  if (user.role !== "PROVIDER") {
    return NextResponse.json(
      { error: "Use a provider sign-up session to create a provider profile." },
      { status: 403 },
    );
  }

  let upiVerified = false;
  if (upiId) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId)) {
      return NextResponse.json({ error: "Invalid UPI ID format. Must be formatted like name@bank" }, { status: 400 });
    }
    upiVerified = true;
  }

  const existing = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (existing) {
    const updated = await prisma.provider.update({
      where: { id: existing.id },
      data: { instituteName, bio, area, address, upiId, upiVerified },
    });
    return NextResponse.json({ ok: true, provider: updated });
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const count = await prisma.provider.count();
    const providerCode = nextProviderCode(count + attempt + 1);
    try {
      const provider = await prisma.$transaction(async (tx) => {
        const created = await tx.provider.create({
          data: {
            userId: user.id,
            providerCode,
            instituteName,
            bio,
            area,
            address,
            upiId,
            upiVerified,
          },
        });
        await tx.user.update({ where: { id: user.id }, data: { role: "PROVIDER" } });
        return created;
      });

      return NextResponse.json({ ok: true, provider });
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }
  }

  return NextResponse.json(
    { error: "Could not allocate provider code. Please try again." },
    { status: 409 },
  );
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  const body = await req.json();
  const { name, email, phone, instituteName, bio, area, address, upiId } = body ?? {};

  const emailValue =
    email === undefined || email === ""
      ? email
      : normalizeOtpIdentifier("email", email);
  if (emailValue && typeof emailValue === "object" && !emailValue.ok) {
    return NextResponse.json({ error: emailValue.error }, { status: 400 });
  }

  const phoneValue =
    phone === undefined || phone === ""
      ? phone
      : normalizeOtpIdentifier("sms", phone);
  if (phoneValue && typeof phoneValue === "object" && !phoneValue.ok) {
    return NextResponse.json({ error: phoneValue.error }, { status: 400 });
  }

  if (name !== undefined || email !== undefined || phone !== undefined) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && {
            email: email === "" ? null : typeof emailValue === "object" && emailValue.ok ? emailValue.value : null,
          }),
          ...(phone !== undefined && {
            phone: phone === "" ? null : typeof phoneValue === "object" && phoneValue.ok ? phoneValue.value : null,
          }),
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return NextResponse.json({ error: "That phone number is already linked to another account." }, { status: 409 });
      }
      throw err;
    }
  }

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "No provider profile" }, { status: 404 });

  let upiVerifiedOutput: boolean | undefined = undefined;
  if (upiId !== undefined) {
    if (upiId === "") {
      upiVerifiedOutput = false;
    } else {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(upiId)) {
        return NextResponse.json({ error: "Invalid UPI ID format. Must be formatted like name@bank" }, { status: 400 });
      }
      upiVerifiedOutput = true;
    }
  }

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      ...(instituteName !== undefined && { instituteName }),
      ...(bio !== undefined && { bio }),
      ...(area !== undefined && { area }),
      ...(address !== undefined && { address }),
      ...(upiId !== undefined && { upiId }),
      ...(upiVerifiedOutput !== undefined && { upiVerified: upiVerifiedOutput }),
    },
  });

  return NextResponse.json({ ok: true, provider: updated });
}
