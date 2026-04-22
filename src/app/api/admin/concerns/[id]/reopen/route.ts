import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin, writeAuditLog, adminIpFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  reason: z.string().trim().min(10).max(500).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const { reason } = parsed.data;

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
    return NextResponse.json(
      { error: `Only resolved/closed tickets can be reopened (current: ${ticket.status}).` },
      { status: 400 },
    );
  }

  const before = { status: ticket.status, deleteAfter: ticket.deleteAfter };

  await prisma.$transaction(async (tx) => {
    await tx.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "OPEN", resolvedAt: null, deleteAfter: null },
    });
    await tx.notification.create({
      data: {
        userId: ticket.userId,
        type: "SUPPORT_TICKET_UPDATE",
        title: `Concern ${ticket.code} reopened`,
        body: reason
          ? `Your concern has been reopened by the admin team. Note: ${reason}`
          : "Your concern has been reopened by the admin team. We'll follow up shortly.",
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    module: "CONCERNS",
    action: "REOPEN_TICKET",
    entityType: "SupportTicket",
    entityId: ticket.id,
    before,
    after: { status: "OPEN" },
    reason: reason ?? null,
    ip: adminIpFromRequest(),
  });

  return NextResponse.json({ ok: true, status: "OPEN" });
}
