import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mock KYC upload — in production, this would handle file upload + verification
export async function POST(req: Request) {
  const { provider } = await requireProvider();
  const { docType } = await req.json();

  // Simulate auto-approval for demo: mark as VERIFIED
  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      kycStatus: "VERIFIED",
      kycDocType: docType ?? "Aadhaar",
      kycVerifiedAt: new Date(),
      upiVerified: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: provider.userId,
      type: "KYC_APPROVED",
      title: "KYC approved",
      body: `Your ${docType ?? "ID"} was verified. You can now accept bookings.`,
    },
  });

  return NextResponse.json({ ok: true, provider: updated });
}
