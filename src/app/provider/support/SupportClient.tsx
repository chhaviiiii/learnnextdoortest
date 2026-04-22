"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LifeBuoy, Plus, MessageCircle, Mail } from "lucide-react";
import { StatusPill } from "@/components/Pills";

const CATEGORIES = ["Payouts", "Bookings", "KYC", "Classes", "Technical", "Other"];

type Ticket = {
  id: string;
  code: string;
  subject: string;
  category: string;
  status: string;
  message: string;
  reply: string;
  createdAt: string;
};

export function SupportClient({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "Payouts", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ subject: "", category: "Payouts", message: "" });
      setShow(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Provider support</h1>
          <p className="mt-1 text-sm text-ink-500">
            We reply to every ticket within 24 hours.
          </p>
        </div>
        <button onClick={() => setShow((s) => !s)} className="btn-accent">
          <Plus className="h-4 w-4" /> New ticket
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <ContactCard icon={MessageCircle} title="WhatsApp" text="+91 90000 00000" />
        <ContactCard icon={Mail} title="Email" text="support@learnnextdoor.in" />
        <ContactCard icon={LifeBuoy} title="Help centre" text="Open KB →" />
      </div>

      {show && (
        <div className="card space-y-4">
          <h3 className="font-display text-base font-bold text-ink-900">Raise a ticket</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subject">
              <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Payout didn't arrive" />
            </Field>
            <Field label="Category">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Message">
            <textarea className="input min-h-[120px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe the issue…" />
          </Field>
          <div className="flex items-center gap-2">
            <button onClick={submit} disabled={busy || !form.subject || !form.message} className="btn-accent">
              {busy ? "Submitting…" : "Submit ticket"}
            </button>
            <button onClick={() => setShow(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-display text-lg font-bold text-ink-900">Your tickets</h2>
        {tickets.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No tickets raised yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {tickets.map((t) => (
              <details key={t.id} className="rounded-2xl bg-surface-100 px-4 py-3 ring-1 ring-ink-800/5">
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-600">{t.code}</span>
                      <StatusPill status={t.status} />
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-700">{t.category}</span>
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-ink-900">{t.subject}</div>
                  </div>
                  <span className="text-[11px] text-ink-500">{t.createdAt}</span>
                </summary>
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Your message</div>
                    <p className="mt-1 text-ink-700">{t.message}</p>
                  </div>
                  {t.reply && (
                    <div className="rounded-xl bg-brand-50 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">LearnNextDoor reply</div>
                      <p className="mt-1 text-ink-800">{t.reply}</p>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactCard({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="card">
      <Icon className="h-5 w-5 text-brand-600" />
      <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-500">{title}</div>
      <div className="text-sm font-semibold text-ink-900">{text}</div>
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
