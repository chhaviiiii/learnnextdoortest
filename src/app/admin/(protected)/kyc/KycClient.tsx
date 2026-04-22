"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Check,
  FileText,
  Loader2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type KycStatus = "NOT_UPLOADED" | "PENDING" | "VERIFIED" | "REJECTED";

type Provider = {
  id: string;
  providerCode: string;
  instituteName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  area: string | null;
  address: string | null;
  upiId: string | null;
  kycStatus: string;
  kycDocType: string | null;
  kycDocUrl: string | null;
  kycSubmittedAtIso: string | null;
  kycVerifiedAtIso: string | null;
  kycRejectionReason: string | null;
};

type Instructor = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  providerName: string;
  providerCode: string;
  kycStatus: string;
  kycDocType: string | null;
  kycDocUrl: string | null;
  kycSubmittedAtIso: string | null;
  kycVerifiedAtIso: string | null;
  kycRejectionReason: string | null;
};

type Counts = { PENDING: number; VERIFIED: number; REJECTED: number };

const FILTERS: Array<{ value: "PENDING" | "VERIFIED" | "REJECTED" | "ALL"; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ALL", label: "All" },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    VERIFIED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-rose-100 text-rose-800",
    NOT_UPLOADED: "bg-ink-800/10 text-ink-800",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", map[status] ?? map.NOT_UPLOADED)}>
      {status === "VERIFIED" ? "Approved" : status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function KycClient({
  tab,
  filter,
  counts,
  providers,
  instructors,
}: {
  tab: "providers" | "instructors";
  filter: "PENDING" | "VERIFIED" | "REJECTED" | "ALL";
  counts: { providers: Counts; instructors: Counts };
  providers: Provider[];
  instructors: Instructor[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [viewer, setViewer] = useState<{ url: string; name: string } | null>(null);
  const [actionTarget, setActionTarget] = useState<
    | { kind: "provider" | "instructor"; id: string; name: string; action: "APPROVE" | "REJECT" | "REVOKE" }
    | null
  >(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function go(params: Partial<{ tab: string; filter: string }>) {
    const next = new URLSearchParams(sp.toString());
    if (params.tab) next.set("tab", params.tab);
    if (params.filter) next.set("filter", params.filter);
    router.push(`/admin/kyc?${next.toString()}`);
  }

  const activeCounts = tab === "providers" ? counts.providers : counts.instructors;
  const rows = tab === "providers" ? providers : instructors;

  async function submitAction() {
    if (!actionTarget) return;
    const reasonNeeded = actionTarget.action !== "APPROVE";
    const r = reason.trim();
    if (reasonNeeded && r.length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const endpoint =
        actionTarget.kind === "provider"
          ? `/api/admin/kyc/provider/${actionTarget.id}`
          : `/api/admin/kyc/instructor/${actionTarget.id}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionTarget.action, reason: reasonNeeded ? r : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(
        actionTarget.action === "APPROVE"
          ? `Approved KYC for ${actionTarget.name}.`
          : actionTarget.action === "REJECT"
          ? `Rejected KYC for ${actionTarget.name}.`
          : `Revoked KYC for ${actionTarget.name}.`,
      );
      setActionTarget(null);
      setReason("");
      router.refresh();
      setTimeout(() => setFlash(null), 3500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const pendingCount = useMemo(() => counts.providers.PENDING + counts.instructors.PENDING, [counts]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">KYC Approvals</h1>
        <p className="mt-1 text-sm text-ink-500">
          {pendingCount} total pending application{pendingCount === 1 ? "" : "s"} across providers and instructors.
        </p>
      </header>

      {flash ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
          {flash}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800/10">
        <div className="flex gap-1">
          {(["providers", "instructors"] as const).map((t) => (
            <button
              key={t}
              onClick={() => go({ tab: t })}
              className={cn(
                "rounded-t-xl px-4 py-2.5 text-sm font-semibold transition -mb-px border-b-2",
                tab === t
                  ? "border-brand-600 text-brand-700 bg-white"
                  : "border-transparent text-ink-500 hover:text-ink-900",
              )}
            >
              {t === "providers" ? "Providers" : "Instructors"}
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">
                {t === "providers" ? counts.providers.PENDING : counts.instructors.PENDING}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => go({ filter: f.value })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                filter === f.value ? "bg-ink-900 text-white" : "bg-surface-100 text-ink-700 hover:bg-ink-100",
              )}
            >
              {f.label}
              {f.value !== "ALL" ? (
                <span className="ml-1.5 text-[10px] opacity-70">{activeCounts[f.value as keyof Counts]}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-ink-500/40" />
            <div className="mt-3 font-display text-lg font-bold text-ink-900">Nothing here</div>
            <p className="mt-1 text-sm text-ink-500">No {tab} in the {filter.toLowerCase()} state.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-800/5 text-sm">
              <thead className="bg-surface-100 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">{tab === "providers" ? "Provider" : "Instructor"}</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Doc</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/5">
                {tab === "providers"
                  ? providers.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink-900">{p.instituteName}</div>
                          <div className="text-xs text-ink-500">
                            {p.providerCode} · {p.area ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-ink-900">{p.contactName}</div>
                          <div className="text-xs text-ink-500">
                            {p.contactEmail ?? p.contactPhone ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.kycDocUrl ? (
                            <button
                              onClick={() => setViewer({ url: p.kycDocUrl!, name: `${p.instituteName} — ${p.kycDocType ?? "KYC"}` })}
                              className="inline-flex items-center gap-1.5 text-brand-700 hover:underline text-xs font-semibold"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {p.kycDocType ?? "View"}
                            </button>
                          ) : (
                            <span className="text-xs text-ink-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-700">{formatDate(p.kycSubmittedAtIso)}</td>
                        <td className="px-4 py-3">{statusBadge(p.kycStatus)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1.5">
                            {p.kycStatus === "PENDING" ? (
                              <>
                                <button
                                  onClick={() =>
                                    setActionTarget({ kind: "provider", id: p.id, name: p.instituteName, action: "APPROVE" })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                  <Check className="h-3 w-3" /> Approve
                                </button>
                                <button
                                  onClick={() =>
                                    setActionTarget({ kind: "provider", id: p.id, name: p.instituteName, action: "REJECT" })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                                >
                                  <X className="h-3 w-3" /> Reject
                                </button>
                              </>
                            ) : p.kycStatus === "VERIFIED" ? (
                              <button
                                onClick={() =>
                                  setActionTarget({ kind: "provider", id: p.id, name: p.instituteName, action: "REVOKE" })
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                              >
                                <RotateCcw className="h-3 w-3" /> Revoke
                              </button>
                            ) : p.kycStatus === "REJECTED" ? (
                              <span className="text-xs text-ink-500 italic">Awaiting resubmission</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  : instructors.map((i) => (
                      <tr key={i.id} className="hover:bg-surface-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink-900">{i.name}</div>
                          <div className="text-xs text-ink-500">{i.specialty ?? "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-ink-900">{i.providerName}</div>
                          <div className="text-xs text-ink-500">{i.providerCode}</div>
                        </td>
                        <td className="px-4 py-3">
                          {i.kycDocUrl ? (
                            <button
                              onClick={() => setViewer({ url: i.kycDocUrl!, name: `${i.name} — ${i.kycDocType ?? "KYC"}` })}
                              className="inline-flex items-center gap-1.5 text-brand-700 hover:underline text-xs font-semibold"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {i.kycDocType ?? "View"}
                            </button>
                          ) : (
                            <span className="text-xs text-ink-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-700">{formatDate(i.kycSubmittedAtIso)}</td>
                        <td className="px-4 py-3">{statusBadge(i.kycStatus)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1.5">
                            {i.kycStatus === "PENDING" ? (
                              <>
                                <button
                                  onClick={() =>
                                    setActionTarget({ kind: "instructor", id: i.id, name: i.name, action: "APPROVE" })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                  <Check className="h-3 w-3" /> Approve
                                </button>
                                <button
                                  onClick={() =>
                                    setActionTarget({ kind: "instructor", id: i.id, name: i.name, action: "REJECT" })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                                >
                                  <X className="h-3 w-3" /> Reject
                                </button>
                              </>
                            ) : i.kycStatus === "VERIFIED" ? (
                              <button
                                onClick={() =>
                                  setActionTarget({ kind: "instructor", id: i.id, name: i.name, action: "REVOKE" })
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                              >
                                <RotateCcw className="h-3 w-3" /> Revoke
                              </button>
                            ) : i.kycStatus === "REJECTED" ? (
                              <span className="text-xs text-ink-500 italic">Awaiting resubmission</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doc viewer modal */}
      {viewer ? (
        <Modal onClose={() => setViewer(null)} title={viewer.name} wide>
          <DocViewer url={viewer.url} />
        </Modal>
      ) : null}

      {/* Action confirmation modal */}
      {actionTarget ? (
        <Modal
          onClose={() => {
            setActionTarget(null);
            setReason("");
            setError(null);
          }}
          title={
            actionTarget.action === "APPROVE"
              ? `Approve KYC — ${actionTarget.name}`
              : actionTarget.action === "REJECT"
              ? `Reject KYC — ${actionTarget.name}`
              : `Revoke KYC — ${actionTarget.name}`
          }
        >
          <div className="space-y-3">
            {actionTarget.action === "APPROVE" ? (
              <p className="text-sm text-ink-700">
                This will mark the {actionTarget.kind} as verified. The provider will be notified and the verified badge
                will appear on their listings.
              </p>
            ) : (
              <>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {actionTarget.action === "REJECT"
                      ? "The provider will be asked to resubmit corrected documents."
                      : "Verified badge will be removed from all listings. Provider will need to resubmit."}
                  </span>
                </div>
                <label className="text-sm font-medium text-ink-900">Reason (min 10 chars, sent to provider)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="input resize-none"
                  placeholder="Be specific: e.g. document is blurry, name mismatch, expired ID..."
                />
              </>
            )}
            {error ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActionTarget(null);
                  setReason("");
                  setError(null);
                }}
                className="btn-ghost"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={busy}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60",
                  actionTarget.action === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : actionTarget.action === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-amber-600 hover:bg-amber-700",
                )}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm {actionTarget.action.toLowerCase()}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({
  onClose,
  title,
  children,
  wide,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-2xl bg-white shadow-float max-h-[90vh] overflow-hidden flex flex-col",
          wide ? "max-w-4xl" : "max-w-md",
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800/5">
          <h3 className="font-display text-lg font-bold text-ink-900 truncate pr-3">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-500 hover:bg-surface-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function DocViewer({ url }: { url: string }) {
  const isImg = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);
  const isPdf = /\.pdf(\?|$)/i.test(url);
  if (isImg) {
    // Using native <img> to avoid Next/Image remote-host config; admin-only context, not user-facing perf.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="KYC document" className="mx-auto max-h-[70vh] rounded-xl border border-ink-800/10" />;
  }
  if (isPdf) {
    return <iframe src={url} className="h-[70vh] w-full rounded-xl border border-ink-800/10" />;
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      Unknown document type.{" "}
      <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
        Open in new tab
      </a>
    </div>
  );
}
