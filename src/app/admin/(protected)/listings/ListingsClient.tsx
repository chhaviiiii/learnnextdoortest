"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Listing = {
  id: string;
  title: string;
  type: "REGULAR" | "COURSE" | "WORKSHOP";
  category: string;
  status: string;
  liveStatus: string;
  liveReason: string | null;
  provider: { name: string; code: string };
  batchCount: number;
  createdAtIso: string;
};

const STATUSES: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "LIVE", label: "Live" },
  { value: "PENDING", label: "Pending" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "REJECTED", label: "Rejected" },
];

function liveStatusBadge(ls: string) {
  const map: Record<string, string> = {
    APPROVED: "bg-emerald-100 text-emerald-800",
    PENDING_APPROVAL: "bg-amber-100 text-amber-800",
    REJECTED: "bg-rose-100 text-rose-800",
    BLOCKED: "bg-ink-800/80 text-white",
  };
  const label = ls === "APPROVED" ? "Live" : ls === "PENDING_APPROVAL" ? "Pending" : ls.charAt(0) + ls.slice(1).toLowerCase();
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold", map[ls] ?? "bg-surface-100 text-ink-700")}>
      {label}
    </span>
  );
}

export function ListingsClient({
  q: initialQ,
  statusFilter,
  listings,
}: {
  q: string;
  statusFilter: string;
  listings: Listing[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [target, setTarget] = useState<
    | { id: string; title: string; action: "BLOCK" | "UNBLOCK" }
    | null
  >(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function go(params: Partial<{ q: string; status: string }>) {
    const next = new URLSearchParams();
    const useQ = params.q !== undefined ? params.q : q;
    const useStatus = params.status ?? statusFilter;
    if (useQ) next.set("q", useQ);
    if (useStatus && useStatus !== "ALL") next.set("status", useStatus);
    router.push(`/admin/listings${next.toString() ? `?${next.toString()}` : ""}`);
  }

  async function submitBlock() {
    if (!target) return;
    if (target.action === "BLOCK" && reason.trim().length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/listings/${target.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: target.action,
          reason: target.action === "BLOCK" ? reason.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(target.action === "BLOCK" ? `Blocked "${target.title}".` : `Reinstated "${target.title}".`);
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
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Listing Management</h1>
        <p className="mt-1 text-sm text-ink-500">
          Search listings by title, listing ID, provider name, or provider code.
        </p>
      </header>

      {flash ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
          {flash}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go({ q });
          }}
          className="flex-1 min-w-[260px] relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, listing ID, provider name, or code…"
            className="input pl-10"
          />
        </form>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => go({ status: s.value })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                statusFilter === s.value ? "bg-ink-900 text-white" : "bg-surface-100 text-ink-700 hover:bg-ink-100",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {listings.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-500">No listings match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-800/5 text-sm">
              <thead className="bg-surface-100 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Batches</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/5">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink-900">{l.title}</div>
                      <div className="text-xs text-ink-500">{l.id} · {l.category}</div>
                      {l.liveStatus === "BLOCKED" && l.liveReason ? (
                        <div className="mt-1 text-[11px] text-rose-700">Blocked: {l.liveReason}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-ink-900">{l.provider.name}</div>
                      <div className="text-xs text-ink-500">{l.provider.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-surface-100 text-ink-700">{l.type}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{l.batchCount}</td>
                    <td className="px-4 py-3">{liveStatusBadge(l.liveStatus)}</td>
                    <td className="px-4 py-3 text-right">
                      {l.liveStatus === "APPROVED" ? (
                        <button
                          onClick={() => setTarget({ id: l.id, title: l.title, action: "BLOCK" })}
                          className="inline-flex items-center gap-1 rounded-lg bg-ink-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-ink-900"
                        >
                          <Ban className="h-3 w-3" /> Block
                        </button>
                      ) : l.liveStatus === "BLOCKED" ? (
                        <button
                          onClick={() => setTarget({ id: l.id, title: l.title, action: "UNBLOCK" })}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Unblock
                        </button>
                      ) : (
                        <span className="text-xs text-ink-500 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800/5">
              <h3 className="font-display text-lg font-bold text-ink-900">
                {target.action === "BLOCK" ? "Block listing" : "Unblock listing"}
              </h3>
              <button
                onClick={() => {
                  setTarget(null);
                  setReason("");
                  setError(null);
                }}
                className="p-1.5 rounded-lg text-ink-500 hover:bg-surface-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-ink-700">
                <span className="font-semibold">{target.title}</span>
              </p>
              {target.action === "BLOCK" ? (
                <>
                  <p className="text-sm text-ink-500">
                    Blocking removes the listing from the learner-facing site immediately. The provider will be notified.
                  </p>
                  <label className="text-sm font-medium text-ink-900">
                    Reason (min 10 chars, sent to provider)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="input resize-none"
                    placeholder="e.g. multiple complaints, content policy violation, suspected fraud..."
                  />
                </>
              ) : (
                <p className="text-sm text-ink-500">
                  This listing will be reinstated and become visible to learners again.
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
                onClick={submitBlock}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60",
                  target.action === "BLOCK" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700",
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
