"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState({
    name: "",
    phone: "",
    email: "",
    instituteName: "",
    about: "",
    area: "",
    address: "",
    upiId: "",
  });
  // Email and SMS are live channels; WhatsApp stays gated until a sender is configured.
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "email">("email");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function upd<K extends keyof typeof data>(k: K, v: string) {
    setData({ ...data, [k]: v });
  }

  async function sendOtp() {
    setErr(null);
    setBusy(true);
    const identifier = channel === "email" ? data.email : data.phone;
    try {
      const r = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, identifier, role: "PROVIDER", name: data.name }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Couldn't send OTP");
      if (j.devCode) setDevCode(j.devCode);
      setStep(2);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndCreate() {
    setErr(null);
    setBusy(true);
    const identifier = channel === "email" ? data.email : data.phone;
    try {
      // verify
      const v = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          identifier,
          code: otp,
          role: "PROVIDER",
          name: data.name,
        }),
      });
      const vj = await v.json();
      if (!v.ok) throw new Error(vj.error ?? "Invalid OTP");

      // create provider profile
      const r = await fetch("/api/provider/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instituteName: data.instituteName,
          bio: data.about,
          area: data.area,
          address: data.address,
          upiId: data.upiId,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Couldn't create profile");
      }
      router.push("/provider/dashboard?welcome=1");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Stepper step={step} />

      {step === 1 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name">
              <input className="input" value={data.name} onChange={(e) => upd("name", e.target.value)} placeholder="Sunita Kapoor" />
            </Field>
            <Field label="Institute / brand name">
              <input className="input" value={data.instituteName} onChange={(e) => upd("instituteName", e.target.value)} placeholder="Nritya Academy" />
            </Field>
            <Field label="Phone number">
              <input className="input" value={data.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="+91 98xxxxxxxx" />
            </Field>
            <Field label="Email (for verification code)">
              <input className="input" type="email" value={data.email} onChange={(e) => upd("email", e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Area / neighbourhood">
              <input className="input" value={data.area} onChange={(e) => upd("area", e.target.value)} placeholder="Pitampura, Delhi" />
            </Field>
            <Field label="UPI ID (for payouts)">
              <input className="input" value={data.upiId} onChange={(e) => upd("upiId", e.target.value)} placeholder="you@upi" />
            </Field>
            <Field label="Full address" span>
              <textarea className="input min-h-[72px]" value={data.address} onChange={(e) => upd("address", e.target.value)} placeholder="Studio / institute address" />
            </Field>
            <Field label="About your institute" span>
              <textarea className="input min-h-[96px]" value={data.about} onChange={(e) => upd("about", e.target.value)} placeholder="Tell students what makes you special." />
            </Field>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700">OTP channel</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["email", "whatsapp", "sms"] as const).map((c) => {
                const live = c === "email" || c === "sms";
                const active = channel === c;
                return (
                  <button
                    key={c}
                    onClick={() => live && setChannel(c)}
                    disabled={!live}
                    title={!live ? "Coming soon" : undefined}
                    className={`relative rounded-xl px-3 py-2.5 text-xs font-semibold ring-1 transition ${
                      !live
                        ? "bg-white text-ink-400 ring-ink-800/10 cursor-not-allowed"
                        : active
                        ? "bg-ink-800 text-white ring-ink-800"
                        : "bg-white text-ink-700 ring-ink-800/10 hover:bg-surface-100"
                    }`}
                  >
                    {c === "whatsapp" ? "WhatsApp" : c.toUpperCase()}
                    {!live && (
                      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-accent-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {err && <Err msg={err} />}
          <button
            onClick={sendOtp}
            disabled={busy || !data.name || !data.instituteName || (channel === "email" ? !data.email : !data.phone)}
            className="btn-accent w-full"
          >
            {busy ? "Sending..." : "Send verification code"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h3 className="font-display text-lg font-bold text-ink-900">Enter the 6-digit code</h3>
          <p className="text-sm text-ink-500">
            Sent to <span className="font-semibold text-ink-800">{channel === "email" ? data.email : data.phone}</span>
          </p>
          {devCode && (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              Dev mode OTP: <span className="font-mono">{devCode}</span>
            </div>
          )}
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="input text-center font-mono text-xl tracking-[0.35em] sm:text-2xl sm:tracking-[0.5em]"
            placeholder="••••••"
            autoFocus
          />
          {err && <Err msg={err} />}
          <button onClick={verifyAndCreate} disabled={busy || otp.length !== 6} className="btn-accent w-full">
            {busy ? "Creating account..." : "Verify & create account"}
          </button>
          <button onClick={() => setStep(1)} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            ← Edit details
          </button>
        </>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const items = ["Details", "Verify", "KYC"];
  return (
    <div className="flex items-center gap-2 text-xs">
      {items.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const cur = step === n;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                done ? "bg-emerald-500 text-white" : cur ? "bg-brand-gradient text-white" : "bg-surface-200 text-ink-500"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={cur ? "font-semibold text-ink-900" : "text-ink-500"}>{label}</span>
            {i < items.length - 1 && <span className="mx-1 text-ink-500/40">—</span>}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}

function Err({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{msg}</div>
  );
}
