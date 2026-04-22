"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarX2,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  History,
  CalendarDays,
  Ban,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { WORKING_DAYS_PER_CYCLE } from "@/lib/cancellation";

type Batch = { id: string; name: string; pricePer4Weeks: number; enrolled: number };
type ClassRow = {
  id: string;
  title: string;
  type: "REGULAR" | "COURSE" | "WORKSHOP";
  status: string;
  batches: Batch[];
};
type Holiday = {
  id: string;
  date: string;
  reason: string | null;
  affectsAll: boolean;
  compensation: "EXTEND" | "REFUND" | "NONE";
  className: string | null;
  batchName: string | null;
};
type Cancellation = {
  id: string;
  scope: "WORKSHOP" | "COURSE" | "BATCH";
  reason: string;
  totalRefund: number;
  affectedBookings: number;
  status: string;
  createdAtIso: string;
  classTitle: string;
  classType: string;
  batchName: string | null;
};

type Tab = "holiday" | "cancel" | "history";
type Scope = "ALL" | "CLASS" | "BATCH";

export function HolidaysClient({
  holidays,
  classes,
  cancellations,
}: {
  holidays: Holiday[];
  classes: ClassRow[];
  cancellations: Cancellation[];
}) {
  const [tab, setTab] = useState<Tab>("holiday");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Holiday & cancellation</h1>
        <p className="mt-1 text-sm text-ink-500">
          Declare days off, cancel entire listings, and review past actions.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-xl bg-surface-100 p-1 w-fit">
        <TabBtn active={tab === "holiday"} onClick={() => setTab("holiday")} icon={<CalendarDays className="h-4 w-4" />}>
          Declare holiday
        </TabBtn>
        <TabBtn active={tab === "cancel"} onClick={() => setTab("cancel")} icon={<Ban className="h-4 w-4" />}>
          Cancel listing
        </TabBtn>
        <TabBtn active={tab === "history"} onClick={() => setTab("history")} icon={<History className="h-4 w-4" />}>
          History
        </TabBtn>
      </div>

      {tab === "holiday" && <HolidayTab classes={classes} holidays={holidays} />}
      {tab === "cancel" && <CancelTab classes={classes} />}
      {tab === "history" && <HistoryTab holidays={holidays} cancellations={cancellations} />}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-white text-brand-700 shadow-sm" : "text-ink-600 hover:text-ink-900"
      }`}
    >
      {icon} {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: declare a holiday
// ---------------------------------------------------------------------------

function HolidayTab({ classes, holidays }: { classes: ClassRow[]; holidays: Holiday[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [scope, setScope] = useState<Scope>("ALL");
  const [classId, setClassId] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [compensation, setCompensation] = useState<"EXTEND" | "REFUND" | "NONE">("EXTEND");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const picked = classes.find((c) => c.id === classId);

  async function add() {
    setErr(null);
    setFlash(null);
    setBusy(true);
    try {
      const r = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          reason: reason || undefined,
          scope,
          classId: scope !== "ALL" ? classId : undefined,
          batchId: scope === "BATCH" ? batchId : undefined,
          compensation,
        }),
      });
      const json = await r.json();
      if (!r.ok) {
        setErr(json.error ?? "Failed to declare holiday");
        return;
      }
      setFlash(
        `Declared · ${json.affectedBookings} booking(s) affected` +
          (json.totalRefundQueued > 0 ? ` · ₹${json.totalRefundQueued} refund queued` : ""),
      );
      setDate("");
      setReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this holiday? Queued (not yet processed) refunds will be voided.")) return;
    await fetch(`/api/holidays/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <h2 className="font-display text-lg font-bold text-ink-900">Declare a holiday</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs font-semibold text-ink-700">
            Date
            <input
              type="date"
              className="input mt-1"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </label>
          <label className="block text-xs font-semibold text-ink-700">
            Reason <span className="font-normal text-ink-400">(optional)</span>
            <input
              className="input mt-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Holi break"
            />
          </label>
        </div>

        <div>
          <div className="text-xs font-semibold text-ink-700">Scope</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["ALL", "CLASS", "BATCH"] as Scope[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ${
                  scope === s
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-white text-ink-700 ring-ink-200 hover:ring-brand-400"
                }`}
              >
                {s === "ALL" ? "All my classes" : s === "CLASS" ? "One class" : "One batch"}
              </button>
            ))}
          </div>
        </div>

        {scope !== "ALL" && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-xs font-semibold text-ink-700">
              Class
              <select
                className="input mt-1"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setBatchId("");
                }}
              >
                <option value="">Select…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} · {c.type.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            {scope === "BATCH" && (
              <label className="block text-xs font-semibold text-ink-700">
                Batch
                <select
                  className="input mt-1"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  disabled={!picked}
                >
                  <option value="">Select…</option>
                  {picked?.batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {b.enrolled} enrolled
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        <div>
          <div className="text-xs font-semibold text-ink-700">Compensation for affected students</div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <CompOption
              picked={compensation === "EXTEND"}
              onClick={() => setCompensation("EXTEND")}
              title="Extend enrollment"
              hint="Each enrolled student's billing cycle shifts by one class day. No refund."
            />
            <CompOption
              picked={compensation === "REFUND"}
              onClick={() => setCompensation("REFUND")}
              title="Refund pro-rata"
              hint={`pricePer4Weeks × (1 / ${WORKING_DAYS_PER_CYCLE}) queued per paid booking.`}
            />
            <CompOption
              picked={compensation === "NONE"}
              onClick={() => setCompensation("NONE")}
              title="No compensation"
              hint="Note the holiday but don't adjust bookings. Use sparingly."
            />
          </div>
        </div>

        {err && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-900 ring-1 ring-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}
        {flash && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
            {flash}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={add}
            disabled={busy || !date || (scope !== "ALL" && !classId) || (scope === "BATCH" && !batchId)}
            className="btn-accent"
          >
            <Plus className="h-4 w-4" /> Declare holiday
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display text-base font-bold text-ink-900">Scheduled holidays</h3>
        {holidays.length === 0 ? (
          <div className="mt-6 text-center text-sm text-ink-500">
            <CalendarX2 className="mx-auto h-8 w-8 text-ink-500/50" />
            No holidays declared yet.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-ink-800/5">
            {holidays.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink-900">
                    {new Date(h.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {h.affectsAll
                      ? "All classes"
                      : `${h.className ?? "—"}${h.batchName ? ` · ${h.batchName}` : ""}`}{" "}
                    · {h.reason || "Day off"} · {compLabel(h.compensation)}
                  </div>
                </div>
                <button
                  onClick={() => remove(h.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="mr-1 inline h-3 w-3" /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompOption({
  picked,
  onClick,
  title,
  hint,
}: {
  picked: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl p-3 text-left ring-1 transition ${
        picked
          ? "bg-brand-50 text-ink-900 ring-brand-500"
          : "bg-white text-ink-700 ring-ink-200 hover:ring-brand-300"
      }`}
    >
      <div className="text-xs font-bold">{title}</div>
      <div className="mt-0.5 text-[11px] text-ink-500">{hint}</div>
    </button>
  );
}

