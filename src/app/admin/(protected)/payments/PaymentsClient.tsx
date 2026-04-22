"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SettlementStatus = "PROCESSING" | "PENDING" | "PAID" | "FAILED" | "FUTURE";
type RefundStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

type SettlementRow = {
  id: string;
  code: string;
  status: SettlementStatus;
  periodStartIso: string;
  periodEndIso: string;
  gross: number;
  commission: number;
  net: number;
  utr: string | null;
  paidAtIso: string | null;
  notes: string | null;
  createdAtIso: string;
  provider: {
    name: string;
    code: string;
    upi: string | null;
    upiVerified: boolean;
    contactName: string;
    contact: string;
  };
};

type RefundRow = {
  id: string;
  amount: number;
  status: RefundStatus;
  method: "ORIGINAL" | "UPI" | "MANUAL";
  utr: string | null;
  createdAtIso: string;
  completedAtIso: string | null;
  booking: {
    id: string;
    classTitle: string;
    learner: string;
    contact: string;
  };
};

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PaymentsClient({
  tab: initialTab,
  sub: initialSub,
  counts,
  refundCounts,
  settlements,
  refunds,
}: {
  tab: "settlements" | "refunds";
  sub: "pending" | "completed" | "future" | "failed";
  counts: { PENDING: number; FUTURE: number; PAID: number; FAILED: number };
  refundCounts: { QUEUED: number; COMPLETED: number; FAILED: number };
  settlements: SettlementRow[];
  refunds: RefundRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"settlements" | "refunds">(initialTab);
  const [sub, setSub] = useState<"pending" | "completed" | "future" | "failed">(initialSub);
  const [flash, setFlash] = useState<string | null>(null);

  // Settlement action modal
  const [target, setTarget] = useState<
    | { kind: "pay"; settlement: SettlementRow }
    | { kind: "fail"; settlement: SettlementRow }
    | { kind: "refund"; refund: RefundRow }
    | null
  >(null);
  const [utr, setUtr] = useState("");
  const [notes, setNotes] = useState("");
  const [failReason, setFailReason] = useState("");
  const [method, setMethod] = useState<"ORIGINAL" | "UPI" | "MANUAL">("ORIGINAL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      if (sub === "pending") return s.status === "PENDING" || s.status === "PROCESSING";
      if (sub === "future") return s.status === "FUTURE";
      if (sub === "failed") return s.status === "FAILED";
      return s.status === "PAID";
    });
  }, [settlements, sub]);

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      if (sub === "pending") return r.status === "QUEUED" || r.status === "PROCESSING";
      if (sub === "failed") return r.status === "FAILED";
      return r.status === "COMPLETED";
    });
  }, [refunds, sub]);

  function closeModal() {
    setTarget(null);
    setUtr("");
    setNotes("");
    setFailReason("");
    setMethod("ORIGINAL");
    setError(null);
  }

  function switchTab(next: "settlements" | "refunds") {
    setTab(next);
    // Reset sub filter to a sensible default per tab
    if (next === "settlements") setSub("pending");
    else setSub("pending");
  }

  async function submitPay() {
    if (!target || target.kind !== "pay") return;
    if (utr.trim().length < 6) {
      setError("UTR must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/settlements/${target.settlement.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr: utr.trim(), notes: notes.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(`${target.settlement.code.toUpperCase()} marked paid.`);
      closeModal();
      router.refresh();
      setTimeout(() => setFlash(null), 3500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitFail() {
    if (!target || target.kind !== "fail") return;
    if (failReason.trim().length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/settlements/${target.settlement.id}/fail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: failReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(`${target.settlement.code.toUpperCase()} marked failed. Provider was notified.`);
      closeModal();
      router.refresh();
      setTimeout(() => setFlash(null), 3500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitRefund() {
    if (!target || target.kind !== "refund") return;
    if (utr.trim().length < 6) {
      setError("UTR must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/refunds/${target.refund.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr: utr.trim(), method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(`Refund processed. Learner notified.`);
      closeModal();
      router.refresh();
      setTimeout(() => setFlash(null), 3500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Payments</h1>
        <p className="mt-1 text-sm text-ink-500">
          Settle provider payouts and process learner refunds. All actions are audit-logged with the UTR you enter.
        </p>
      </header>

      {flash ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
          {flash}
        </div>
      ) : null}

      {/* Summary tiles */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryTile
          label="Pending settlements"
          value={counts.PENDING}
          icon={Clock}
          tint="amber"
          urgent={counts.PENDING > 0}
        />
        <SummaryTile
          label="Failed settlements"
          value={counts.FAILED}
          icon={AlertTriangle}
          tint="rose"
          urgent={counts.FAILED > 0}
        />
        <SummaryTile
          label="Queued refunds"
          value={refundCounts.QUEUED}
          icon={RefreshCcw}
          tint="brand"
          urgent={refundCounts.QUEUED > 0}
        />
        <SummaryTile
          label="Paid (lifetime)"
          value={counts.PAID}
          icon={BadgeCheck}
          tint="emerald"
        />
      </div>

      {/* Top-level tabs */}
      <div className="flex items-center gap-2 border-b border-ink-800/5">
        <TabBtn active={tab === "settlements"} onClick={() => switchTab("settlements")}>
          Settlements
          <span className="ml-2 rounded-full bg-ink-800/5 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
            {counts.PENDING + counts.FAILED + counts.FUTURE + counts.PAID}
          </span>
        </TabBtn>
        <TabBtn active={tab === "refunds"} onClick={() => switchTab("refunds")}>
          Refunds
          <span className="ml-2 rounded-full bg-ink-800/5 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
            {refundCounts.QUEUED + refundCounts.COMPLETED + refundCounts.FAILED}
          </span>
        </TabBtn>
      </div>

      {/* Sub-filter pills */}
      {tab === "settlements" ? (
        <div className="flex flex-wrap gap-2">
          <Pill active={sub === "pending"} onClick={() => setSub("pending")}>
            Pending · {counts.PENDING}
          </Pill>
          <Pill active={sub === "failed"} onClick={() => setSub("failed")}>
            Failed · {counts.FAILED}
          </Pill>
          <Pill active={sub === "future"} onClick={() => setSub("future")}>
            Future · {counts.FUTURE}
          </Pill>
          <Pill active={sub === "completed"} onClick={() => setSub("completed")}>
            Paid · {counts.PAID}
          </Pill>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Pill active={sub === "pending"} onClick={() => setSub("pending")}>
            Queued · {refundCounts.QUEUED}
          </Pill>
          <Pill active={sub === "completed"} onClick={() => setSub("completed")}>
            Completed · {refundCounts.COMPLETED}
          </Pill>
          <Pill active={sub === "failed"} onClick={() => setSub("failed")}>
            Failed · {refundCounts.FAILED}
          </Pill>
        </div>
      )}

      {/* Settlements table */}
      {tab === "settlements" ? (
        filteredSettlements.length === 0 ? (
          <div className="card text-center py-10 text-sm text-ink-500">
            <Wallet className="mx-auto h-8 w-8 text-ink-500/40" />
            <div className="mt-2">No settlements in this bucket.</div>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-800/5 text-sm">
                <thead className="bg-surface-100 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Settlement</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Commission</th>
                    <th className="px-4 py-3 text-right">Net payout</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/5">
                  {filteredSettlements.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-900">{s.code.toUpperCase()}</div>
                        <div className="text-xs text-ink-500">Created {shortDate(s.createdAtIso)}</div>
                        {s.utr ? (
                          <div className="mt-0.5 text-[11px] text-ink-500">
                            UTR <span className="font-mono text-ink-700">{s.utr}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">{s.provider.name}</div>
                        <div className="text-xs text-ink-500">{s.provider.code}</div>
                        <div className="mt-0.5 text-[11px] text-ink-500">
                          UPI: <span className="font-mono">{s.provider.upi ?? "not set"}</span>
                          {s.provider.upiVerified ? (
                            <span className="ml-1 text-emerald-600">✓</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-700 whitespace-nowrap">
                        {shortDate(s.periodStartIso)} – {shortDate(s.periodEndIso)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-900">{formatINR(s.gross)}</td>
                      <td className="px-4 py-3 text-right text-ink-500">−{formatINR(s.commission)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {formatINR(s.net)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                        {s.paidAtIso ? (
                          <div className="mt-0.5 text-[11px] text-ink-500">
                            Paid {shortDate(s.paidAtIso)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.status === "PAID" ? (
                          <span className="text-xs text-ink-500 italic">—</span>
                        ) : s.status === "FUTURE" ? (
                          <span className="text-xs text-ink-500 italic">Awaiting cycle</span>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setTarget({ kind: "pay", settlement: s });
                                setNotes(s.notes ?? "");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Mark paid
                            </button>
                            {s.status !== "FAILED" ? (
                              <button
                                onClick={() => setTarget({ kind: "fail", settlement: s })}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                <XCircle className="h-3 w-3" /> Fail
                              </button>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filteredRefunds.length === 0 ? (
        <div className="card text-center py-10 text-sm text-ink-500">
          <RefreshCcw className="mx-auto h-8 w-8 text-ink-500/40" />
          <div className="mt-2">No refunds in this bucket.</div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-800/5 text-sm">
              <thead className="bg-surface-100 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Learner</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Queued</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/5">
                {filteredRefunds.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{r.booking.learner}</div>
                      <div className="text-xs text-ink-500">{r.booking.contact}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-700 max-w-xs truncate">
                      {r.booking.classTitle}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ink-900">
                      {formatINR(r.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-surface-100 text-ink-700">{r.method}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700 whitespace-nowrap">
                      {shortDate(r.createdAtIso)}
                    </td>
                    <td className="px-4 py-3">
                      <RefundBadge status={r.status} />
                      {r.utr ? (
                        <div className="mt-0.5 text-[11px] text-ink-500">
                          UTR <span className="font-mono text-ink-700">{r.utr}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "COMPLETED" ? (
                        <span className="text-xs text-ink-500 italic">—</span>
                      ) : (
                        <button
                          onClick={() => {
                            setTarget({ kind: "refund", refund: r });
                            setMethod(r.method);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                        >
                          <ArrowRight className="h-3 w-3" /> Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action modal */}
      {target ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-float"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800/5">
              <h3 className="font-display text-lg font-bold text-ink-900">
                {target.kind === "pay"
                  ? "Mark settlement paid"
                  : target.kind === "fail"
                  ? "Mark settlement failed"
                  : "Process refund"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-ink-500 hover:bg-surface-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {target.kind === "pay" ? (
                <>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">
                    <div className="font-semibold">
                      {target.settlement.code.toUpperCase()} · {target.settlement.provider.name}
                    </div>
                    <div className="mt-0.5 text-xs">
                      Period {fullDate(target.settlement.periodStartIso)} –{" "}
                      {fullDate(target.settlement.periodEndIso)}
                    </div>
                    <div className="mt-1.5 text-lg font-bold">{formatINR(target.settlement.net)}</div>
                    <div className="text-xs">
                      To UPI: <span className="font-mono">{target.settlement.provider.upi ?? "not set"}</span>
                    </div>
                  </div>
                  <label className="block text-sm font-medium text-ink-900">
                    UTR / reference number
                  </label>
                  <input
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="input font-mono"
                    placeholder="e.g. 412309876543"
                    autoFocus
                  />
                  <label className="block text-sm font-medium text-ink-900">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="input resize-none"
                    placeholder="Internal note, if any..."
                  />
                </>
              ) : target.kind === "fail" ? (
                <>
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      The provider will be notified that their payout of{" "}
                      <span className="font-bold">{formatINR(target.settlement.net)}</span> could not
                      be processed. Please verify their UPI details before retrying.
                    </span>
                  </div>
                  <label className="block text-sm font-medium text-ink-900">
                    Failure reason (min 10 chars — shown to provider)
                  </label>
                  <textarea
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value)}
                    rows={3}
                    className="input resize-none"
                    placeholder="e.g. UPI ID invalid, transaction bounced by bank..."
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-brand-50 border border-brand-200 p-3 text-sm text-brand-900">
                    <div className="font-semibold">
                      Refund {formatINR(target.refund.amount)} to {target.refund.booking.learner}
                    </div>
                    <div className="mt-0.5 text-xs truncate">
                      {target.refund.booking.classTitle} · {target.refund.booking.contact}
                    </div>
                  </div>
                  <label className="block text-sm font-medium text-ink-900">Method</label>
                  <div className="flex gap-2">
                    {(["ORIGINAL", "UPI", "MANUAL"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                          method === m
                            ? "border-brand-600 bg-brand-50 text-brand-700"
                            : "border-ink-800/10 text-ink-700 hover:bg-surface-100",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <label className="block text-sm font-medium text-ink-900">
                    UTR / reference number
                  </label>
                  <input
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="input font-mono"
                    placeholder="e.g. 412309876543"
                    autoFocus
                  />
                </>
              )}

              {error ? (
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-ink-800/5">
              <button className="btn-ghost" disabled={busy} onClick={closeModal}>
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={
                  target.kind === "pay"
                    ? submitPay
                    : target.kind === "fail"
                    ? submitFail
                    : submitRefund
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60",
                  target.kind === "fail"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : target.kind === "pay"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-brand-600 hover:bg-brand-700",
                )}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {target.kind === "pay"
                  ? "Confirm paid"
                  : target.kind === "fail"
                  ? "Confirm failed"
                  : "Confirm refund"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative -mb-px flex items-center gap-1 px-4 py-2.5 text-sm font-semibold transition",
        active
          ? "border-b-2 border-brand-600 text-brand-700"
          : "border-b-2 border-transparent text-ink-500 hover:text-ink-900",
      )}
    >
      {children}
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-ink-900 text-white"
          : "bg-white text-ink-700 ring-1 ring-ink-800/10 hover:bg-surface-100",
      )}
    >
      {children}
    </button>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  tint,
  urgent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tint: "brand" | "amber" | "rose" | "emerald";
  urgent?: boolean;
}) {
  const hue =
    tint === "brand"
      ? "bg-brand-50 text-brand-700"
      : tint === "amber"
      ? "bg-amber-50 text-amber-700"
      : tint === "rose"
      ? "bg-rose-50 text-rose-700"
      : "bg-emerald-50 text-emerald-700";
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-2.5 ${hue}`}>
          <Icon className="h-5 w-5" />
        </div>
        {urgent && value > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
            action needed
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-ink-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: SettlementStatus }) {
  const map: Record<SettlementStatus, { cls: string; label: string }> = {
    PENDING: { cls: "bg-amber-100 text-amber-800", label: "Pending" },
    PROCESSING: { cls: "bg-amber-100 text-amber-800", label: "Processing" },
    PAID: { cls: "bg-emerald-100 text-emerald-800", label: "Paid" },
    FAILED: { cls: "bg-rose-100 text-rose-800", label: "Failed" },
    FUTURE: { cls: "bg-ink-800/5 text-ink-700", label: "Future" },
  };
  const it = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${it.cls}`}
    >
      {it.label}
    </span>
  );
}

function RefundBadge({ status }: { status: RefundStatus }) {
  const map: Record<RefundStatus, { cls: string; label: string }> = {
    QUEUED: { cls: "bg-amber-100 text-amber-800", label: "Queued" },
    PROCESSING: { cls: "bg-amber-100 text-amber-800", label: "Processing" },
    COMPLETED: { cls: "bg-emerald-100 text-emerald-800", label: "Completed" },
    FAILED: { cls: "bg-rose-100 text-rose-800", label: "Failed" },
  };
  const it = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${it.cls}`}
    >
      {it.label}
    </span>
  );
}
