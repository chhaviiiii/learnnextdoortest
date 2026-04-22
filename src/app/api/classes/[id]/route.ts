import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function owned(providerId: string, id: string) {
  const cls = await prisma.class.findFirst({ where: { id, providerId } });
  return cls;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { provider } = await requireProvider();
  const cls = await owned(provider.id, params.id);
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, description, category, tagsCsv, imagesCsv, earlyBird, status } = body ?? {};

  const updated = await prisma.class.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(tagsCsv !== undefined && { tagsCsv }),
      ...(imagesCsv !== undefined && { imagesCsv }),
      ...(earlyBird !== undefined && { earlyBird }),
      ...(status !== undefined && { status }),
    },
  });
  return NextResponse.json({ ok: true, class: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { provider } = await requireProvider();
  const cls = await owned(provider.id, params.id);
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.class.update({
    where: { id: params.id },
    data: { status: "ARCHIVED" },
  });
  return NextResponse.json({ ok: true });
}
