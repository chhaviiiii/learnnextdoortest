import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { provider } = await requireProvider();
  const i = await prisma.instructor.findFirst({ where: { id: params.id, providerId: provider.id } });
  if (!i) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Detach from any batches first
  await prisma.batch.updateMany({
    where: { instructorId: params.id },
    data: { instructorId: null },
  });
  await prisma.instructor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
