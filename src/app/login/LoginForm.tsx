"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageSquare, Mail, Phone, ArrowRight } from "lucide-react";

type Channel = "whatsapp" | "sms" | "email";

export function LoginForm({ redirect, role }: { redirect: string; role: "STUDENT" | "PROVIDER" }) {
  const [step, setStep] = useState<"identify" | "otp">("identify");
  // Email is the only live channel for now — WhatsApp/SMS are labelled "soon" in the UI.
  const [channel, setChannel] = useState<Channel>("email");
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const router = useRouter();

  async function sendOtp() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, identifier: identifier.trim(), role, name: name.trim() || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Couldn't send OTP");
      if (j.devCode) setDevCode(j.devCode);
      setStep("otp");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, identifier: identifier.trim(), code: otp.trim(), role, name: name.trim() || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Invalid OTP");
      router.push(redirect || (role === "PROVIDER" ? "/provider/dashboard" : "/"));
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "identify") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">
            {role === "PROVIDER" ? "Provider sign in" : "Log in to LearnNextDoor"}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            We'll send you a 6-digit code. No passwords needed.
          </p>
        </div>

        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-ink-800/10 bg-white px-3 py-3 text-sm font-semibold text-ink-400"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink-800/10 text-sm font-bold text-brand-700">
            G
          </span>
          Continue with Google
        </button>

        <div className="grid grid-cols-3 gap-2">
          <ChannelButton label="Email" active={channel === "email"} onClick={() => setChannel("email")} icon={<Mail className="h-4 w-4" />} />
          <ChannelButton label="WhatsApp" soon active={false} onClick={() => {}} icon={<MessageSquare className="h-4 w-4" />} />
          <ChannelButton label="SMS" soon active={false} onClick={() => {}} icon={<Phone className="h-4 w-4" />} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-700">
            {channel === "email" ? "Email address" : "Phone number"}
          </label>
          <input
            type={channel === "email" ? "email" : "tel"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={channel === "email" ? "you@example.com" : "+91 98xxxxxxxx"}
            className="input mt-1"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-700">
            Your name <span className="text-ink-500 font-normal">(only for new accounts)</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aryan Shenoy"
            className="input mt-1"
          />
        </div>

        {err && (
          <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {err}
          </div>
        )}

        <button onClick={sendOtp} disabled={busy || !identifier} className="btn-accent w-full">
          {busy ? "Sending..." : <>Send code <ArrowRight className="h-4 w-4" /></>}
        </button>

        <p className="text-center text-[11px] text-ink-500">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Enter your code</h2>
        <p className="mt-1 text-sm text-ink-500">
          We sent a 6-digit code to <span className="font-semibold text-ink-800">{identifier}</span> via {channel.toUpperCase()}.
        </p>
      </div>

      {devCode && (
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Dev mode: your OTP is <span className="font-mono">{devCode}</span>
        </div>
      )}

      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="••••••"
        className="input text-center text-2xl tracking-[0.5em] font-mono"
        inputMode="numeric"
        autoFocus
      />

      {err && (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {err}
        </div>
      )}

      <button onClick={verify} disabled={busy || otp.length !== 6} className="btn-accent w-full">
        {busy ? "Verifying..." : "Verify & continue"}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button onClick={() => setStep("identify")} className="font-semibold text-brand-600 hover:text-brand-700">
          ← Change number
        </button>
        <button onClick={sendOtp} className="font-semibold text-brand-600 hover:text-brand-700">
          Resend code
        </button>
      </div>
    </div>
  );
}

function ChannelButton({ label, active, onClick, icon, soon }: any) {
  return (
    <button
      onClick={onClick}
      disabled={!!soon}
      title={soon ? "Coming soon — use Email for now" : undefined}
      className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ring-1 transition ${
        soon
          ? "bg-white text-ink-400 ring-ink-800/10 cursor-not-allowed"
          : active
          ? "bg-ink-800 text-white ring-ink-800"
          : "bg-white text-ink-700 ring-ink-800/10 hover:bg-surface-100"
      }`}
    >
      {icon} {label}
      {soon && (
        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-accent-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          Soon
        </span>
      )}
    </button>
  );
}
