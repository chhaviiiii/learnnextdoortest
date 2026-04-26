import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { requireProvider } from "@/lib/auth";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const { provider } = await requireProvider();
  const formData = await req.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Upload up to ${MAX_FILES} images at a time.` }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "classes");
  await fs.mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are supported." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Each image must be 5MB or smaller." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${provider.providerCode}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${ext}`;
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    urls.push(`/uploads/classes/${filename}`);
  }

  return NextResponse.json({ ok: true, urls });
}
