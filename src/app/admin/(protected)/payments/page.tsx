import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { PaymentsClient } from "./PaymentsClient";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { tab?: string; sub?: string };
}) {
  await requireAdmin();

  const tab = (searchParams.tab ?? "settlements") as "settlements" | "refunds";
  const sub = (searchParams.sub ?? "pending") as "pending" | "completed" | "future" | "failed";

  const [settlements, refunds, counts, refundCounts] = await Promise.all([
    prisma.settlement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        provider: {
          select: {
            instituteName: true,
            providerCode: true,
            upiId: true,
            upiVerified: true,
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
      take: 500,
    }),
    prisma.refund.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            class: { select: { title: true, providerId: true } },
          },
        },
      },
      take: 500,
    }),
    prisma.settlement.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.refund.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const refundCountMap = Object.fromEntries(refundCounts.map((c) => [c.status, c._count._all]));

  return (
    <PaymentsClient
      tab={tab}
      sub={sub}
      counts={{
        PENDING: (countMap.PENDING ?? 0) + (countMap.PROCESSING ?? 0),
        FUTURE: countMap.FUTURE ?? 0,
        PAID: countMap.PAID ?? 0,
        FAILED: countMap.FAILED ?? 0,
      }}
      refundCounts={{
        QUEUED: (refundCountMap.QUEUED ?? 0) + (refundCountMap.PROCESSING ?? 0),
        COMPLETED: refundCountMap.COMPLETED ?? 0,
        FAILED: refundCountMap.FAILED ?? 0,
      }}
      settlements={settlements.map((s) => ({
        id: s.id,
        code: s.code,
        status: s.status as "PROCESSING" | "PENDING" | "PAID" | "FAILED" | "FUTURE",
        periodStartIso: s.periodStart.toISOString(),
        periodEndIso: s.periodEnd.toISOString(),
        gross: s.gross,
        commission: s.commission,
        net: s.net,
        utr: s.utr ?? null,
        paidAtIso: s.paidAt?.toISOString() ?? null,
        notes: s.notes ?? null,
        createdAtIso: s.createdAt.toISOString(),
        provider: {
          name: s.provider.instituteName,
          code: s.provider.providerCode,
          upi: s.provider.upiId ?? null,
          upiVerified: s.provider.upiVerified,
          contactName: s.provider.user.name ?? "—",
          contact:
            s.provider.user.email ?? s.provider.user.phone ?? "—",
        },
      }))}
      refunds={refunds.map((r) => ({
        id: r.id,
        amount: r.amount,
        status: r.status as "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED",
        method: r.method as "ORIGINAL" | "UPI" | "MANUAL",
        utr: r.utr ?? null,
        createdAtIso: r.createdAt.toISOString(),
        completedAtIso: r.completedAt?.toISOString() ?? null,
        booking: {
          id: r.booking.id,
          classTitle: r.booking.class.title,
          learner: r.booking.user.name ?? "Learner",
          contact:
            r.booking.user.email ?? r.booking.user.phone ?? "—",
        },
      }))}
    />
  );
}
