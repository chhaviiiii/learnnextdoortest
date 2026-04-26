"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ImageIcon,
  Link as LinkIcon,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type ClassType = "REGULAR" | "COURSE" | "WORKSHOP";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Batch = {
  name: string;
  classDays: string[];
  startDate: string;
  fromTime: string;
  toTime: string;
  pricePer4Weeks: number;
  maxStudents: number;
  freeTrialEnabled: boolean;
  freeTrialSessions: number;
  instructorId: string;
  imageUrl: string;
};

type EarlyBird = {
  enabled: boolean;
  endDate: string;
  price: number;
  slots: number;
};

type TaxonomyItem = { name: string; subcategories: string[] };

export function CreateClassWizard({
  instructors,
  taxonomy,
}: {
  instructors: { id: string; name: string }[];
  taxonomy: TaxonomyItem[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [type, setType] = useState<ClassType>("REGULAR");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(taxonomy[0]?.name ?? "");
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [registrationEndDate, setRegistrationEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const [earlyBird, setEarlyBird] = useState<EarlyBird>({
    enabled: false,
    endDate: "",
    price: 0,
    slots: 10,
  });
  const [agreed, setAgreed] = useState(false);

  const [batches, setBatches] = useState<Batch[]>([defaultBatch("Morning Beginners")]);
  const categoryOptions = taxonomy.map((item) => item.name);
  const subcategoryOptions = taxonomy.find((item) => item.name === category)?.subcategories ?? [];
  const schedule = batches[0] ?? defaultBatch(type === "WORKSHOP" ? "Workshop session" : "Course cohort");

  const selectedPrice = useMemo(() => {
    const rows = type === "REGULAR" ? batches : [schedule];
    const prices = rows.map((b) => Number(b.pricePer4Weeks || 0)).filter((n) => n > 0);
    return prices.length ? Math.min(...prices) : 0;
  }, [batches, schedule, type]);

  function defaultBatch(name: string): Batch {
    return {
      name,
      classDays: ["Mon", "Wed", "Fri"],
      startDate: "",
      fromTime: "07:00",
      toTime: "08:00",
      pricePer4Weeks: 2500,
      maxStudents: 20,
      freeTrialEnabled: true,
      freeTrialSessions: 1,
      instructorId: instructors[0]?.id ?? "",
      imageUrl: "",
    };
  }

  function changeType(nextType: ClassType) {
    setType(nextType);
    if (nextType === "REGULAR") {
      setBatches((rows) => rows.length > 0 ? rows : [defaultBatch("Morning Beginners")]);
      return;
    }
    setBatches((rows) => [
      {
        ...(rows[0] ?? defaultBatch(nextType === "WORKSHOP" ? "Workshop session" : "Course cohort")),
        name: nextType === "WORKSHOP" ? "Workshop session" : "Course cohort",
        freeTrialEnabled: false,
        freeTrialSessions: 0,
      },
    ]);
  }

  function updBatch(i: number, patch: Partial<Batch>) {
    setBatches(batches.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  function updSchedule(patch: Partial<Batch>) {
    setBatches([{ ...schedule, ...patch }]);
  }

  function toggleSubcategory(value: string) {
    setSubcategories((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      if (current.length >= 5) return current;
      return [...current, value];
    });
  }

  function validateBasics() {
    if (title.trim().length < 3) return "Class title must be at least 3 characters.";
    if (!category) return "Choose a category.";
    if (description.trim().length < 50) return "Description must be at least 50 characters.";
    if (!address.trim()) return "Address is required.";
    if (!landmark.trim()) return "Landmark is required.";
    return null;
  }

  function validateMedia() {
    if (imageUrls.length < 3) return "Add at least 3 listing images.";
    if (imageUrls.length > 5) return "Use no more than 5 listing images.";
    return null;
  }

  function validateSchedule() {
    const rows = type === "REGULAR" ? batches : [schedule];
    if (type === "REGULAR" && (rows.length < 1 || rows.length > 5)) return "Create 1 to 5 batches.";
    if (type !== "REGULAR" && !registrationEndDate) return "Registration end date is required.";
    if (type !== "REGULAR" && !startDate) return type === "WORKSHOP" ? "Workshop date is required." : "Course start date is required.";
    if (type === "COURSE" && !endDate) return "Course end date is required.";
    if (type === "COURSE" && durationWeeks < 1) return "Course duration must be at least 1 week.";
    for (const row of rows) {
      if (row.name.trim().length < 3) return "Batch name must be at least 3 characters.";
      if (type === "REGULAR" && !row.startDate) return "Each batch needs a start date.";
      if (type !== "WORKSHOP" && row.classDays.length === 0) return "Pick at least one class day.";
      if (!row.fromTime || !row.toTime || row.toTime <= row.fromTime) return "End time must be after start time.";
      if (row.pricePer4Weeks < 100) return "Price must be at least INR 100.";
      if (row.maxStudents < 1) return "Max students must be at least 1.";
      if (!row.instructorId) return "Instructor is required.";
      if (row.freeTrialEnabled && (row.freeTrialSessions < 1 || row.freeTrialSessions > 3)) {
        return "Free trial sessions must be between 1 and 3.";
      }
    }
    if (earlyBird.enabled) {
      if (type === "REGULAR") return "Early bird pricing is available for courses and workshops.";
      if (!earlyBird.endDate) return "Early bird end date is required.";
      if (earlyBird.price < 100 || earlyBird.price >= selectedPrice) return "Early bird price must be lower than the standard fee.";
      if (earlyBird.slots < 1 || earlyBird.slots > rows[0].maxStudents) return "Early bird slots must fit within capacity.";
    }
    return null;
  }

  function go(nextStep: 1 | 2 | 3 | 4) {
    const error =
      step === 1 && nextStep > step ? validateBasics() :
      step === 2 && nextStep > step ? validateMedia() :
      step === 3 && nextStep > step ? validateSchedule() :
      null;
    if (error) {
      setErr(error);
      return;
    }
    setErr(null);
    setStep(nextStep);
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((file) => fd.append("files", file));
      const res = await fetch("/api/uploads/class-images", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Image upload failed.");
      setImageUrls((current) => [...current, ...data.urls].slice(0, 5));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  }

  function addImageUrl() {
    const url = imageUrlInput.trim();
    if (!url || imageUrls.length >= 5) return;
    setImageUrls([...imageUrls, url]);
    setImageUrlInput("");
  }

  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= imageUrls.length) return;
    const next = [...imageUrls];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setImageUrls(next);
  }

  function removeImage(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  }

  async function publish() {
    const error = validateBasics() || validateMedia() || validateSchedule() || (!agreed ? "Accept the provider terms before submitting." : null);
    if (error) {
      setErr(error);
      return;
    }

    setErr(null);
    setBusy(true);
    const rows = type === "REGULAR" ? batches : [schedule];
    try {
      const r = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          category,
          subcategory: subcategories.join(","),
          description,
          tagsCsv: tags,
          imagesCsv: imageUrls.join(","),
          address,
          landmark,
          registrationEndDate: type === "REGULAR" ? null : registrationEndDate,
          startDate: type === "REGULAR" ? null : startDate,
          endDate: type === "REGULAR" ? null : endDate,
          durationWeeks: type === "COURSE" ? durationWeeks : null,
          earlyBird: type !== "REGULAR" && earlyBird.enabled,
          earlyBirdEndDate: earlyBird.enabled ? earlyBird.endDate : null,
          earlyBirdPrice: earlyBird.enabled ? earlyBird.price : null,
          earlyBirdSlots: earlyBird.enabled ? earlyBird.slots : null,
          batches: rows.map((b) => ({
            ...b,
            classDaysCsv: type === "WORKSHOP" ? "" : b.classDays.join(","),
            startDate: b.startDate || (type !== "REGULAR" ? startDate : null),
          })),
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
          <h2 className="font-display text-lg font-bold text-ink-900">Class type, category & location</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { v: "REGULAR", label: "Regular", desc: "Ongoing recurring classes" },
                { v: "COURSE", label: "Course", desc: "Fixed-duration cohort" },
                { v: "WORKSHOP", label: "Workshop", desc: "One-time or multi-day event" },
              ] as const
            ).map((t) => (
              <button
                key={t.v}
                type="button"
                onClick={() => changeType(t.v)}
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

          <Field label="Listing name">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Classical Bharatanatyam for Beginners" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select
                className="input"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategories([]);
                }}
              >
                {categoryOptions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Tags">
              <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="beginners, kids, weekend" />
            </Field>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold text-ink-700">Subcategories</div>
            <div className="flex flex-wrap gap-2">
              {subcategoryOptions.map((item) => {
                const on = subcategories.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSubcategory(item)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      on ? "bg-ink-800 text-white ring-ink-800" : "bg-white text-ink-700 ring-ink-800/10 hover:bg-surface-100"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Description">
            <textarea className="input min-h-[140px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn? Who is it for? What level should they be at?" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full address">
              <textarea className="input min-h-[84px]" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Studio / institute address" />
            </Field>
            <Field label="Landmark">
              <textarea className="input min-h-[84px]" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near metro gate 2, above pharmacy" />
            </Field>
          </div>

          <ErrorText msg={err} />
          <Footer>
            <span />
            <button type="button" onClick={() => go(2)} className="btn-accent">
              Continue →
            </button>
          </Footer>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Media</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="flex min-h-[116px] cursor-pointer flex-col items-center justify-center rounded-2xl bg-surface-100 p-4 text-center ring-1 ring-ink-800/5 hover:bg-surface-200">
              <Upload className="h-6 w-6 text-brand-600" />
              <span className="mt-2 text-sm font-semibold text-ink-900">{uploading ? "Uploading..." : "Upload images"}</span>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => uploadImages(e.target.files)}
                disabled={uploading || imageUrls.length >= 5}
              />
            </label>
            <div className="flex gap-2 sm:w-80">
              <input
                className="input"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://image-url"
              />
              <button type="button" onClick={addImageUrl} disabled={imageUrls.length >= 5} className="btn-ghost">
                <LinkIcon className="h-4 w-4" /> Add
              </button>
            </div>
          </div>

          {imageUrls.length === 0 ? (
            <div className="flex aspect-[4/1] items-center justify-center rounded-2xl bg-surface-100 text-sm text-ink-500">
              <ImageIcon className="mr-2 h-5 w-5" /> No images added
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {imageUrls.map((url, i) => (
                <div key={`${url}-${i}`} className="group overflow-hidden rounded-2xl bg-surface-100 ring-1 ring-ink-800/5">
                  <div className="relative aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                        Cover
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-2 py-2">
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="rounded-lg p-1 text-ink-500 hover:bg-white disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === imageUrls.length - 1} className="rounded-lg p-1 text-ink-500 hover:bg-white disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeImage(i)} className="rounded-lg p-1 text-rose-600 hover:bg-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ErrorText msg={err} />
          <Footer>
            <button type="button" onClick={() => go(1)} className="btn-ghost">← Back</button>
            <button type="button" onClick={() => go(3)} className="btn-accent">Continue →</button>
          </Footer>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Schedule & pricing</h2>

          {type === "REGULAR" ? (
            <RegularBatchEditor
              batches={batches}
              instructors={instructors}
              update={updBatch}
              add={() => batches.length < 5 && setBatches([...batches, defaultBatch(`Batch ${batches.length + 1}`)])}
              remove={(index) => setBatches(batches.filter((_, i) => i !== index))}
            />
          ) : (
            <EventScheduleEditor
              type={type}
              registrationEndDate={registrationEndDate}
              setRegistrationEndDate={setRegistrationEndDate}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              durationWeeks={durationWeeks}
              setDurationWeeks={setDurationWeeks}
              schedule={schedule}
              update={updSchedule}
              instructors={instructors}
            />
          )}

          {type !== "REGULAR" && (
            <div className="rounded-2xl bg-surface-100 p-4 ring-1 ring-ink-800/5">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                <input
                  type="checkbox"
                  checked={earlyBird.enabled}
                  onChange={(e) => setEarlyBird({ ...earlyBird, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-ink-800/20"
                />
                <Sparkles className="h-4 w-4 text-amber-500" /> Early bird pricing
              </label>
              {earlyBird.enabled && (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label="End date">
                    <input type="date" className="input" value={earlyBird.endDate} onChange={(e) => setEarlyBird({ ...earlyBird, endDate: e.target.value })} />
                  </Field>
                  <Field label="Price">
                    <input type="number" className="input" value={earlyBird.price || ""} onChange={(e) => setEarlyBird({ ...earlyBird, price: Number(e.target.value) })} />
                  </Field>
                  <Field label="Slots">
                    <input type="number" className="input" value={earlyBird.slots} onChange={(e) => setEarlyBird({ ...earlyBird, slots: Number(e.target.value) })} />
                  </Field>
                </div>
              )}
            </div>
          )}

          {instructors.length === 0 && (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              Add an instructor before publishing. <Link href="/provider/instructors" className="font-semibold underline">Manage instructors</Link>
            </div>
          )}

          <ErrorText msg={err} />
          <Footer>
            <button type="button" onClick={() => go(2)} className="btn-ghost">← Back</button>
            <button type="button" onClick={() => go(4)} className="btn-accent">Continue →</button>
          </Footer>
        </div>
      )}

      {step === 4 && (
        <div className="card space-y-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Review & submit</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryItem label="Type" value={typeLabel(type)} />
            <SummaryItem label="Category" value={[category, subcategories.join(" / ")].filter(Boolean).join(" · ")} />
            <SummaryItem label="Listing" value={title} />
            <SummaryItem label="Images" value={`${imageUrls.length}`} />
            <SummaryItem label={type === "REGULAR" ? "Batches" : "Capacity"} value={type === "REGULAR" ? `${batches.length}` : `${schedule.maxStudents} students`} />
            <SummaryItem label="Early bird" value={earlyBird.enabled ? `INR ${earlyBird.price}` : "No"} />
          </div>

          <label className="flex items-start gap-3 rounded-2xl bg-surface-100 p-4 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-800/20"
            />
            <span>I confirm this listing is accurate and agree to the LearnNextDoor Provider Terms of Service.</span>
          </label>

          <ErrorText msg={err} />
          <Footer>
            <button type="button" onClick={() => go(3)} className="btn-ghost">← Back</button>
            <button type="button" onClick={publish} disabled={busy || !agreed} className="btn-accent disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Submitting..." : <>Submit listing <Check className="h-4 w-4" /></>}
            </button>
          </Footer>
        </div>
      )}
    </div>
  );
}

function RegularBatchEditor({
  batches,
  instructors,
  update,
  add,
  remove,
}: {
  batches: Batch[];
  instructors: { id: string; name: string }[];
  update: (index: number, patch: Partial<Batch>) => void;
  add: () => void;
  remove: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      {batches.map((batch, i) => (
        <div key={i} className="rounded-2xl bg-surface-100 p-4 ring-1 ring-ink-800/5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink-900">Batch {i + 1}</h3>
            {batches.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-rose-600 hover:text-rose-700">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <BatchFields batch={batch} instructors={instructors} onChange={(patch) => update(i, patch)} />
        </div>
      ))}

      <button type="button" onClick={add} disabled={batches.length >= 5} className="btn-ghost w-full disabled:opacity-50">
        <Plus className="h-4 w-4" /> Add batch
      </button>
    </div>
  );
}

function EventScheduleEditor({
  type,
  registrationEndDate,
  setRegistrationEndDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  durationWeeks,
  setDurationWeeks,
  schedule,
  update,
  instructors,
}: {
  type: Exclude<ClassType, "REGULAR">;
  registrationEndDate: string;
  setRegistrationEndDate: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  durationWeeks: number;
  setDurationWeeks: (value: number) => void;
  schedule: Batch;
  update: (patch: Partial<Batch>) => void;
  instructors: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4 rounded-2xl bg-surface-100 p-4 ring-1 ring-ink-800/5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Registration ends">
          <input type="date" className="input" value={registrationEndDate} onChange={(e) => setRegistrationEndDate(e.target.value)} />
        </Field>
        <Field label={type === "WORKSHOP" ? "Workshop date" : "Course starts"}>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        {type === "COURSE" && (
          <>
            <Field label="Course ends">
              <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
            <Field label="Duration (weeks)">
              <input type="number" className="input" value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value))} />
            </Field>
          </>
        )}
      </div>

      <BatchFields
        batch={schedule}
        instructors={instructors}
        onChange={update}
        hideStartDate
        hideFreeTrial
        hideDays={type === "WORKSHOP"}
        priceLabel={type === "COURSE" ? "Course fee" : "Workshop fee"}
      />
    </div>
  );
}

function BatchFields({
  batch,
  instructors,
  onChange,
  hideStartDate,
  hideDays,
  hideFreeTrial,
  priceLabel = "Price / 4 weeks",
}: {
  batch: Batch;
  instructors: { id: string; name: string }[];
  onChange: (patch: Partial<Batch>) => void;
  hideStartDate?: boolean;
  hideDays?: boolean;
  hideFreeTrial?: boolean;
  priceLabel?: string;
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Batch name">
          <input className="input" value={batch.name} onChange={(e) => onChange({ name: e.target.value })} />
        </Field>
        <Field label="Instructor">
          <select className="input" value={batch.instructorId} onChange={(e) => onChange({ instructorId: e.target.value })}>
            <option value="">Select instructor</option>
            {instructors.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {!hideStartDate && (
        <Field label="Start date">
          <input type="date" className="input" value={batch.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
        </Field>
      )}

      {!hideDays && (
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-700">Class days</div>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const on = batch.classDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onChange({ classDays: on ? batch.classDays.filter((d) => d !== day) : [...batch.classDays, day] })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    on ? "bg-ink-800 text-white ring-ink-800" : "bg-white text-ink-700 ring-ink-800/10 hover:bg-surface-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="From">
          <input type="time" className="input" value={batch.fromTime} onChange={(e) => onChange({ fromTime: e.target.value })} />
        </Field>
        <Field label="To">
          <input type="time" className="input" value={batch.toTime} onChange={(e) => onChange({ toTime: e.target.value })} />
        </Field>
        <Field label={priceLabel}>
          <input type="number" className="input" value={batch.pricePer4Weeks} onChange={(e) => onChange({ pricePer4Weeks: Number(e.target.value) })} />
        </Field>
        <Field label="Max students">
          <input type="number" className="input" value={batch.maxStudents} onChange={(e) => onChange({ maxStudents: Number(e.target.value) })} />
        </Field>
      </div>

      <Field label="Batch image URL">
        <input className="input" value={batch.imageUrl} onChange={(e) => onChange({ imageUrl: e.target.value })} placeholder="/uploads/classes/image.jpg" />
      </Field>

      {!hideFreeTrial && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={batch.freeTrialEnabled}
              onChange={(e) => onChange({ freeTrialEnabled: e.target.checked, freeTrialSessions: e.target.checked ? Math.max(batch.freeTrialSessions, 1) : 0 })}
              className="h-4 w-4"
            />
            Free trial
          </label>
          {batch.freeTrialEnabled && (
            <label className="flex items-center gap-2">
              Sessions
              <input type="number" min={1} max={3} className="input w-20 py-1 text-center" value={batch.freeTrialSessions} onChange={(e) => onChange({ freeTrialSessions: Number(e.target.value) })} />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function StepBar({ step }: { step: number }) {
  const labels = ["Basics", "Media", "Schedule", "Submit"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-emerald-500 text-white" : active ? "bg-brand-gradient text-white" : "bg-surface-200 text-ink-500"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={`text-xs ${active ? "font-bold text-ink-900" : "text-ink-500"}`}>{label}</span>
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
      <div className="mt-0.5 text-sm font-semibold text-ink-900">{value || "—"}</div>
    </div>
  );
}

function ErrorText({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{msg}</div>;
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between border-t border-ink-800/5 pt-4">{children}</div>;
}

function typeLabel(type: ClassType) {
  if (type === "REGULAR") return "Regular class";
  if (type === "COURSE") return "Course";
  return "Workshop";
}
