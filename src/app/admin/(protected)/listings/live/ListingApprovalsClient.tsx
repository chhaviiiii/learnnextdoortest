"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpenCheck, Check, Loader2, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";

type Batch = { id: string; name: string; fromTime: string; toTime: string; pricePer4Weeks: number };
type Pending = {
  id: string;
  title: string;
  description: string | null;
  type: "REGULAR" | "COURSE" | "WORKSHOP";
  category: string;
  subcategory: string | null;
  provider: { name: string; code: string; kycStatus: string };
  submittedAtIso: string;
  batches: Batch[];
};
type Rejected = {
  id: string;
  title: string;
  provider: { name: string; code: string };
  reason: string;
  decidedAtIso: string | null;
};

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function daysColor(days: number) {
  if (days <= 1) return "bg-emerald-100 text-emerald-800";
  if (days <= 3) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export function ListingApprovalsClient({
  tab,
  counts,
  pending,
  rejected,
}: {
  tab: "pending" | "rejected";
  counts: { PENDING_APPROVAL: number; REJECTED: number; APPROVED: number; BLOCKED: number };
  pending: Pending[];
  rejected: Rejected[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [target, setTarget] = useState<
    | { id: string; title: string; action: "APPROVE" | "REJECT" }
    | null
  >(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function go(t: "pending" | "rejected") {
    const next = new URLSearchParams(sp.toString());
    next.set("tab", t);
    router.push(`/admin/listings/live?${next.toString()}`);
  }

  async function submitAction() {
    if (!target) return;
    if (target.action === "REJECT" && reason.trim().length < 10) {
      setError("Rejection reason must be at least 10 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/listings/${target.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: target.action,
          reason: target.action === "REJECT" ? reason.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(
        target.action === "APPROVE"
          ? `"${target.title}" is now live.`
          : `"${target.title}" rejected.`,
      );
      setTarget(null);
      setReason("");
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Listing Approvals</h1>
          <p className="mt-1 text-sm text-ink-500">
            {counts.PENDING_APPROVAL} pending · {counts.APPROVED} live · {counts.REJECTED} rejected · {counts.BLOCKED} blocked
          </p>
        </div>
      </header>

      {flash ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
          {flash}
        </div>
      ) : null}

      <div className="flex gap-1 border-b border-ink-800/10">
        {([
          { k: "pending" as const, label: "Pending", count: counts.PENDING_APPROVAL },
          { k: "rejected" as const, label: "Rejected", count: counts.REJECTED },
        ]).map((t) => (
          <button
            key={t.k}
            onClick={() => go(t.k)}
            className={cn(
              "rounded-t-xl px-4 py-2.5 text-sm font-semibold transition -mb-px border-b-2",
              tab === t.k
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {t.label}
            <span className="ml-2 inline-flex items-center rounded-full bg-surface-100 px-1.5 text-[10px] font-bold text-ink-700">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "pending" ? (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="card text-center py-10">
              <BookOpenCheck className="mx-auto h-10 w-10 text-ink-500/40" />
              <div className="mt-3 font-display text-lg font-bold text-ink-900">Queue is clear</div>
              <p className="mt-1 text-sm text-ink-500">No listings awaiting approval.</p>
            </div>
          ) : (
            pending.map((c) => {
              const days = daysSince(c.submittedAtIso);
              return (
                <div key={c.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-bold text-ink-900">{c.title}</h3>
                        <span className="badge bg-surface-100 text-ink-700">{c.type}</span>
                        {c.provider.kycStatus === "VERIFIED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            <ShieldCheck className="h-3 w-3" /> KYC verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                            <ShieldAlert className="h-3 w-3" /> KYC {c.provider.kycStatus.toLowerCase()}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-ink-500">
                        By <span className="font-semibold text-ink-700">{c.provider.name}</span> ({c.provider.code}) ·{" "}
                        {c.category}
                        {c.subcategory ? ` / ${c.subcategory}` : ""}
                      </div>
                      {c.description ? (
                        <p className="mt-2 text-sm text-ink-700 line-clamp-3">{c.description}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {c.batches.map((b) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2 py-1 text-[11px] text-ink-700"
                          >
                            <span className="font-semibold">{b.name}</span>
                            <span className="text-ink-500">
                              · {b.fromTime}–{b.toTime} · {formatINR(b.pricePer4Weeks)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", daysColor(days))}>
                        {days === 0 ? "Today" : days === 1 ? "1 day pending" : `${days} days pending`}
                      </span>
                      <div className="flex gap-1.5">
                        {c.provider.kycStatus !== "VERIFIED" ? (
                          <div className="text-[11px] text-rose-700 max-w-[180px] text-right">
                            Provider KYC not verified. Approve KYC first.
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setTarget({ id: c.id, title: c.title, action: "APPROVE" })}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </button>
                            <button
                              onClick={() => setTarget({ id: c.id, title: c.title, action: "REJECT" })}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                              <X className="h-3 w-3" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {rejected.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-500">No rejected listings.</div>
          ) : (
            <table className="min-w-full divide-y divide-ink-800/5 text-sm">
              <thead className="bg-surface-100 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Rejection reason</th>
                  <th className="px-4 py-3">Decided</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/5">
                {rejected.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-semibold text-ink-900">{r.title}</td>
                    <td className="px-4 py-3 text-ink-700">
                      {r.provider.name}
                      <div className="text-xs text-ink-500">{r.provider.code}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-700 max-w-md">{r.reason}</td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {r.decidedAtIso ? new Date(r.decidedAtIso).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {target ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
          onClick={() => {
            setTarget(null);
            setReason("");
            setError(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-float"
          >
            <div className="px-5 py-4 border-b border-ink-800/5">
              <h3 className="font-display text-lg font-bold text-ink-900">
                {target.action === "APPROVE" ? "Approve listing" : "Reject listing"}
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-ink-700">
                <span className="font-semibold">{target.title}</span>
              </p>
              {target.action === "REJECT" ? (
                <>
                  <label className="text-sm font-medium text-ink-900">
                    Rejection reason (min 10 chars, sent to provider)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="input resize-none"
                    placeholder="e.g. images are low-quality, title misleading, pricing is outside platform guidelines..."
                  />
                </>
              ) : (
                <p className="text-sm text-ink-500">
                  This listing will go live on the platform immediately. The provider will be notified.
                </p>
              )}
              {error ? (
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-ink-800/5">
              <button
                className="btn-ghost"
                disabled={busy}
                onClick={() => {
                  setTarget(null);
                  setReason("");
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={submitAction}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60",
                  target.action === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700",
                )}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm {target.action.toLowerCase()}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
