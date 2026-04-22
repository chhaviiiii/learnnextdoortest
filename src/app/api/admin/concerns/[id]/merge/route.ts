import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  parentId: z.string().trim().min(1),
  note: z.string().trim().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parent ticket id is required." }, { status: 400 });
  }
  const { parentId, note } = parsed.data;

  if (parentId === params.id) {
    return NextResponse.json({ error: "A ticket can't be merged into itself." }, { status: 400 });
  }

  const [dup, parent] = await Promise.all([
    prisma.supportTicket.findUnique({ where: { id: params.id } }),
    prisma.supportTicket.findUnique({ where: { id: parentId } }),
  ]);
  if (!dup) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  if (!parent) return NextResponse.json({ error: "Parent ticket not found." }, { status: 404 });

  if (dup.status === "MERGED") {
    return NextResponse.json({ error: "This ticket is already merged." }, { status: 400 });
  }
  if (parent.status === "MERGED") {
    return NextResponse.json(
      { error: "You can't merge into a ticket that itself has been merged." },
      { status: 400 },
    );
  }

  const before = { status: dup.status, mergedIntoId: dup.mergedIntoId };

  await prisma.$transaction(async (tx) => {
    await tx.supportTicket.update({
      where: { id: dup.id },
      data: { status: "MERGED", mergedIntoId: parent.id },
    });
    await tx.notification.create({
      data: {
        userId: dup.userId,
        type: "SUPPORT_TICKET_UPDATE",
        title: `Concern ${dup.code} merged`,
        body: `Your concern has been merged with ${parent.code} — we'll respond there.${note ? ` Note: ${note}` : ""}`,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "CONCERNS",
    action: "MERGE_TICKET",
    entityType: "SupportTicket",
    entityId: dup.id,
    before,
    after: { status: "MERGED", mergedIntoId: parent.id, parentCode: parent.code },
    reason: note ?? null,
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, status: "MERGED", parentCode: parent.code });
}
