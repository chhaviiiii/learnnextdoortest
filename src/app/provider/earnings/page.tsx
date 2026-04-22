import { Download, Wallet } from "lucide-react";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR } from "@/lib/utils";
import { StatusPill } from "@/components/Pills";

export default async function EarningsPage() {
  const { provider } = await requireProvider();
  const settlements = await prisma.settlement.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: "desc" },
  });
  const bookings = await prisma.booking.findMany({
    where: { class: { providerId: provider.id }, status: { in: ["CONFIRMED", "COMPLETED"] } },
    include: { class: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const lifetimeGross = settlements.reduce((a, s) => a + s.gross, 0);
  const lifetimeNet = settlements.reduce((a, s) => a + s.net, 0);
  const lifetimeCommission = settlements.reduce((a, s) => a + s.commission, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Earnings & payout</h1>
        <p className="mt-1 text-sm text-ink-500">
          Monthly settlements are generated on the 1st. Payouts hit your UPI within 48 hours.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lifetime gross" value={formatINR(lifetimeGross)} hue="brand" />
        <StatCard label="Platform fees" value={formatINR(lifetimeCommission)} hue="amber" />
        <StatCard label="Net paid out" value={formatINR(lifetimeNet)} hue="emerald" />
      </div>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">Payout history</h2>
          <span className="text-xs text-ink-500">{settlements.length} settlement{settlements.length === 1 ? "" : "s"}</span>
        </div>
        {settlements.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">You don't have any settlements yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800/5 text-xs text-ink-500">
                  <Th>Settlement</Th>
                  <Th>Period</Th>
                  <Th align="right">Gross</Th>
                  <Th align="right">Commission</Th>
                  <Th align="right">Net</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/5">
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <Td><span className="font-semibold text-ink-900">{s.code.toUpperCase()}</span></Td>
                    <Td className="text-ink-600">{formatDate(s.periodStart)} – {formatDate(s.periodEnd)}</Td>
                    <Td align="right" className="text-ink-900">{formatINR(s.gross)}</Td>
                    <Td align="right" className="text-ink-500">−{formatINR(s.commission)}</Td>
                    <Td align="right" className="font-bold text-emerald-700">{formatINR(s.net)}</Td>
                    <Td><StatusPill status={s.status} /></Td>
                    <Td>
                      <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                        <Download className="mr-1 inline h-3 w-3" /> Invoice
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="font-display text-lg font-bold text-ink-900">Recent confirmed bookings</h2>
        {bookings.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">Nothing yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800/5 text-xs text-ink-500">
                  <Th>Student</Th>
                  <Th>Class</Th>
                  <Th>Date</Th>
                  <Th align="right">Amount</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/5">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <Td className="font-medium text-ink-800">{b.user.name ?? "Learner"}</Td>
                    <Td className="text-ink-600">{b.class.title}</Td>
                    <Td className="text-ink-500">{formatDate(b.createdAt)}</Td>
                    <Td align="right" className="font-bold text-ink-900">{formatINR(b.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-emerald-600" />
          <div>
            <div className="text-sm font-semibold text-ink-900">Payout account</div>
            <div className="text-xs text-ink-500">
              UPI · {provider.upiId ?? "not set"} {provider.upiVerified ? "(verified)" : ""}
            </div>
          </div>
        </div>
        <a href="/provider/account" className="btn-ghost">Update UPI</a>
      </div>
    </div>
  );
}

function StatCard({ label, value, hue }: { label: string; value: string; hue: "brand" | "amber" | "emerald" }) {
  const hues: Record<string, string> = {
    brand: "from-brand-500 to-brand-700",
    amber: "from-amber-400 to-amber-600",
    emerald: "from-emerald-400 to-emerald-600",
  };
  return (
    <div className="card">
      <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${hues[hue]}`} />
      <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-ink-900">{value}</div>
    </div>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return <th className={`py-2 font-semibold ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, align, className }: { children?: React.ReactNode; align?: "left" | "right"; className?: string }) {
  return <td className={`py-3 text-sm ${align === "right" ? "text-right" : ""} ${className ?? ""}`}>{children}</td>;
}
