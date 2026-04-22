import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  note: z.string().trim().min(20).max(2000),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Resolution note is required (min 20 characters)." },
      { status: 400 },
    );
  }
  const { note } = parsed.data;

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  if (ticket.status !== "OPEN") {
    return NextResponse.json(
      { error: `Ticket is not open (current status: ${ticket.status}).` },
      { status: 400 },
    );
  }

  const resolvedAt = new Date();
  const deleteAfter = new Date(resolvedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const before = { status: ticket.status, resolutionNote: ticket.resolutionNote };

  await prisma.$transaction(async (tx) => {
    await tx.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "RESOLVED", resolutionNote: note, resolvedAt, deleteAfter },
    });
    await tx.notification.create({
      data: {
        userId: ticket.userId,
        type: "SUPPORT_TICKET_UPDATE",
        title: `Concern ${ticket.code} resolved`,
        body: `Admin response: ${note}`,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "CONCERNS",
    action: "RESOLVE_TICKET",
    entityType: "SupportTicket",
    entityId: ticket.id,
    before,
    after: { status: "RESOLVED", resolvedAt: resolvedAt.toISOString(), deleteAfter: deleteAfter.toISOString() },
    reason: note,
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, status: "RESOLVED" });
}
