"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Search, ShieldAlert, Users2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  suspended: boolean;
  suspendedAtIso: string | null;
  suspensionReason: string | null;
  bookingsCount: number;
  createdAtIso: string;
};

export function UsersClient({
  q: initialQ,
  totalActive,
  totalSuspended,
  users,
}: {
  q: string;
  totalActive: number;
  totalSuspended: number;
  users: UserRow[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [target, setTarget] = useState<
    | { id: string; name: string; action: "SUSPEND" | "REINSTATE"; blacklist?: boolean }
    | null
  >(null);
  const [reason, setReason] = useState("");
  const [blacklist, setBlacklist] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function submit() {
    if (!target) return;
    if (target.action === "SUSPEND" && reason.trim().length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: target.action,
          reason: target.action === "SUSPEND" ? reason.trim() : undefined,
          blacklist: target.action === "SUSPEND" ? blacklist : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setFlash(
        target.action === "SUSPEND" ? `Suspended ${target.name}.` : `Reinstated ${target.name}.`,
      );
      setTarget(null);
      setReason("");
      router.refresh();
      setTimeout(() => setFlash(null), 3500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">User Management</h1>
        <p className="mt-1 text-sm text-ink-500">
          {totalActive} active · {totalSuspended} suspended. Search is the only way to surface users — privacy-first.
        </p>
      </header>

      {flash ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
          {flash}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams();
          if (q) next.set("q", q);
          router.push(`/admin/users${next.toString() ? `?${next.toString()}` : ""}`);
        }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email, phone, or name…"
          className="input pl-10"
        />
      </form>

      {!initialQ ? (
        <div className="card text-center py-10">
          <Users2 className="mx-auto h-10 w-10 text-ink-500/40" />
          <div className="mt-3 font-display text-lg font-bold text-ink-900">Start with a search</div>
          <p className="mt-1 text-sm text-ink-500">
            Enter an email or phone number above to find a specific user.
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-10 text-sm text-ink-500">
          No users match <span className="font-semibold text-ink-900">{initialQ}</span>.
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-800/5 text-sm">
              <thead className="bg-surface-100 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink-900">{u.name}</div>
                      <div className="text-xs text-ink-500">{u.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      {u.email ? <div className="text-ink-900 text-xs">{u.email}</div> : null}
                      {u.phone ? <div className="text-ink-700 text-xs">{u.phone}</div> : null}
                      {!u.email && !u.phone ? <div className="text-xs text-ink-500">—</div> : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-surface-100 text-ink-700">{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{u.bookingsCount}</td>
                    <td className="px-4 py-3">
                      {u.suspended ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                          <ShieldAlert className="h-3 w-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role === "ADMIN" ? (
                        <span className="text-xs text-ink-500 italic">Manage via Settings</span>
                      ) : u.suspended ? (
                        <button
                          onClick={() => setTarget({ id: u.id, name: u.name, action: "REINSTATE" })}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Reinstate
                        </button>
                      ) : (
                        <button
                          onClick={() => setTarget({ id: u.id, name: u.name, action: "SUSPEND" })}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          <ShieldAlert className="h-3 w-3" /> Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {target ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
          onClick={() => {
            setTarget(null);
            setReason("");
            setError(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-float"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800/5">
              <h3 className="font-display text-lg font-bold text-ink-900">
                {target.action === "SUSPEND" ? "Suspend user" : "Reinstate user"}
              </h3>
              <button
                onClick={() => {
                  setTarget(null);
                  setReason("");
                  setError(null);
                }}
                className="p-1.5 rounded-lg text-ink-500 hover:bg-surface-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-ink-700">
                <span className="font-semibold">{target.name}</span>
              </p>
              {target.action === "SUSPEND" ? (
                <>
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Suspending immediately blocks sign-in and invalidates active sessions.</span>
                  </div>
                  <label className="text-sm font-medium text-ink-900">
                    Reason (min 10 chars, internal note)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="input resize-none"
                    placeholder="e.g. repeat fraudulent bookings, harassment reports..."
                  />
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      checked={blacklist}
                      onChange={(e) => setBlacklist(e.target.checked)}
                      className="rounded border-ink-300"
                    />
                    Blacklist email + phone (prevents recreating accounts)
                  </label>
                </>
              ) : (
                <p className="text-sm text-ink-500">
                  Reinstating restores sign-in access. The user's email and phone will also be removed from the
                  blacklist, if present.
                </p>
              )}
              {error ? (
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-ink-800/5">
              <button
                className="btn-ghost"
                disabled={busy}
                onClick={() => {
                  setTarget(null);
                  setReason("");
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={submit}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60",
                  target.action === "SUSPEND" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm {target.action.toLowerCase()}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
