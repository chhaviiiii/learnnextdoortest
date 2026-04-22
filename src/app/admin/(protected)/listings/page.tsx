import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ListingsClient } from "./ListingsClient";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  await requireAdmin();
  const q = (searchParams.q ?? "").trim();
  const statusFilter = searchParams.status ?? "ALL";

  const where: Record<string, unknown> = {};
  if (statusFilter === "LIVE") {
    where.liveStatus = "APPROVED";
  } else if (statusFilter === "PENDING") {
    where.liveStatus = "PENDING_APPROVAL";
  } else if (statusFilter === "BLOCKED") {
    where.liveStatus = "BLOCKED";
  } else if (statusFilter === "REJECTED") {
    where.liveStatus = "REJECTED";
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { id: { contains: q } },
      { provider: { instituteName: { contains: q, mode: "insensitive" } } },
      { provider: { providerCode: { contains: q, mode: "insensitive" } } },
    ];
  }

  const listings = await prisma.class.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      provider: { select: { instituteName: true, providerCode: true } },
      batches: { select: { id: true } },
    },
    take: 100,
  });

  return (
    <ListingsClient
      q={q}
      statusFilter={statusFilter}
      listings={listings.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type as "REGULAR" | "COURSE" | "WORKSHOP",
        category: l.category,
        status: l.status,
        liveStatus: l.liveStatus,
        liveReason: l.liveReason ?? null,
        provider: { name: l.provider.instituteName, code: l.provider.providerCode },
        batchCount: l.batches.length,
        createdAtIso: l.createdAt.toISOString(),
      }))}
    />
  );
}
