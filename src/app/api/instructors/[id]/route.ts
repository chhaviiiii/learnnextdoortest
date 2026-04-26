import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { provider } = await requireProvider();
  const i = await prisma.instructor.findFirst({ where: { id: params.id, providerId: provider.id } });
  if (!i) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const activeAssignments = await prisma.batch.findMany({
    where: {
      instructorId: params.id,
      class: { providerId: provider.id, status: "ACTIVE" },
    },
    include: { class: { select: { title: true } } },
    take: 3,
  });
  if (activeAssignments.length > 0) {
    const titles = activeAssignments.map((b) => b.class.title).join(", ");
    return NextResponse.json(
      {
        error: `This instructor is assigned to ${activeAssignments.length} active listing${
          activeAssignments.length === 1 ? "" : "s"
        }: ${titles}. Reassign before removing.`,
      },
      { status: 400 },
    );
  }

  await prisma.batch.updateMany({
    where: { instructorId: params.id },
    data: { instructorId: null },
  });
  await prisma.instructor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
