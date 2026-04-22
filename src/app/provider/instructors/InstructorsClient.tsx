"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { KycPill } from "@/components/Pills";
import { initials } from "@/lib/utils";

type Instructor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  kycStatus: string;
};

export function InstructorsClient({ instructors }: { instructors: Instructor[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", specialty: "" });
  const [busy, setBusy] = useState(false);

  async function addInstructor() {
    setBusy(true);
    try {
      const r = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error("Failed");
      setForm({ name: "", email: "", phone: "", specialty: "" });
      setShowAdd(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this instructor?")) return;
    await fetch(`/api/instructors/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Manage instructors</h1>
          <p className="mt-1 text-sm text-ink-500">
            {instructors.length} instructor{instructors.length === 1 ? "" : "s"} · Assign them to batches from each class.
          </p>
        </div>
        <button onClick={() => setShowAdd((s) => !s)} className="btn-accent">
          <Plus className="h-4 w-4" /> Add instructor
        </button>
      </header>

      {showAdd && (
        <div className="card space-y-4">
          <h3 className="font-display text-base font-bold text-ink-900">Add an instructor</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Specialty / subject">
              <input className="input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={addInstructor} disabled={busy || !form.name} className="btn-accent">
              {busy ? "Adding…" : "Add instructor"}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {instructors.length === 0 ? (
        <div className="card text-center">
          <div className="text-4xl">🧑‍🏫</div>
          <h3 className="mt-3 font-display text-xl font-bold text-ink-900">No instructors yet</h3>
          <p className="mt-1 text-sm text-ink-500">Add your first instructor so you can assign them to batches.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {instructors.map((i) => (
            <div key={i.id} className="card">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-base font-bold text-white">
                  {initials(i.name)}
                </span>
                <div>
                  <div className="font-display text-sm font-bold text-ink-900">{i.name}</div>
                  <div className="text-xs text-ink-500">{i.specialty || "—"}</div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-ink-500">
                {i.phone && <div>📞 {i.phone}</div>}
                {i.email && <div>✉️ {i.email}</div>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <KycPill status={i.kycStatus} />
                <button onClick={() => remove(i.id)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                  <Trash2 className="mr-1 inline h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
