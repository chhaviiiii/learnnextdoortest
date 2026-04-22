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
  { href: "/provider/earnings", label: "Earnings & Payout", icon: Wallet },
  { href: "/provider/holidays", label: "Holiday & Cancellation", icon: CalendarX2 },
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
  );
}