function compLabel(c: "EXTEND" | "REFUND" | "NONE") {
  if (c === "EXTEND") return "Extended enrollments";
  if (c === "REFUND") return "Pro-rata refund";
  return "No compensation";
}

// ---------------------------------------------------------------------------
// Tab 2: cancel a listing (workshop / course / batch)
// ---------------------------------------------------------------------------

function CancelTab({ classes }: { classes: ClassRow[] }) {
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [preview, setPreview] = useState<null | {
    scope: "WORKSHOP" | "COURSE" | "BATCH";
    classTitle: string;
    affectedBookings: number;
    totalRefund: number;
    lines: {
      bookingId: string;
      studentName: string;
      batchName: string;
      mode: string;
      amountPaid: number;
      alreadyRefunded: number;
      refundAmount: number;
    }[];
  }>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const picked = classes.find((c) => c.id === classId);
  // Scope is inferred from class type (REGULAR → BATCH; COURSE → COURSE; WORKSHOP → WORKSHOP).
  const inferredScope: "WORKSHOP" | "COURSE" | "BATCH" | null = picked
    ? picked.type === "WORKSHOP"
      ? "WORKSHOP"
      : picked.type === "COURSE"
      ? "COURSE"
      : "BATCH"
    : null;

  async function loadPreview() {
    setErr(null);
    setFlash(null);
    setPreview(null);
    if (!picked || !inferredScope) return;
    if (inferredScope === "BATCH" && !batchId) {
      setErr("Pick the batch to cancel.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/cancellations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: picked.id, batchId: inferredScope === "BATCH" ? batchId : undefined, scope: inferredScope }),
      });
      const json = await r.json();
      if (!r.ok) {
        setErr(json.error ?? "Failed to load preview");
        return;
      }
      setPreview(json);
    } finally {
      setBusy(false);
    }
  }

  async function doCancel() {
    if (!picked || !inferredScope || !preview) return;
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: picked.id,
          batchId: inferredScope === "BATCH" ? batchId : undefined,
          scope: inferredScope,
          reason,
          confirm,
        }),
      });
      const json = await r.json();
      if (!r.ok) {
        setErr(json.error ?? "Cancellation failed");
        return;
      }
      setFlash(
        `Cancelled · ${json.affectedBookings} booking(s), ₹${json.totalRefund} queued for refund.`,
      );
      setClassId("");
      setBatchId("");
      setReason("");
      setConfirm("");
      setPreview(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <div>
            <strong>This is a destructive action.</strong> Cancelling a listing sets affected
            bookings to CANCELLED and queues full refunds. Archived classes can be reinstated by support.
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs font-semibold text-ink-700">
            Class to cancel
            <select
              className="input mt-1"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setBatchId("");
                setPreview(null);
              }}
            >
              <option value="">Select…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · {c.type.toLowerCase()}
                </option>
              ))}
            </select>
          </label>

          {picked?.type === "REGULAR" && (
            <label className="block text-xs font-semibold text-ink-700">
              Batch
              <select
                className="input mt-1"
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  setPreview(null);
                }}
              >
                <option value="">Select…</option>
                {picked.batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} · {b.enrolled} enrolled
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {picked && inferredScope && (
          <div className="rounded-lg bg-surface-100 p-3 text-xs text-ink-700">
            Scope inferred from class type: <strong>{inferredScope}</strong>.
            {inferredScope === "WORKSHOP" || inferredScope === "COURSE"
              ? " The entire listing and all its batches will be cancelled."
              : " Only the selected batch will be cancelled."}
          </div>
        )}

        <label className="block text-xs font-semibold text-ink-700">
          Reason <span className="font-normal text-ink-400">(min 10 chars, shown to students later via support)</span>
          <textarea
            className="input mt-1"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Studio closure due to renovation"
          />
        </label>

        <div className="flex justify-end">
          <button
            onClick={loadPreview}
            disabled={busy || !picked || (inferredScope === "BATCH" && !batchId) || reason.trim().length < 10}
            className="btn-soft"
          >
            Preview refund breakdown
          </button>
        </div>
      </div>

      {preview && (
        <div className="card space-y-4">
          <div>
            <h3 className="font-display text-base font-bold text-ink-900">Refund breakdown</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              {preview.classTitle} · {preview.affectedBookings} booking(s) · total refund{" "}
              <strong>{formatINR(preview.totalRefund)}</strong>
            </p>
          </div>

          {preview.lines.length === 0 ? (
            <p className="text-sm text-ink-500">No active bookings — cancellation will only archive the class.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wide text-ink-500">
                  <tr className="border-b border-ink-800/5">
                    <th className="py-2">Student</th>
                    <th className="py-2">Batch</th>
                    <th className="py-2">Mode</th>
                    <th className="py-2 text-right">Paid</th>
                    <th className="py-2 text-right">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/5">
                  {preview.lines.map((l) => (
                    <tr key={l.bookingId}>
                      <td className="py-2 font-semibold text-ink-900">{l.studentName}</td>
                      <td className="py-2 text-ink-600">{l.batchName}</td>
                      <td className="py-2 text-ink-600">{l.mode === "TRIAL" ? "Trial" : "Paid"}</td>
                      <td className="py-2 text-right text-ink-700">{formatINR(l.amountPaid)}</td>
                      <td className="py-2 text-right font-semibold text-ink-900">
                        {formatINR(l.refundAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-900 ring-1 ring-rose-200">
            <div className="font-bold">Final confirmation</div>
            <p className="mt-1">
              Type <code className="rounded bg-white px-1 py-0.5 font-mono">CANCEL</code> to
              confirm. This cannot be undone.
            </p>
            <input
              className="input mt-2 bg-white"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type CANCEL"
            />
          </div>

          {err && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-900 ring-1 ring-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setPreview(null)} className="btn-ghost" disabled={busy}>
              Back
            </button>
            <button
              onClick={doCancel}
              disabled={busy || confirm !== "CANCEL"}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:bg-ink-200 disabled:text-ink-500"
            >
              <Ban className="mr-1 inline h-4 w-4" /> Confirm cancellation
            </button>
          </div>
        </div>
      )}

      {flash && (
        <div className="card bg-emerald-50 text-sm text-emerald-900 ring-1 ring-emerald-200">
          {flash}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: history
// ---------------------------------------------------------------------------

function HistoryTab({
  holidays,
  cancellations,
}: {
  holidays: Holiday[];
  cancellations: Cancellation[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card">
        <h3 className="font-display text-base font-bold text-ink-900">Past cancellations</h3>
        {cancellations.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">None yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {cancellations.map((c) => (
              <div key={c.id} className="rounded-xl bg-surface-100 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-900">{c.classTitle}</span>
                  <span className="text-[11px] font-semibold text-rose-700">
                    {c.scope}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-ink-500">
                  {c.batchName ? `${c.batchName} · ` : ""}
                  {c.affectedBookings} booking(s) · {formatINR(c.totalRefund)} refunded ·{" "}
                  {new Date(c.createdAtIso).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="mt-1 text-[11px] text-ink-600 italic">"{c.reason}"</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-display text-base font-bold text-ink-900">Past holidays</h3>
        {holidays.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">None yet.</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-start gap-2">
                <CalendarX2 className="mt-0.5 h-4 w-4 text-ink-500" />
                <div>
                  <div className="font-semibold text-ink-900">
                    {new Date(h.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {h.affectsAll
                      ? "All classes"
                      : `${h.className ?? "—"}${h.batchName ? ` · ${h.batchName}` : ""}`}{" "}
                    · {compLabel(h.compensation)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
