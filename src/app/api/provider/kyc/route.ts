import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { provider } = await requireProvider();
    const formData = await req.formData();
    const docType = formData.get("docType") as string;
    const file = formData.get("file") as File;

    if (!docType || !file) {
      return NextResponse.json({ error: "Document type and file are required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "kyc");
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate safe filename ensuring uniqueness
    const ext = file.name.split('.').pop();
    const safeFilename = `${provider.providerCode}_${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const filePath = path.join(uploadDir, safeFilename);

    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/kyc/${safeFilename}`;

    const updated = await prisma.provider.update({
      where: { id: provider.id },
      data: {
        kycStatus: "PENDING",
        kycDocType: docType,
        kycDocUrl: fileUrl,
        kycSubmittedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: provider.userId,
        type: "KYC_SUBMITTED",
        title: "KYC submitted",
        body: `Your ${docType} was submitted and is pending admin review.`,
      },
    });

    return NextResponse.json({ ok: true, provider: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process KYC upload" }, { status: 500 });
  }
}

