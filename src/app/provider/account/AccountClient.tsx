"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  };
  sessions: { id: string; device: string; location: string | null; current: boolean; lastActive: string }[];
};

export function AccountClient({ user, provider, sessions }: Props) {
  const router = useRouter();
  const [p, setP] = useState(provider);
  const [u, setU] = useState(user);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveProfile() {
    setBusy(true);
    try {
      await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: u.name,
          email: u.email,
          instituteName: p.instituteName,
          bio: p.bio,
          area: p.area,
          address: p.address,
          upiId: p.upiId,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function mockKycUpload(doc: string) {
    await fetch("/api/provider/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docType: doc }),
    });
    router.refresh();
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
          <div className="mt-4 flex items-center gap-3 border-t border-ink-800/5 pt-4">
            {saved && <span className="text-xs font-semibold text-emerald-600">✓ Saved</span>}
            <button onClick={saveProfile} disabled={busy} className="btn-accent ml-auto">
              {busy ? "Saving…" : "Save profile"}
            </button>
          </div>
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-bold text-ink-900">KYC verification</h2>
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
          ) : (
            <div className="mt-4 space-y-2">
              {["Aadhaar", "PAN", "Passport", "Voter ID"].map((d) => (
                <button
                  key={d}
                  onClick={() => mockKycUpload(d)}
                  className="flex w-full items-center justify-between rounded-xl bg-surface-100 px-3 py-3 text-sm font-semibold text-ink-800 hover:bg-surface-200"
                >
                  <span className="inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Upload {d}
                  </span>
                  <span className="text-xs text-ink-500">Required</span>
                </button>
              ))}
              <p className="text-[11px] text-ink-500">
                Dev note: clicking these marks KYC as pending/verified in the mock flow.
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
                      {s.location ?? "—"} · active {new Date(s.lastActive).toLocaleString()}
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
