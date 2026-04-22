"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, ImageIcon, Plus, Trash2 } from "lucide-react";

const CATEGORIES = ["Dance", "Music", "Art", "Coding", "Yoga", "Cooking", "Fitness", "Chess"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Batch = {
  name: string;
  classDays: string[];
  fromTime: string;
  toTime: string;
  pricePer4Weeks: number;
  maxStudents: number;
  freeTrialEnabled: boolean;
  freeTrialSessions: number;
  instructorId: string;
};

export function CreateClassWizard({ instructors }: { instructors: { id: string; name: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [type, setType] = useState<"REGULAR" | "COURSE" | "WORKSHOP">("REGULAR");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Dance");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string>("");
  const [earlyBird, setEarlyBird] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [durationWeeks, setDurationWeeks] = useState<number>(4);

  const [batches, setBatches] = useState<Batch[]>([defaultBatch()]);

  function defaultBatch(): Batch {
    return {
      name: "Morning Beginners",
      classDays: ["Mon", "Wed", "Fri"],
      fromTime: "07:00",
      toTime: "08:00",
      pricePer4Weeks: 2500,
      maxStudents: 20,
      freeTrialEnabled: true,
      freeTrialSessions: 1,
      instructorId: instructors[0]?.id ?? "",
    };
  }

  function updBatch(i: number, patch: Partial<Batch>) {
    setBatches(batches.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  async function publish() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          category,
          description,
          tagsCsv: tags,
          imagesCsv: images,
          earlyBird,
          startDate: startDate || null,
          durationWeeks: type !== "WORKSHOP" ? durationWeeks : null,
          batches: batches.map((b) => ({ ...b, classDaysCsv: b.classDays.join(",") })),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Couldn't create class");
      router.push("/provider/classes");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <StepBar step={step} />

      {step === 1 && (
        <div className="card space-y-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Class type & basics</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { v: "REGULAR", label: "Regular", desc: "Recurring classes, billed monthly" },
                { v: "COURSE", label: "Course", desc: "Fixed duration, single price" },
                { v: "WORKSHOP", label: "Workshop", desc: "One-time event on a date" },
              ] as const
            ).map((t) => (
              <button
                key={t.v}
                onClick={() => setType(t.v as any)}
                className={`rounded-2xl p-4 text-left ring-1 transition ${
                  type === t.v
                    ? "bg-brand-gradient text-white ring-brand-600 shadow-float"
                    : "bg-white text-ink-800 ring-ink-800/10 hover:bg-surface-100"
                }`}
              >
                <div className="font-display text-base font-bold">{t.label}</div>
                <div className={`text-xs ${type === t.v ? "text-white/80" : "text-ink-500"}`}>{t.desc}</div>
              </button>
            ))}
          </div>

          <Field label="Class title">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Classical Bharatanatyam" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Tags (comma-separated)">
              <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="beginners, kids, weekend" />
            </Field>
          </div>

          <Field label="Description">
            <textarea className="input min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn? Who is it for?" />
          </Field>

          <Footer>
            <button onClick={() => setStep(2)} disabled={!title || !category} className="btn-accent">
              Continue →
            </button>
          </Footer>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Visuals</h2>
          <Field label="Image URLs (comma-separated)">
            <textarea
              className="input min-h-[100px]"
              value={images}
              onChange={(e) => setImages(e.target.value)}
              placeholder="https://…image1.jpg, https://…image2.jpg"
            />
            <p className="mt-2 text-xs text-ink-500">
              Paste 1-4 Unsplash or hosted image URLs. You can swap them later.
            </p>
          </Field>
          <div className="grid gap-3 sm:grid-cols-4">
            {(images.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)).map(
              (url, i) => (
                <div key={i} className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface-100 ring-1 ring-ink-800/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </div>
              ),
            )}
            {images.split(",").filter(Boolean).length === 0 && (
              <div className="col-span-4 flex aspect-[4/1] items-center justify-center rounded-2xl bg-surface-100 text-sm text-ink-500">
                <ImageIcon className="mr-2 h-5 w-5" /> Paste image URLs above to preview
              </div>
            )}
          </div>

          <Footer>
            <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
            <button onClick={() => setStep(3)} className="btn-accent">Continue →</button>
          </Footer>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Schedule & batches</h2>

          {type !== "WORKSHOP" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Duration (weeks)">
                <input
                  type="number"
                  className="input"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                />
              </Field>
              <Field label="Start date (optional)">
                <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
            </div>
          )}

          {type === "WORKSHOP" && (
            <Field label="Workshop date">
              <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
          )}

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={earlyBird}
              onChange={(e) => setEarlyBird(e.target.checked)}
              className="h-4 w-4 rounded border-ink-800/20"
            />
            <Sparkles className="h-4 w-4 text-amber-500" /> Early bird pricing for first 10 signups
          </label>

          <div className="space-y-4">
            {batches.map((b, i) => (
              <div key={i} className="rounded-2xl bg-surface-100 p-4 ring-1 ring-ink-800/5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-ink-900">Batch {i + 1}</h3>
                  {batches.length > 1 && (
                    <button
                      onClick={() => setBatches(batches.filter((_, x) => x !== i))}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Batch name">
                    <input className="input" value={b.name} onChange={(e) => updBatch(i, { name: e.target.value })} />
                  </Field>
                  <Field label="Instructor">
                    <select
                      className="input"
                      value={b.instructorId}
                      onChange={(e) => updBatch(i, { instructorId: e.target.value })}
                    >
                      <option value="">— Unassigned —</option>
                      {instructors.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-3">
                  <div className="mb-1 text-xs font-semibold text-ink-700">Class days</div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => {
                      const on = b.classDays.includes(d);
                      return (
                        <button
                          key={d}
                          onClick={() =>
                            updBatch(i, {
                              classDays: on ? b.classDays.filter((x) => x !== d) : [...b.classDays, d],
                            })
                          }
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            on
                              ? "bg-ink-800 text-white ring-ink-800"
                              : "bg-white text-ink-700 ring-ink-800/10"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <Field label="From">
                    <input type="time" className="input" value={b.fromTime} onChange={(e) => updBatch(i, { fromTime: e.target.value })} />
                  </Field>
                  <Field label="To">
                    <input type="time" className="input" value={b.toTime} onChange={(e) => updBatch(i, { toTime: e.target.value })} />
                  </Field>
                  <Field label={type === "REGULAR" ? "Price / 4 weeks" : "Price (flat)"}>
                    <input
                      type="number"
                      className="input"
                      value={b.pricePer4Weeks}
                      onChange={(e) => updBatch(i, { pricePer4Weeks: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Max students">
                    <input
                      type="number"
                      className="input"
                      value={b.maxStudents}
                      onChange={(e) => updBatch(i, { maxStudents: Number(e.target.value) })}
                    />
                  </Field>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={b.freeTrialEnabled}
                      onChange={(e) => updBatch(i, { freeTrialEnabled: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Offer free trial
                  </label>
                  {b.freeTrialEnabled && (
                    <label className="flex items-center gap-2">
                      Sessions:
                      <input
                        type="number"
                        className="input w-20 py-1 text-center"
                        value={b.freeTrialSessions}
                        onChange={(e) => updBatch(i, { freeTrialSessions: Number(e.target.value) })}
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => setBatches([...batches, defaultBatch()])}
              className="btn-ghost w-full"
            >
              <Plus className="h-4 w-4" /> Add another batch
            </button>
          </div>

          <Footer>
            <button onClick={() => setStep(2)} className="btn-ghost">← Back</button>
            <button onClick={() => setStep(4)} className="btn-accent">Continue →</button>
          </Footer>
        </div>
      )}

      {step === 4 && (
        <div className="card space-y-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Review & publish</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryItem label="Type" value={type} />
            <SummaryItem label="Category" value={category} />
            <SummaryItem label="Title" value={title} />
            <SummaryItem label="Batches" value={`${batches.length}`} />
            <SummaryItem label="Early bird" value={earlyBird ? "Yes" : "No"} />
            <SummaryItem label="Duration" value={type === "WORKSHOP" ? startDate || "—" : `${durationWeeks} weeks`} />
          </div>
          {err && <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{err}</div>}
          <Footer>
            <button onClick={() => setStep(3)} className="btn-ghost">← Back</button>
            <button onClick={publish} disabled={busy} className="btn-accent">
              {busy ? "Publishing…" : <>Publish class <Check className="h-4 w-4" /></>}
            </button>
          </Footer>
        </div>
      )}
    </div>
  );
}

function StepBar({ step }: { step: number }) {
  const labels = ["Basics", "Visuals", "Schedule", "Publish"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-emerald-500 text-white" : active ? "bg-brand-gradient text-white" : "bg-surface-200 text-ink-500"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={`text-xs ${active ? "font-bold text-ink-900" : "text-ink-500"}`}>{l}</span>
            {i < labels.length - 1 && <div className="h-px flex-1 bg-ink-800/10" />}
          </div>
        );
      })}
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-100 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink-900">{value}</div>
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between border-t border-ink-800/5 pt-4">{children}</div>;
}
