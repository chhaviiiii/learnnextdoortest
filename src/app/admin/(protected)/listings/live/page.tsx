import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ListingApprovalsClient } from "./ListingApprovalsClient";

export default async function ListingLivePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  await requireAdmin();
  const tab = (searchParams.tab ?? "pending") as "pending" | "rejected";

  const [pending, rejected, counts] = await Promise.all([
    prisma.class.findMany({
      where: { liveStatus: "PENDING_APPROVAL" },
      orderBy: { liveSubmittedAt: "asc" },
      include: {
        provider: { select: { instituteName: true, providerCode: true, kycStatus: true } },
        batches: { select: { id: true, name: true, fromTime: true, toTime: true, pricePer4Weeks: true } },
      },
      take: 100,
    }),
    prisma.class.findMany({
      where: { liveStatus: "REJECTED" },
      orderBy: { liveDecidedAt: "desc" },
      include: {
        provider: { select: { instituteName: true, providerCode: true } },
      },
      take: 50,
    }),
    prisma.class.groupBy({ by: ["liveStatus"], _count: { _all: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.liveStatus, c._count._all]));

  return (
    <ListingApprovalsClient
      tab={tab}
      counts={{
        PENDING_APPROVAL: countMap.PENDING_APPROVAL ?? 0,
        REJECTED: countMap.REJECTED ?? 0,
        APPROVED: countMap.APPROVED ?? 0,
        BLOCKED: countMap.BLOCKED ?? 0,
      }}
      pending={pending.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description ?? null,
        type: c.type as "REGULAR" | "COURSE" | "WORKSHOP",
        category: c.category,
        subcategory: c.subcategory ?? null,
        provider: {
          name: c.provider.instituteName,
          code: c.provider.providerCode,
          kycStatus: c.provider.kycStatus,
        },
        submittedAtIso: c.liveSubmittedAt.toISOString(),
        batches: c.batches.map((b) => ({
          id: b.id,
          name: b.name,
          fromTime: b.fromTime,
          toTime: b.toTime,
          pricePer4Weeks: b.pricePer4Weeks,
        })),
      }))}
      rejected={rejected.map((c) => ({
        id: c.id,
        title: c.title,
        provider: { name: c.provider.instituteName, code: c.provider.providerCode },
        reason: c.liveReason ?? "—",
        decidedAtIso: c.liveDecidedAt?.toISOString() ?? null,
      }))}
    />
  );
}
