"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function EditClassForm({
  initial,
}: {
  initial: {
    id: string;
    type: string;
    title: string;
    description: string;
    category: string;
    subcategory: string;
    tagsCsv: string;
    imagesCsv: string;
    address: string;
    landmark: string;
    registrationEndDate: string;
    startDate: string;
    endDate: string;
    durationWeeks: number;
    earlyBird: boolean;
    earlyBirdEndDate: string;
    earlyBirdPrice: number;
    earlyBirdSlots: number;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const r = await fetch(`/api/classes/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Failed");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this class? All batches and bookings stay in your history but the class becomes hidden.")) return;
    await fetch(`/api/classes/${initial.id}`, { method: "DELETE" });
    router.push("/provider/classes");
    router.refresh();
  }

  function upd<K extends keyof typeof form>(k: K, v: any) {
    setForm({ ...form, [k]: v });
  }

  return (
    <div className="card space-y-5">
      <h2 className="font-display text-lg font-bold text-ink-900">Edit class details</h2>

      <Field label="Title">
        <input className="input" value={form.title} onChange={(e) => upd("title", e.target.value)} />
      </Field>

      <Field label="Category">
        <input className="input" value={form.category} onChange={(e) => upd("category", e.target.value)} />
      </Field>

      <Field label="Subcategories">
        <input className="input" value={form.subcategory} onChange={(e) => upd("subcategory", e.target.value)} />
      </Field>

      <Field label="Tags">
        <input className="input" value={form.tagsCsv} onChange={(e) => upd("tagsCsv", e.target.value)} />
      </Field>

      <Field label="Description">
        <textarea className="input min-h-[140px]" value={form.description} onChange={(e) => upd("description", e.target.value)} />
      </Field>

      <Field label="Image URLs (comma-separated)">
        <textarea className="input min-h-[80px]" value={form.imagesCsv} onChange={(e) => upd("imagesCsv", e.target.value)} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Address">
          <textarea className="input min-h-[72px]" value={form.address} onChange={(e) => upd("address", e.target.value)} />
        </Field>
        <Field label="Landmark">
          <textarea className="input min-h-[72px]" value={form.landmark} onChange={(e) => upd("landmark", e.target.value)} />
        </Field>
      </div>

      {form.type !== "REGULAR" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Registration end">
            <input type="date" className="input" value={form.registrationEndDate} onChange={(e) => upd("registrationEndDate", e.target.value)} />
          </Field>
          <Field label={form.type === "WORKSHOP" ? "Workshop date" : "Start date"}>
            <input type="date" className="input" value={form.startDate} onChange={(e) => upd("startDate", e.target.value)} />
          </Field>
          <Field label="End date">
            <input type="date" className="input" value={form.endDate} onChange={(e) => upd("endDate", e.target.value)} />
          </Field>
          {form.type === "COURSE" && (
            <Field label="Duration weeks">
              <input type="number" className="input" value={form.durationWeeks} onChange={(e) => upd("durationWeeks", Number(e.target.value))} />
            </Field>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={form.earlyBird}
          onChange={(e) => upd("earlyBird", e.target.checked)}
          className="h-4 w-4"
        />
        Early bird pricing
      </label>

      {form.earlyBird && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Early bird end">
            <input type="date" className="input" value={form.earlyBirdEndDate} onChange={(e) => upd("earlyBirdEndDate", e.target.value)} />
          </Field>
          <Field label="Early bird price">
            <input type="number" className="input" value={form.earlyBirdPrice} onChange={(e) => upd("earlyBirdPrice", Number(e.target.value))} />
          </Field>
          <Field label="Early bird slots">
            <input type="number" className="input" value={form.earlyBirdSlots} onChange={(e) => upd("earlyBirdSlots", Number(e.target.value))} />
          </Field>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-800/5 pt-4">
        <button onClick={remove} className="text-sm font-semibold text-rose-600 hover:text-rose-700">
          <Trash2 className="mr-1 inline h-4 w-4" /> Archive class
        </button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs font-semibold text-emerald-600">✓ Saved</span>}
          <button onClick={save} disabled={busy} className="btn-accent">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}
