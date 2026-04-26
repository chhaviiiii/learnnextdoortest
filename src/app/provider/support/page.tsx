import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupportClient } from "./SupportClient";
import { formatDate } from "@/lib/utils";
import { getProviderSupportContact, getSupportCategories } from "@/lib/support";

export default async function SupportPage() {
  const { user } = await requireProvider();
  const [tickets, categories] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    getSupportCategories(),
  ]);

  return (
    <SupportClient
      categories={categories}
      contact={getProviderSupportContact()}
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
