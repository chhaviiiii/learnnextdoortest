import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  Calendar,
  Flag,
  FolderTree,
  LayoutList,
  LifeBuoy,
  ScrollText,
  ShieldCheck,
  Users2,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  // Pull all the counts we need for the 9 cards + critical alerts in one round-trip
  const [
    pendingKycProviders,
    pendingKycInstructors,
    pendingListings,
    activeListings,
    openConcerns,
    overdueConcerns,
    pendingSettlements,
    failedSettlements,
    queuedRefunds,
    activeUsers,
    suspendedUsers,
  ] = await Promise.all([
    prisma.provider.count({ where: { kycStatus: "PENDING" } }),
    prisma.instructor.count({ where: { kycStatus: "PENDING" } }),
    prisma.class.count({ where: { liveStatus: "PENDING_APPROVAL" } }),
    prisma.class.count({ where: { liveStatus: "APPROVED", status: { in: ["ACTIVE", "PAUSED"] } } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({
      where: {
        status: "OPEN",
        createdAt: { lt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
      },
    }),
    prisma.settlement.count({ where: { status: { in: ["PROCESSING", "PENDING"] } } }),
    prisma.settlement.count({ where: { status: "FAILED" } }),
    prisma.refund.count({ where: { status: "QUEUED" } }),
    prisma.user.count({ where: { suspended: false } }),
    prisma.user.count({ where: { suspended: true } }),
  ]);

  const cards: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number | string;
    countLabel?: string;
    urgent?: boolean;
    tint: "brand" | "accent" | "ink";
  }> = [
    {
      href: "/admin/kyc",
      label: "KYC Approvals",
      icon: BadgeCheck,
      count: pendingKycProviders + pendingKycInstructors,
      countLabel: "pending",
      urgent: pendingKycProviders + pendingKycInstructors > 0,
      tint: "brand",
    },
    // {
    //   href: "/admin/listings/live",
    //   label: "Listing Approvals",
    //   icon: BookOpenCheck,
    //   count: pendingListings,
    //   countLabel: "awaiting review",
    //   urgent: pendingListings > 5,
    //   tint: "accent",
    // },
    {
      href: "/admin/listings",
      label: "Listing Management",
      icon: LayoutList,
      count: activeListings,
      countLabel: "live listings",
      tint: "ink",
    },
    {
      href: "/admin/category",
      label: "Categories & Subcategories",
      icon: FolderTree,
      count: 7,
      countLabel: "Categories · 29 Sub-Categories",
      tint: "ink",
    },
    {
      href: "/admin/users",
      label: "User Management",
      icon: Users2,
      count: activeUsers,
      countLabel: `active · ${suspendedUsers} suspended`,
      tint: "brand",
    },
    // {
    //   href: "/admin/payments",
    //   label: "Payments",
    //   icon: Wallet,
    //   count: pendingSettlements + queuedRefunds,
    //   countLabel: `pending · ${failedSettlements} failed`,
    //   urgent: failedSettlements > 0,
    //   tint: "accent",
    // },
    {
      href: "/admin/concerns",
      label: "Provider Concerns",
      icon: LifeBuoy,
      count: openConcerns,
      countLabel: `open · ${overdueConcerns} overdue`,
      urgent: overdueConcerns > 0,
      tint: "ink",
    },
    {
      href: "/admin/tracking",
      label: "Daily Live Tracking",
      icon: Calendar,
      countLabel: "today",
      tint: "brand",
    },
    {
      href: "/admin/stats",
      label: "Stats",
      icon: Flag,
      countLabel: "reports",
      tint: "accent",
    },
    {
      href: "/admin/audit",
      label: "Audit Log",
      icon: ScrollText,
      countLabel: "Super Admin only",
      tint: "ink",
    },
  ];

  const alerts: Array<{ message: string; href: string }> = [];
  if (pendingKycProviders + pendingKycInstructors >= 10)
    alerts.push({
      message: `${pendingKycProviders + pendingKycInstructors} KYC applications pending review.`,
      href: "/admin/kyc",
    });
  if (overdueConcerns > 0)
    alerts.push({
      message: `${overdueConcerns} provider concern${overdueConcerns === 1 ? "" : "s"} open > 72 hours.`,
      href: "/admin/concerns",
    });
  // if (failedSettlements > 0)
  //   alerts.push({
  //     message: `${failedSettlements} settlement${failedSettlements === 1 ? "" : "s"} failed — retry or contact provider.`,
  //     href: "/admin/payments",
  //   });

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs text-ink-500 font-semibold uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Admin · Dashboard
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">Overview</h1>
        <p className="mt-1 text-sm text-ink-500">
          Control centre for platform operations. All actions are written to the audit log.
        </p>
      </header>

      {alerts.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-rose-600 p-2 text-white">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-rose-900">Critical alerts</div>
              <ul className="mt-2 space-y-1.5 text-sm text-rose-800">
                {alerts.map((a, i) => (
                  <li key={i}>
                    <Link href={a.href} className="hover:underline">
                      {a.message}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const tint =
            c.tint === "brand"
              ? "bg-brand-50 text-brand-700"
              : c.tint === "accent"
              ? "bg-amber-50 text-amber-700"
              : "bg-ink-800/5 text-ink-800";
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group relative block rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-800/5 transition hover:shadow-float"
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {c.urgent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                    <AlertTriangle className="h-3 w-3" /> urgent
                  </span>
                ) : null}
              </div>
              <div className="mt-4">
                <div className="text-sm text-ink-500">{c.label}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  {typeof c.count !== "undefined" ? (
                    <span className="font-display text-2xl font-bold text-ink-900">{c.count}</span>
                  ) : null}
                  {c.countLabel ? <span className="text-xs text-ink-500">{c.countLabel}</span> : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
