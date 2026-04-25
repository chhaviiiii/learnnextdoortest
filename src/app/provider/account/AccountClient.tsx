"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { BadgeCheck, Upload, Monitor, Smartphone, LogOut } from "lucide-react";
import { KycPill } from "@/components/Pills";

type Props = {
  user: { name: string; email: string; phone: string };
  provider: {
    id: string;
    providerCode: string;
    instituteName: string;
    bio: string;
    area: string;
    address: string;
    upiId: string;
    upiVerified: boolean;
    kycStatus: string;
    kycDocType: string;
    kycVerifiedAt: string | null;
    kycRejectionReason: string | null;
  };
  sessions: { id: string; device: string; location: string | null; current: boolean; lastActive: string }[];
};

export function AccountClient({ user, provider, sessions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kycRef = useRef<HTMLElement>(null);
  const [p, setP] = useState(provider);
  const [u, setU] = useState({ name: user.name, email: user.email, phone: user.phone });
  const [busy, setBusy] = useState(false);
  const [kycBusy, setKycBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const kycRequired = searchParams.get("kyc") === "required";

  useEffect(() => {
    setMounted(true);
    // If redirected from classes page due to unverified KYC, scroll to and highlight the KYC section
    if (searchParams.get("kyc") === "required" && kycRef.current) {
      kycRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  async function saveProfile() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: u.name,
          email: u.email,
          phone: u.phone,
          instituteName: p.instituteName,
          bio: p.bio,
          area: p.area,
          address: p.address,
          upiId: p.upiId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save profile.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function uploadKyc(e: React.ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setKycBusy(docType);
    try {
      const fd = new FormData();
      fd.append("docType", docType);
      fd.append("file", file);

      await fetch("/api/provider/kyc", {
        method: "POST",
        body: fd,
      });
      router.refresh();
    } finally {
      setKycBusy(null);
    }
  }

  async function logoutEverywhere() {
    if (!confirm("Sign out of all devices?")) return;
    await fetch("/api/auth/logout-all", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">My account</h1>
          <p className="mt-1 text-sm text-ink-500">
            Provider code {provider.providerCode} · {user.phone || user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <KycPill status={provider.kycStatus} />
          {provider.upiVerified && (
            <span className="pill bg-emerald-50 text-emerald-700">
              <BadgeCheck className="h-3 w-3" /> UPI Verified
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-ink-900">Profile</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Your name">
              <input className="input" value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} />
            </Field>
            <Field label="Institute name">
              <input className="input" value={p.instituteName} onChange={(e) => setP({ ...p, instituteName: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input" value={u.email} onChange={(e) => setU({ ...u, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" value={u.phone} onChange={(e) => setU({ ...u, phone: e.target.value })} placeholder="10-digit mobile number" maxLength={10} />
            </Field>
            <Field label="Area">
              <input className="input" value={p.area} onChange={(e) => setP({ ...p, area: e.target.value })} />
            </Field>
            <Field label="Address" span>
              <textarea className="input min-h-[72px]" value={p.address} onChange={(e) => setP({ ...p, address: e.target.value })} />
            </Field>
            <Field label="About" span>
              <textarea className="input min-h-[96px]" value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} />
            </Field>
            <Field label="UPI ID (payouts)">
              <input className="input" value={p.upiId} onChange={(e) => setP({ ...p, upiId: e.target.value })} />
            </Field>
          </div>
          {error && <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 border border-rose-200">{error}</div>}
          <div className="mt-4 flex items-center gap-3 border-t border-ink-800/5 pt-4">
            {saved && <span className="text-xs font-semibold text-emerald-600">✓ Saved</span>}
            <button onClick={saveProfile} disabled={busy} className="btn-accent ml-auto">
              {busy ? "Saving…" : "Save profile"}
            </button>
          </div>
        </section>

        <section
          ref={kycRef}
          className={`card transition-all ${kycRequired ? "ring-2 ring-amber-400 ring-offset-2" : ""}`}
        >
          <h2 className="font-display text-lg font-bold text-ink-900">KYC verification</h2>
          {kycRequired && (
            <p className="mt-1 text-sm font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              ⚠️ You need to complete KYC verification before you can create classes.
            </p>
          )}
          <p className="mt-1 text-sm text-ink-500">
            We need one valid ID to activate bookings and payouts.
          </p>
          <div className="mt-4">
            <KycPill status={provider.kycStatus} />
          </div>
          {provider.kycStatus === "VERIFIED" ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Verified {provider.kycVerifiedAt ? `on ${provider.kycVerifiedAt}` : ""}.
              Document: {provider.kycDocType || "ID on file"}.
            </div>
          ) : provider.kycStatus === "PENDING" ? (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
              Your document is currently under review by our team. You will be notified once it is approved.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {provider.kycStatus === "REJECTED" && provider.kycRejectionReason ? (
                <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 border border-rose-200">
                  <strong className="block font-semibold">Verification Rejected</strong>
                  <span className="mt-1 block">{provider.kycRejectionReason}</span>
                </div>
              ) : null}
              {["Aadhaar", "PAN", "Passport", "Voter ID"].map((d) => (
                <label
                  key={d}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl bg-surface-100 px-3 py-3 text-sm font-semibold text-ink-800 hover:bg-surface-200 ${kycBusy && kycBusy !== d ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" /> {kycBusy === d ? "Uploading..." : `Upload ${d}`}
                  </span>
                  <span className="text-xs text-ink-500">Required</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => uploadKyc(e, d)} 
                    disabled={!!kycBusy}
                  />
                </label>
              ))}
              <p className="text-[11px] text-ink-500">
                Supports JPG, PNG, or PDF up to 5MB.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">Active sessions</h2>
          <button onClick={logoutEverywhere} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
            <LogOut className="mr-1 inline h-3 w-3" /> Sign out everywhere
          </button>
        </div>
        <div className="mt-4 divide-y divide-ink-800/5">
          {sessions.map((s) => {
            const mobile = /iPhone|Android/.test(s.device);
            const Icon = mobile ? Smartphone : Monitor;
            return (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-ink-500" />
                  <div>
                    <div className="text-sm font-semibold text-ink-900">
                      {s.device} {s.current && <span className="ml-1 text-[11px] text-emerald-600">(this device)</span>}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      {s.location ?? "—"} · active {mounted ? new Date(s.lastActive).toLocaleString() : ""}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
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
