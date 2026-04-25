import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Basic Indian mobile number validation (10 digits, starts with 6-9)
const PHONE_RE = /^[6-9]\d{9}$/;

export async function PATCH(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const { name, email, phone } = body ?? {};

  // Validate phone format if provided
  if (phone !== undefined && phone !== "" && !PHONE_RE.test(phone)) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit Indian mobile number." },
      { status: 400 }
    );
  }

  if (name === undefined && email === undefined && phone === undefined) {
    return NextResponse.json({ error: "No fields provided to update." }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
      },
    });
    return NextResponse.json({ ok: true, user: updated });
  } catch (err: any) {
    // Prisma unique constraint violation
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "That phone number is already linked to another account." },
        { status: 409 }
      );
    }
    throw err;
  }
}
