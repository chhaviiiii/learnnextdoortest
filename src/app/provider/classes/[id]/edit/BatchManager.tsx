"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";

type Batch = {
  id: string;
  name: string;
  classDaysCsv: string | null;
  fromTime: string;
  toTime: string;
  pricePer4Weeks: number;
  maxStudents: number;
  enrolled: number;
  freeTrialEnabled: boolean;
  freeTrialSessions: number;
  instructorId: string | null;
};

type Instructor = { id: string; name: string };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BatchManager({
  classId,
  initialBatches,
  instructors,
  classType,
}: {
  classId: string;
  initialBatches: Batch[];
  instructors: Instructor[];
  classType: "REGULAR" | "COURSE" | "WORKSHOP";
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const priceSuffix = classType === "REGULAR" ? "/ 4 wks" : "";

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-ink-900">Batches</h3>
        <button
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> New batch
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {creating && (
          <BatchEditor
            mode="create"
            classId={classId}
            instructors={instructors}
            priceSuffix={priceSuffix}
            onDone={() => {
              setCreating(false);
              router.refresh();
            }}
            onCancel={() => setCreating(false)}
          />
        )}

        {initialBatches.length === 0 && !creating && (
          <p className="rounded-xl bg-surface-100 p-4 text-xs text-ink-500">
            No batches yet. Click <span className="font-semibold">New batch</span> to schedule one.
          </p>
        )}

        {initialBatches.map((b) =>
          editingId === b.id ? (
            <BatchEditor
              key={b.id}
              mode="edit"
              batch={b}
              classId={classId}
              instructors={instructors}
              priceSuffix={priceSuffix}
              onDone={() => {
                setEditingId(null);
                router.refresh();
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <BatchRow
              key={b.id}
              batch={b}
              instructors={instructors}
              priceSuffix={priceSuffix}
              onEdit={() => {
                setEditingId(b.id);
                setCreating(false);
              }}
              onDeleted={() => router.refresh()}
            />
          )
        )}
      </div>
    </div>
  );
}

function BatchRow({
  batch,
  instructors,
  priceSuffix,
  onEdit,
  onDeleted,
}: {
  batch: Batch;
  instructors: Instructor[];
  priceSuffix: string;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const instructor = batch.instructorId
    ? instructors.find((i) => i.id === batch.instructorId)
    : null;

  async function remove() {
    if (batch.enrolled > 0) {
      alert(
        `This batch has ${batch.enrolled} enrolled students and can't be deleted. Edit its schedule or archive the class instead.`
      );
      return;
    }
    if (!confirm(`Delete batch "${batch.name}"?`)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/batches/${batch.id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Failed to delete");
      onDeleted();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-surface-100 p-3 ring-1 ring-ink-800/5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-900">{batch.name}</div>
          <div className="mt-0.5 text-[11px] text-ink-500">
            {batch.classDaysCsv || "—"} · {batch.fromTime}–{batch.toTime}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-500">
            {batch.enrolled}/{batch.maxStudents} enrolled
            {instructor ? ` · ${instructor.name}` : ""}
            {batch.freeTrialEnabled ? ` · ${batch.freeTrialSessions} free trial${batch.freeTrialSessions === 1 ? "" : "s"}` : ""}
          </div>
          <div className="mt-1 text-xs font-semibold text-brand-600">
            ₹{batch.pricePer4Weeks.toLocaleString("en-IN")} {priceSuffix}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            onClick={onEdit}
            className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
          >
            Edit
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function BatchEditor({
  mode,
  batch,
  classId,
  instructors,
  priceSuffix,
  onDone,
  onCancel,
}: {
  mode: "create" | "edit";
  batch?: Batch;
  classId: string;
  instructors: Instructor[];
  priceSuffix: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: batch?.name ?? "",
    classDaysCsv: batch?.classDaysCsv ?? "",
    fromTime: batch?.fromTime ?? "18:00",
    toTime: batch?.toTime ?? "19:00",
    pricePer4Weeks: batch?.pricePer4Weeks ?? 2000,
    maxStudents: batch?.maxStudents ?? 15,
    freeTrialEnabled: batch?.freeTrialEnabled ?? true,
    freeTrialSessions: batch?.freeTrialSessions ?? 1,
    instructorId: batch?.instructorId ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedDays = new Set(
    form.classDaysCsv.split(",").map((d) => d.trim()).filter(Boolean)
  );

  function toggleDay(day: string) {
    const next = new Set(selectedDays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setForm({
      ...form,
      classDaysCsv: DAYS.filter((d) => next.has(d)).join(","),
    });
  }

  async function save() {
    setErr(null);
    if (!form.name.trim()) {
      setErr("Batch name is required.");
      return;
    }
    if (!form.classDaysCsv) {
      setErr("Pick at least one day.");
      return;
    }
    setBusy(true);
    try {
      const url = mode === "create" ? "/api/batches" : `/api/batches/${batch!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const body = mode === "create" ? { ...form, classId } : form;
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Failed");
      onDone();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 ring-2 ring-brand-500/30">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {mode === "create" ? "New batch" : "Edit batch"}
        </div>
        <button onClick={onCancel} className="text-ink-500 hover:text-ink-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-ink-700">Batch name</label>
        <input
          className="input mt-1"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Morning Beginners"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-ink-700">Class days</label>
        <div className="mt-1 flex flex-wrap gap-1">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              type="button"
              className={`rounded-lg px-2 py-1 text-[11px] font-semibold ring-1 transition ${
                selectedDays.has(d)
                  ? "bg-ink-800 text-white ring-ink-800"
                  : "bg-white text-ink-700 ring-ink-800/10 hover:bg-surface-100"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-ink-700">From</label>
          <input
            type="time"
            className="input mt-1"
            value={form.fromTime}
            onChange={(e) => setForm({ ...form, fromTime: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink-700">To</label>
          <input
            type="time"
            className="input mt-1"
            value={form.toTime}
            onChange={(e) => setForm({ ...form, toTime: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-ink-700">
            Price (₹) {priceSuffix}
          </label>
          <input
            type="number"
            min={0}
            className="input mt-1"
            value={form.pricePer4Weeks}
            onChange={(e) => setForm({ ...form, pricePer4Weeks: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink-700">Max students</label>
          <input
            type="number"
            min={1}
            className="input mt-1"
            value={form.maxStudents}
            onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })}
          />
        </div>
      </div>

      {instructors.length > 0 && (
        <div>
          <label className="block text-[11px] font-semibold text-ink-700">Instructor</label>
          <select
            className="input mt-1"
            value={form.instructorId}
            onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
          >
            <option value="">— No specific instructor —</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="flex items-center gap-2 text-xs text-ink-700">
        <input
          type="checkbox"
          checked={form.freeTrialEnabled}
          onChange={(e) => setForm({ ...form, freeTrialEnabled: e.target.checked })}
          className="h-4 w-4"
        />
        Offer free trial
      </label>

      {form.freeTrialEnabled && (
        <div>
          <label className="block text-[11px] font-semibold text-ink-700">Free trial sessions</label>
          <input
            type="number"
            min={1}
            max={5}
            className="input mt-1 w-28"
            value={form.freeTrialSessions}
            onChange={(e) => setForm({ ...form, freeTrialSessions: Number(e.target.value) })}
          />
        </div>
      )}

      {err && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
          {err}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-brand-gradient px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {busy ? "Saving…" : mode === "create" ? "Create batch" : "Save changes"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-ink-700 ring-1 ring-ink-800/10 hover:bg-surface-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
