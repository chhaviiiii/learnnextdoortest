import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ConcernsClient } from "./ConcernsClient";

export default async function ConcernsPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string };
}) {
  await requireAdmin();
  const tab = (searchParams.tab ?? "open") as "open" | "resolved" | "merged";
  const q = (searchParams.q ?? "").trim();

  // Surface ONLY provider-raised tickets per PRD scope.
  const baseFilter = { user: { role: "PROVIDER" as const } };

  const statusByTab: Record<typeof tab, string[]> = {
    open: ["OPEN"],
    resolved: ["RESOLVED", "CLOSED"],
    merged: ["MERGED"],
  };

  const where = {
    ...baseFilter,
    status: { in: statusByTab[tab] },
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" as const } },
            { subject: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [tickets, countsRaw, openSiblings] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            provider: {
              select: { instituteName: true, providerCode: true },
            },
          },
        },
      },
      take: 200,
    }),
    prisma.supportTicket.groupBy({
      by: ["status"],
      where: baseFilter,
      _count: { _all: true },
    }),
    // For the merge picker: give the client a short list of recent OPEN tickets
    // the admin might want to merge duplicates into.
    prisma.supportTicket.findMany({
      where: { ...baseFilter, status: "OPEN" },
      select: {
        id: true,
        code: true,
        subject: true,
        user: { select: { name: true, provider: { select: { instituteName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const countsByStatus = Object.fromEntries(countsRaw.map((c) => [c.status, c._count._all]));

  // Overdue = open > 72h
  const overdueCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const overdue = await prisma.supportTicket.count({
    where: { ...baseFilter, status: "OPEN", createdAt: { lt: overdueCutoff } },
  });

  return (
    <ConcernsClient
      tab={tab}
      q={q}
      counts={{
        open: countsByStatus.OPEN ?? 0,
        resolved: (countsByStatus.RESOLVED ?? 0) + (countsByStatus.CLOSED ?? 0),
        merged: countsByStatus.MERGED ?? 0,
        overdue,
      }}
      mergeCandidates={openSiblings.map((s) => ({
        id: s.id,
        code: s.code,
        subject: s.subject,
        providerName:
          s.user.provider?.instituteName ?? s.user.name ?? "Provider",
      }))}
      tickets={tickets.map((t) => ({
        id: t.id,
        code: t.code,
        subject: t.subject,
        category: t.category,
        message: t.message,
        imageUrl: t.imageUrl ?? null,
        status: t.status as "OPEN" | "RESOLVED" | "CLOSED" | "MERGED",
        resolutionNote: t.resolutionNote ?? null,
        resolvedAtIso: t.resolvedAt?.toISOString() ?? null,
        deleteAfterIso: t.deleteAfter?.toISOString() ?? null,
        mergedIntoId: t.mergedIntoId ?? null,
        createdAtIso: t.createdAt.toISOString(),
        provider: {
          name:
            t.user.provider?.instituteName ??
            t.user.name ??
            "Provider",
          code: t.user.provider?.providerCode ?? null,
          contact: t.user.email ?? t.user.phone ?? "—",
        },
      }))}
    />
  );
}
