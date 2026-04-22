"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  BookOpenCheck,
  Calendar,
  Flag,
  Home,
  LayoutList,
  LifeBuoy,
  LogOut,
  ScrollText,
  Settings,
  ShieldCheck,
  Users2,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminCtx = {
  id: string;
  name: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN";
};

const NAV: { group: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; superOnly?: boolean }[] }[] = [
  {
    group: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: Home }],
  },
  {
    group: "Operations",
    items: [
      { href: "/admin/kyc", label: "KYC Approvals", icon: BadgeCheck },
      { href: "/admin/listings/live", label: "Listing Approvals", icon: BookOpenCheck },
      { href: "/admin/listings", label: "Listing Management", icon: LayoutList },
      { href: "/admin/users", label: "User Management", icon: Users2 },
      { href: "/admin/payments", label: "Payments", icon: Wallet },
      { href: "/admin/concerns", label: "Provider Concerns", icon: LifeBuoy },
    ],
  },
  {
    group: "Insights",
    items: [
      { href: "/admin/tracking", label: "Daily Live Tracking", icon: Calendar },
      { href: "/admin/stats", label: "Stats", icon: Flag },
    ],
  },
  {
    group: "Governance",
    items: [
      { href: "/admin/audit", label: "Audit Log", icon: ScrollText, superOnly: true },
      { href: "/admin/settings", label: "Settings", icon: Settings, superOnly: true },
    ],
  },
];

export function AdminShell({ admin, children }: { admin: AdminCtx; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Poll periodically — if session silently expires, bounce to login
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/auth/ping", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/admin/login");
        }
      } catch {
        /* ignore network flaps */
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [router]);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-surface-50">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-ink-800/5 bg-white">
        <div className="px-5 py-5 border-b border-ink-800/5">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand-600 text-white font-display font-bold grid place-items-center">
              LND
            </div>
            <div>
              <div className="font-display font-bold text-ink-900 text-sm leading-none">LearnNextDoor</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wider font-semibold text-brand-600">
                Admin Portal
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500/80">
                {group.group}
              </div>
              <ul className="space-y-0.5">
                {group.items
                  .filter((it) => !it.superOnly || admin.role === "SUPER_ADMIN")
                  .map((it) => {
                    const Icon = it.icon;
                    const active = isActive(it.href);
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition",
                            active
                              ? "bg-brand-50 text-brand-700 font-semibold"
                              : "text-ink-700 hover:bg-surface-100",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{it.label}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-ink-800/5">
          <div className="flex items-center gap-3 rounded-xl bg-surface-100 p-3">
            <div className="h-9 w-9 rounded-full bg-ink-800 text-white grid place-items-center text-xs font-semibold">
              {admin.name
                .split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink-900 truncate">{admin.name}</div>
              <div className="flex items-center gap-1 text-[11px] text-ink-500">
                {admin.role === "SUPER_ADMIN" ? (
                  <>
                    <ShieldCheck className="h-3 w-3" /> Super Admin
                  </>
                ) : (
                  "Admin"
                )}
              </div>
            </div>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-white hover:text-ink-900 disabled:opacity-60"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  );
}
