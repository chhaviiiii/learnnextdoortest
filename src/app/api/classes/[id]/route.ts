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
  const {
    title,
    description,
    category,
    subcategory,
    tagsCsv,
    imagesCsv,
    address,
    landmark,
    registrationEndDate,
    startDate,
    endDate,
    durationWeeks,
    earlyBird,
    earlyBirdEndDate,
    earlyBirdPrice,
    earlyBirdSlots,
    status,
  } = body ?? {};

  if (status !== undefined) {
    if (!["ACTIVE", "PAUSED", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid listing status." }, { status: 400 });
    }
    if (cls.liveStatus !== "APPROVED") {
      return NextResponse.json({ error: "Only live listings can change visibility." }, { status: 400 });
    }
  }

  const updated = await prisma.class.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(subcategory !== undefined && { subcategory }),
      ...(tagsCsv !== undefined && { tagsCsv }),
      ...(imagesCsv !== undefined && { imagesCsv }),
      ...(address !== undefined && { address }),
      ...(landmark !== undefined && { landmark }),
      ...(registrationEndDate !== undefined && { registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(durationWeeks !== undefined && { durationWeeks }),
      ...(earlyBird !== undefined && { earlyBird }),
      ...(earlyBirdEndDate !== undefined && { earlyBirdEndDate: earlyBirdEndDate ? new Date(earlyBirdEndDate) : null }),
      ...(earlyBirdPrice !== undefined && { earlyBirdPrice: earlyBirdPrice ? Number(earlyBirdPrice) : null }),
      ...(earlyBirdSlots !== undefined && { earlyBirdSlots: earlyBirdSlots ? Number(earlyBirdSlots) : null }),
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
