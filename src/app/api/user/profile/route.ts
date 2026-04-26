import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeOtpIdentifier } from "@/lib/identifiers";

export async function PATCH(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const { name, email, phone } = body ?? {};

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

  if (name === undefined && email === undefined && phone === undefined) {
    return NextResponse.json({ error: "No fields provided to update." }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
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
