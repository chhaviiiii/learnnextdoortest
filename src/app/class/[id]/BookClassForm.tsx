"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function BookClassForm({
  classId,
  batches,
  loggedIn,
  classType,
  classTitle,
  providerName,
  providerPhone,
}: {
  classId: string;
  batches: { id: string; name: string; price: number; free: boolean; spots: number }[];
  loggedIn: boolean;
  classType: string;
  classTitle: string;
  providerName: string;
  providerPhone?: string | null;
}) {
  const [batchId, setBatchId] = useState<string>(batches[0]?.id ?? "");
  const [mode, setMode] = useState<"TRIAL" | "ENROLL">(
    batches[0]?.free ? "TRIAL" : "ENROLL",
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const batch = batches.find((b) => b.id === batchId);
  const whatsappUrl = buildWhatsAppUrl(providerPhone, classTitle, providerName, batch?.name);

  // async function book() {
  //   if (!batch) return;
  //   setBusy(true);
  //   setErr(null);
  //   try {
  //     const r = await fetch("/api/bookings", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ classId, batchId, mode }),
  //     });
  //     if (!r.ok) {
  //       const j = await r.json().catch(() => ({}));
  //       throw new Error(j.error ?? "Booking failed");
  //     }
  //     router.push("/my-bookings?just=1");
  //     router.refresh();
  //   } catch (e: any) {
  //     setErr(e.message);
  //   } finally {
  //     setBusy(false);
  //   }
  // }

  if (!loggedIn) {
    return (
      <div className="mt-4 space-y-2">
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-accent w-full">
            I'm interested
          </a>
        ) : (
          <Link href="/login?redirect=/class/" className="btn-accent w-full">
            I'm interested
          </Link>
        )}
        <p className="text-center text-xs text-ink-500">
          No login needed. Message the provider directly and we will help you choose the right batch.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <label className="block text-xs font-semibold text-ink-700">Choose batch</label>
      <select
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
        className="input"
      >
        {batches.map((b) => (
          <option key={b.id} value={b.id} disabled={b.spots === 0}>
            {b.name} — ₹{b.price.toLocaleString("en-IN")} {b.spots === 0 ? " (Sold out)" : ""}
          </option>
        ))}
      </select>

      {batch?.free && (
        <div className="flex overflow-hidden rounded-xl bg-surface-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setMode("TRIAL")}
            className={`flex-1 rounded-lg py-2 ${mode === "TRIAL" ? "bg-white text-ink-900 shadow" : "text-ink-500"}`}
          >
            Book free trial
          </button>
          <button
            onClick={() => setMode("ENROLL")}
            className={`flex-1 rounded-lg py-2 ${mode === "ENROLL" ? "bg-white text-ink-900 shadow" : "text-ink-500"}`}
          >
            Enroll now
          </button>
        </div>
      )}

      {err && (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {err}
        </div>
      )}

      {/* <button
        onClick={book}
        disabled={busy || !batch || batch.spots === 0}
        className="btn-accent w-full"
      >
        {busy
          ? "Booking..."
          : mode === "TRIAL"
            ? "Book free trial"
            : classType === "REGULAR"
              ? `Enroll for ₹${batch?.price.toLocaleString("en-IN")} / month`
              : `Book · ₹${batch?.price.toLocaleString("en-IN")}`}
      </button>
      <p className="text-center text-[11px] text-ink-500">
        You won't be charged now — payment is collected after your first session.
      </p> */}
      {whatsappUrl ? (
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-accent w-full">
          I'm interested
        </a>
      ) : (
        <Link href="/login?redirect=/class/" className="btn-accent w-full">
          I'm interested
        </Link>
      )}
    </div>
  );
}

function buildWhatsAppUrl(
  phone?: string | null,
  classTitle?: string,
  providerName?: string,
  batchName?: string,
) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  const messageParts = [
    `Hi, I am interested in ${classTitle ?? "this class"} on LearnNextDoor.`,
    providerName ? `I saw your listing from ${providerName}.` : null,
    batchName ? `Please share details for the ${batchName} batch.` : null,
    "Please share timings, fees, location and trial details.",
  ].filter(Boolean);

  return `https://wa.me/${digits}?text=${encodeURIComponent(messageParts.join(" "))}`;
}
