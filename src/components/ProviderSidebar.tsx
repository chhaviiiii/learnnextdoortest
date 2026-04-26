"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusSquare,
  Users,
  BookOpen,
  Wallet,
  CalendarX2,
  UserCircle2,
  LifeBuoy,
  Bell,
  LogOut,
} from "lucide-react";
import { Logo } from "./Logo";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/provider/classes/create", label: "Create a Class", icon: PlusSquare },
  { href: "/provider/instructors", label: "Manage Instructors", icon: Users },
  { href: "/provider/classes", label: "My Listed Classes", icon: BookOpen },
  { href: "/provider/account", label: "My Account", icon: UserCircle2 },
  { href: "/provider/support", label: "Provider Support", icon: LifeBuoy },
  { href: "/provider/notifications", label: "Notifications", icon: Bell, countKey: "notif" as const },
] as const;

export function ProviderSidebar({ notifCount }: { notifCount: number }) {
  const pathname = usePathname() ?? "";

  function isActive(href: string) {
    if (href === "/provider/classes")
      return pathname === href || (pathname.startsWith("/provider/classes") && !pathname.startsWith("/provider/classes/create"));
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-ink-800/5 bg-white lg:flex lg:flex-col">
        <div className="px-5 py-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-gradient text-white shadow-float"
                    : "text-ink-700 hover:bg-surface-100"
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </span>
                {(n as any).countKey === "notif" && notifCount > 0 && (
                  <span
                    className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-accent-500 text-white"
                    }`}
                  >
                    {notifCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <LogoutButton>
            <span className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-100">
              <LogOut className="h-4 w-4" /> Logout
            </span>
          </LogoutButton>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-800/10 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-12px_30px_-22px_rgba(48,28,128,0.45)] backdrop-blur lg:hidden">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {NAV.map((n) => {
            const active = isActive(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex min-w-[76px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-surface-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="max-w-[68px] truncate">{n.label.replace("Manage ", "").replace("My Listed ", "")}</span>
                {(n as any).countKey === "notif" && notifCount > 0 && (
                  <span className="absolute right-2 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-white">
                    {notifCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
