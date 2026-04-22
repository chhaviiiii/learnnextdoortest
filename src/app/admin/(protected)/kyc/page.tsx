import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { KycClient } from "./KycClient";

type SearchParams = { tab?: string; filter?: string };

export default async function KycPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const tab = (searchParams.tab ?? "providers") as "providers" | "instructors";
  const filter = (searchParams.filter ?? "PENDING") as "PENDING" | "VERIFIED" | "REJECTED" | "ALL";

  const statusWhere = filter === "ALL" ? {} : { kycStatus: filter };

  const [providers, instructors, providerCounts, instructorCounts] = await Promise.all([
    prisma.provider.findMany({
      where: statusWhere,
      orderBy: { kycSubmittedAt: "asc" },
      include: { user: { select: { name: true, email: true, phone: true } } },
      take: 200,
    }),
    prisma.instructor.findMany({
      where: statusWhere,
      orderBy: { kycSubmittedAt: "asc" },
      include: { provider: { select: { instituteName: true, providerCode: true } } },
      take: 200,
    }),
    prisma.provider.groupBy({
      by: ["kycStatus"],
      _count: { _all: true },
    }),
    prisma.instructor.groupBy({
      by: ["kycStatus"],
      _count: { _all: true },
    }),
  ]);

  const pCounts = Object.fromEntries(providerCounts.map((x) => [x.kycStatus, x._count._all]));
  const iCounts = Object.fromEntries(instructorCounts.map((x) => [x.kycStatus, x._count._all]));

  return (
    <KycClient
      tab={tab}
      filter={filter}
      counts={{
        providers: {
          PENDING: pCounts.PENDING ?? 0,
          VERIFIED: pCounts.VERIFIED ?? 0,
          REJECTED: pCounts.REJECTED ?? 0,
        },
        instructors: {
          PENDING: iCounts.PENDING ?? 0,
          VERIFIED: iCounts.VERIFIED ?? 0,
          REJECTED: iCounts.REJECTED ?? 0,
        },
      }}
      providers={providers.map((p) => ({
        id: p.id,
        providerCode: p.providerCode,
        instituteName: p.instituteName,
        contactName: p.user.name ?? "—",
        contactEmail: p.user.email ?? null,
        contactPhone: p.user.phone ?? null,
        area: p.area ?? null,
        address: p.address ?? null,
        upiId: p.upiId ?? null,
        kycStatus: p.kycStatus,
        kycDocType: p.kycDocType ?? null,
        kycDocUrl: p.kycDocUrl ?? null,
        kycSubmittedAtIso: p.kycSubmittedAt?.toISOString() ?? null,
        kycVerifiedAtIso: p.kycVerifiedAt?.toISOString() ?? null,
        kycRejectionReason: p.kycRejectionReason ?? null,
      }))}
      instructors={instructors.map((i) => ({
        id: i.id,
        name: i.name,
        email: i.email ?? null,
        phone: i.phone ?? null,
        specialty: i.specialty ?? null,
        providerName: i.provider.instituteName,
        providerCode: i.provider.providerCode,
        kycStatus: i.kycStatus,
        kycDocType: i.kycDocType ?? null,
        kycDocUrl: i.kycDocUrl ?? null,
        kycSubmittedAtIso: i.kycSubmittedAt?.toISOString() ?? null,
        kycVerifiedAtIso: i.kycVerifiedAt?.toISOString() ?? null,
        kycRejectionReason: i.kycRejectionReason ?? null,
      }))}
    />
  );
}
