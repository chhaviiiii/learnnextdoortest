import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCategorySelection } from "@/lib/taxonomy";

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

  let categoryPatch: { category?: string; subcategory?: string | null } = {};
  if (category !== undefined || subcategory !== undefined) {
    const categorySelection = await validateCategorySelection(
      category !== undefined ? category : cls.category,
      subcategory !== undefined ? subcategory : cls.subcategory,
    );
    if (!categorySelection.ok) {
      return NextResponse.json({ error: categorySelection.error }, { status: 400 });
    }
    categoryPatch = {
      category: categorySelection.category,
      subcategory: categorySelection.subcategory || null,
    };
  }

  const updated = await prisma.class.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...categoryPatch,
      ...(tagsCsv !== undefined && { tagsCsv: tagsCsv ? String(tagsCsv).trim() : null }),
      ...(imagesCsv !== undefined && { imagesCsv: imagesCsv ? String(imagesCsv).trim() : null }),
      ...(address !== undefined && { address: String(address).trim() }),
      ...(landmark !== undefined && { landmark: String(landmark).trim() }),
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
