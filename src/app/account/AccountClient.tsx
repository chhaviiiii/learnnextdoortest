"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Monitor, Smartphone, LogOut, Ticket, Star, Calendar } from "lucide-react";
import { initials } from "@/lib/utils";

type Props = {
  user: { name: string | null; email: string | null; phone: string | null; createdAtIso: string };
  stats: { totalBookings: number; totalReviews: number };
  sessions: { id: string; device: string; location: string | null; current: boolean; lastActive: string }[];
};

export function AccountClient({ user, stats, sessions }: Props) {
  const router = useRouter();
  const [u, setU] = useState({ name: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "" });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function saveProfile() {
    setBusy(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: u.name, email: u.email, phone: u.phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Surface API errors (e.g. duplicate phone, invalid format)
        alert(data.error ?? "Failed to save.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function logoutEverywhere() {
    if (!confirm("Sign out of all devices?")) return;
    await fetch("/api/auth/logout-all", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const memberSince = new Date(user.createdAtIso).getFullYear();

  return (
    <div className="space-y-8">
      
      {/* 1. HERO SECTION: Profile Identity & Stats */}
      <section className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm ring-1 ring-ink-800/5">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-brand-gradient text-3xl font-extrabold text-white shadow-md">
            {initials(user.name || "Student")}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-display text-3xl font-extrabold text-ink-900">
              {user.name || "My Account"}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-ink-500">
              {user.phone || user.email}
            </p>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 pt-8 border-t border-ink-800/5">
          <StatBlock 
            icon={<Ticket className="h-5 w-5 text-blue-500 fill-blue-100" />} 
            val={stats.totalBookings.toString()} 
            label="Bookings" 
            subtext="Classes joined"
          />
          <StatBlock 
            icon={<Star className="h-5 w-5 text-amber-500 fill-amber-100" />} 
            val={stats.totalReviews.toString()} 
            label="Reviews" 
            subtext="Feedback submitted"
          />
          <StatBlock 
            icon={<Calendar className="h-5 w-5 text-purple-500 fill-purple-100" />} 
            val={memberSince.toString()} 
            label="Joined" 
            subtext="Platform member"
          />
        </div>
      </section>

      {/* 2. MAIN CONFIGURATION GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* EDIT PROFILE */}
        <section className="card lg:col-span-2 shadow-sm ring-1 ring-ink-800/5 p-6 sm:p-8 rounded-3xl bg-white">
          <h2 className="font-display text-xl font-bold text-ink-900">Personal Information</h2>
          <p className="text-sm text-ink-500 mt-1 mb-6">Manage your core identity and contact settings.</p>
          
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name">
              <input className="input" value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input" value={u.email} onChange={(e) => setU({ ...u, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" value={u.phone} onChange={(e) => setU({ ...u, phone: e.target.value })} placeholder="10-digit mobile number" maxLength={10} />
            </Field>
          </div>
          <div className="mt-8 flex items-center gap-3 border-t border-ink-800/5 pt-6">
            {saved && <span className="text-sm font-semibold text-emerald-600">✓ Changes saved successfully</span>}
            <button onClick={saveProfile} disabled={busy} className="btn-accent ml-auto">
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </section>

        {/* ACTIVE SESSIONS */}
        <section className="card shadow-sm ring-1 ring-ink-800/5 p-6 sm:p-8 rounded-3xl bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">Security</h2>
              <p className="text-xs text-ink-500 mt-1">Active logins</p>
            </div>
            <button onClick={logoutEverywhere} className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
              <LogOut className="mr-1 inline h-3.5 w-3.5" /> Force sign out
            </button>
          </div>
          <div className="divide-y divide-ink-800/5">
            {sessions.map((s) => {
              const mobile = /iPhone|Android/.test(s.device);
              const Icon = mobile ? Smartphone : Monitor;
              return (
                <div key={s.id} className="flex items-center justify-between py-4 group">
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 shrink-0 bg-surface-50 rounded-full flex items-center justify-center ring-1 ring-ink-800/5">
                      <Icon className="h-4 w-4 text-ink-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink-900 flex items-center gap-2">
                        {s.device} 
                        {s.current && <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">This device</span>}
                      </div>
                      <div className="text-xs text-ink-500 font-medium mt-0.5">
                        {s.location ?? "Unknown City"} · Active {mounted ? new Date(s.lastActive).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Subcomponents
// -----------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold tracking-wide uppercase text-ink-500">{label}</span>
      {children}
    </label>
  );
}

function StatBlock({ icon, val, label, subtext }: { icon: React.ReactNode, val: string, label: string, subtext: string }) {
  return (
    <div className="flex flex-col p-4 rounded-2xl bg-surface-50/50 hover:bg-surface-100 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{label}</span>
      </div>
      <div className="font-display text-2xl font-extrabold text-ink-900">{val}</div>
      <div className="text-[11px] font-medium text-ink-400 mt-1">{subtext}</div>
    </div>
  );
}
