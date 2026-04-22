import { NextResponse } from "next/server";
import { requireUser, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const existing = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (existing) {
    const updated = await prisma.provider.update({
      where: { id: existing.id },
      data: { instituteName, bio, area, address, upiId },
    });
    return NextResponse.json({ ok: true, provider: updated });
  }

  // Generate next provider code
  const count = await prisma.provider.count();
  const providerCode = nextProviderCode(count + 1);

  const provider = await prisma.provider.create({
    data: {
      userId: user.id,
      providerCode,
      instituteName,
      bio,
      area,
      address,
      upiId,
    },
  });

  // Promote role
  await prisma.user.update({ where: { id: user.id }, data: { role: "PROVIDER" } });

  return NextResponse.json({ ok: true, provider });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  const body = await req.json();
  const { name, email, instituteName, bio, area, address, upiId } = body ?? {};

  if (name !== undefined || email !== undefined) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email || null }),
      },
    });
  }

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "No provider profile" }, { status: 404 });

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      ...(instituteName !== undefined && { instituteName }),
      ...(bio !== undefined && { bio }),
      ...(area !== undefined && { area }),
      ...(address !== undefined && { address }),
      ...(upiId !== undefined && { upiId }),
    },
  });

  return NextResponse.json({ ok: true, provider: updated });
}
