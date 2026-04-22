import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupportClient } from "./SupportClient";
import { formatDate } from "@/lib/utils";

export default async function SupportPage() {
  const { user } = await requireProvider();
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <SupportClient
      tickets={tickets.map((t) => ({
        id: t.id,
        code: t.code,
        subject: t.subject,
        category: t.category,
        status: t.status,
        message: t.message,
        reply: t.reply ?? "",
        createdAt: formatDate(t.createdAt, { day: "2-digit", month: "short", year: "numeric" }),
      }))}
    />
  );
}
