"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitMerge,
  Image as ImageIcon,
  LifeBuoy,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TicketStatus = "OPEN" | "RESOLVED" | "CLOSED" | "MERGED";

type Ticket = {
  id: string;
  code: string;
  subject: string;
  category: string;
  message: string;
  imageUrl: string | null;
  status: TicketStatus;
  resolutionNote: string | null;
  resolvedAtIso: string | null;
  deleteAfterIso: string | null;
  mergedIntoId: string | null;
  createdAtIso: string;
  provider: { name: string; code: string | null; contact: string };
};

type MergeCandidate = {
  id: string;
  code: string;
  subject: string;
  providerName: string;
};

function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000);
}
function formatRelative(iso: string) {
  const h = hoursSince(iso);
  if (h < 1) return "just now";
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
function formatCountdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "deleting now";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days >= 1) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

export function ConcernsClient({
  tab: initialTab,
  q: initialQ,
  counts,
  tickets,
  mergeCandidates,
}: {
  tab: "open" | "resolved" | "merged";
  q: string;
  counts: { open: number; resolved: number; merged: number; overdue: number };
  tickets: Ticket[];
  mergeCandidates: MergeCandidate[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [active, setActive] = useState<Ticket | null>(null);
  const [modal, setModal] = useState<
    | { kind: "resolve"; ticket: Ticket }
    | { kind: "reopen"; ticket: Ticket }
    | { kind: "merge"; ticket: Ticket }
    | { kind: "image"; url: string }
    | null
  >(null);

  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [mergeInto, setMergeInto] = useState<string>("");
  const [mergeNote, setMergeNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const mergeOptions = useMemo(
    () => mergeCandidates.filter((c) => !modal || modal.kind !== "merge" || c.id !== modal.ticket.id),
    [mergeCandidates, modal],
  );

  function closeModal() {
    setModal(null);
    setNote("");
    setReason("");
    setMergeInto("");
    setMergeNote("");
    setError(null);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (initialTab !== "open") next.set("tab", initialTab);
    if (q) next.set("q", q);
    router.push(`/admin/concerns${next.toString() ? `?${next.toString()}` : ""}`);
  }

  function switchTab(t: "open" | "resolved" | "merged") {
    const next = new URLSearchParams();
    if (t !== "open") next.set("tab", t);
    if (q) next.set("q", q);
    router.push(`/admin/concerns${next.toString() ? `?${next.toString()}` : ""}`);
  }

  async function submitResolve() {
    if (!modal || modal.kind !== "resolve") return;
    if (note.trim().length < 20) {
      setError("Resolution note must be at least 20 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/concerns/${modal.ticket.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(`${modal.ticket.code} resolved. Provider notified. Auto-deletes in 7 days.`);
      closeModal();
      setActive(null);
      router.refresh();
      setTimeout(() => setFlash(null), 3500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReopen() {
    if (!modal || modal.kind !== "reopen") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/concerns/${modal.ticket.id}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(`${modal.ticket.code} reopened.`);
      closeModal();
      setActive(null);
      router.refresh();
      setTimeout(() => setFlash(null), 3500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitMerge() {
    if (!modal || modal.kind !== "merge") return;
    if (!mergeInto) {
      setError("Pick a parent ticket to merge into.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/concerns/${modal.ticket.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: mergeInto,
          note: mergeNote.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(`${modal.ticket.code} merged into ${data.parentCode ?? "parent"}.`);
      closeModal();
      setActive(null);
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
        <h1 className="font-display text-3xl font-bold text-ink-900">Provider Concerns</h1>
        <p className="mt-1 text-sm text-ink-500">
          Support tickets raised by providers. Resolved tickets auto-delete 7 days after close.
        </p>
      </header>

      {flash ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
          {flash}
        </div>
      ) : null}

      {counts.overdue > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-rose-600 p-2 text-white">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-rose-900">
                {counts.overdue} concern{counts.overdue === 1 ? "" : "s"} open more than 72 hours
              </div>
              <div className="mt-0.5 text-sm text-rose-800">
                SLA breach — prioritise these in the Open tab.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 border-b border-ink-800/5">
          <TabBtn active={initialTab === "open"} onClick={() => switchTab("open")}>
            Open
            <Chip>{counts.open}</Chip>
          </TabBtn>
          <TabBtn active={initialTab === "resolved"} onClick={() => switchTab("resolved")}>
            Resolved
            <Chip>{counts.resolved}</Chip>
          </TabBtn>
          <TabBtn active={initialTab === "merged"} onClick={() => switchTab("merged")}>
            Merged
            <Chip>{counts.merged}</Chip>
          </TabBtn>
        </div>
        <form onSubmit={submitSearch} className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by code, subject, provider..."
            className="input pl-10"
          />
        </form>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center py-10">
          <LifeBuoy className="mx-auto h-10 w-10 text-ink-500/40" />
          <div className="mt-3 font-display text-lg font-bold text-ink-900">
            {initialTab === "open"
              ? "No open concerns — nice."
              : initialTab === "resolved"
              ? "No resolved concerns yet."
              : "No merged concerns."}
          </div>
          {q ? (
            <p className="mt-1 text-sm text-ink-500">
              No matches for "{q}". Try a different search.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {tickets.map((t) => {
            const hours = hoursSince(t.createdAtIso);
            const overdue = t.status === "OPEN" && hours >= 72;
            const warning = t.status === "OPEN" && hours >= 48 && hours < 72;
            return (
              <article
                key={t.id}
                className={cn(
                  "card cursor-pointer transition hover:shadow-float",
                  overdue ? "ring-2 ring-rose-300" : "",
                )}
                onClick={() => setActive(t)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-ink-500">
                        {t.code}
                      </span>
                      <StatusBadge status={t.status} />
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                          <AlertTriangle className="h-3 w-3" /> overdue
                        </span>
                      ) : warning ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          <Clock className="h-3 w-3" /> {Math.round(hours)}h
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-1.5 font-display font-bold text-ink-900 truncate">
                      {t.subject}
                    </h3>
                    <div className="mt-0.5 text-xs text-ink-500 truncate">
                      {t.provider.name}
                      {t.provider.code ? ` · ${t.provider.code}` : ""} · {formatRelative(t.createdAtIso)}
                    </div>
                  </div>
                  {t.imageUrl ? (
                    <ImageIcon className="h-4 w-4 text-ink-500/70 shrink-0 mt-1" />
                  ) : null}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-ink-700">{t.message}</p>
                {t.status === "RESOLVED" && t.deleteAfterIso ? (
                  <div className="mt-3 text-[11px] text-ink-500">
                    Auto-deletes · {formatCountdown(t.deleteAfterIso)}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {/* Ticket detail drawer */}
      {active ? (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-ink-900/50"
          onClick={() => setActive(null)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-float"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-800/5 bg-white px-5 py-4">
              <div>
                <div className="font-mono text-xs font-semibold text-ink-500">{active.code}</div>
                <h3 className="mt-0.5 font-display text-lg font-bold text-ink-900">
                  {active.subject}
                </h3>
              </div>
              <button
                onClick={() => setActive(null)}
                className="p-1.5 rounded-lg text-ink-500 hover:bg-surface-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={active.status} />
                <span className="badge bg-surface-100 text-ink-700">{active.category}</span>
                <span className="text-xs text-ink-500">
                  Submitted {formatRelative(active.createdAtIso)}
                </span>
              </div>

              <section>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Provider
                </div>
                <div className="mt-1 font-medium text-ink-900">{active.provider.name}</div>
                <div className="text-xs text-ink-500">
                  {active.provider.code ?? "—"} · {active.provider.contact}
                </div>
              </section>

              <section>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Message
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-ink-800">{active.message}</p>
                {active.imageUrl ? (
                  <button
                    onClick={() => setModal({ kind: "image", url: active.imageUrl! })}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> View attachment
                  </button>
                ) : null}
              </section>

              {active.resolutionNote ? (
                <section className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Resolution note
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-900">
                    {active.resolutionNote}
                  </p>
                  {active.deleteAfterIso ? (
                    <div className="mt-2 text-[11px] text-emerald-700">
                      Auto-deletes · {formatCountdown(active.deleteAfterIso)}
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>

            <div className="sticky bottom-0 border-t border-ink-800/5 bg-white px-5 py-4">
              {active.status === "OPEN" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setModal({ kind: "resolve", ticket: active })}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Resolve
                  </button>
                  <button
                    onClick={() => setModal({ kind: "merge", ticket: active })}
                    className="btn-ghost"
                  >
                    <GitMerge className="h-4 w-4" /> Merge duplicate
                  </button>
                </div>
              ) : active.status === "RESOLVED" || active.status === "CLOSED" ? (
                <button
                  onClick={() => setModal({ kind: "reopen", ticket: active })}
                  className="btn-ghost"
                >
                  <RotateCcw className="h-4 w-4" /> Reopen
                </button>
              ) : (
                <div className="text-xs text-ink-500">
                  This ticket was merged into another. No further action required here.
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {/* Action modals */}
      {modal && modal.kind !== "image" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-float"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800/5">
              <h3 className="font-display text-lg font-bold text-ink-900">
                {modal.kind === "resolve"
                  ? "Resolve concern"
                  : modal.kind === "reopen"
                  ? "Reopen concern"
                  : "Merge duplicate"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-ink-500 hover:bg-surface-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="rounded-lg bg-surface-100 p-3 text-sm">
                <div className="font-mono text-[11px] font-semibold text-ink-500">
                  {modal.ticket.code}
                </div>
                <div className="font-semibold text-ink-900">{modal.ticket.subject}</div>
                <div className="mt-0.5 text-xs text-ink-500">{modal.ticket.provider.name}</div>
              </div>

              {modal.kind === "resolve" ? (
                <>
                  <label className="block text-sm font-medium text-ink-900">
                    Resolution note (min 20 chars — sent to provider)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={5}
                    className="input resize-none"
                    placeholder="Summarise how you resolved this concern. The provider will see this note."
                    autoFocus
                  />
                  <p className="text-xs text-ink-500">
                    Resolved tickets stay visible for 7 days, then auto-delete.
                  </p>
                </>
              ) : modal.kind === "reopen" ? (
                <>
                  <label className="block text-sm font-medium text-ink-900">
                    Reason (optional — shown to provider)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="input resize-none"
                    placeholder="Why are we reopening this?"
                  />
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-ink-900">
                    Merge into parent ticket
                  </label>
                  {mergeOptions.length === 0 ? (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                      No other open tickets to merge into.
                    </div>
                  ) : (
                    <select
                      value={mergeInto}
                      onChange={(e) => setMergeInto(e.target.value)}
                      className="input"
                      autoFocus
                    >
                      <option value="">Choose parent ticket...</option>
                      {mergeOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} · {c.subject} ({c.providerName})
                        </option>
                      ))}
                    </select>
                  )}
                  <label className="block text-sm font-medium text-ink-900">Note (optional)</label>
                  <textarea
                    value={mergeNote}
                    onChange={(e) => setMergeNote(e.target.value)}
                    rows={2}
                    className="input resize-none"
                    placeholder="Internal note or context shared with the provider..."
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
                disabled={busy || (modal.kind === "merge" && mergeOptions.length === 0)}
                onClick={
                  modal.kind === "resolve"
                    ? submitResolve
                    : modal.kind === "reopen"
                    ? submitReopen
                    : submitMerge
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60",
                  modal.kind === "resolve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : modal.kind === "reopen"
                    ? "bg-brand-600 hover:bg-brand-700"
                    : "bg-ink-800 hover:bg-ink-900",
                )}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {modal.kind === "resolve"
                  ? "Confirm resolve"
                  : modal.kind === "reopen"
                  ? "Confirm reopen"
                  : "Confirm merge"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Attachment viewer */}
      {modal && modal.kind === "image" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-4"
          onClick={closeModal}
        >
          <div className="relative max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeModal}
              className="absolute -right-3 -top-3 rounded-full bg-white p-2 text-ink-700 shadow-float"
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={modal.url}
              alt="Concern attachment"
              className="max-h-[85vh] max-w-full rounded-xl shadow-float"
            />
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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 rounded-full bg-ink-800/5 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, { cls: string; label: string }> = {
    OPEN: { cls: "bg-amber-100 text-amber-800", label: "Open" },
    RESOLVED: { cls: "bg-emerald-100 text-emerald-800", label: "Resolved" },
    CLOSED: { cls: "bg-ink-800/5 text-ink-700", label: "Closed" },
    MERGED: { cls: "bg-violet-100 text-violet-800", label: "Merged" },
  };
  const it = map[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${it.cls}`}>
      {it.label}
    </span>
  );
}
