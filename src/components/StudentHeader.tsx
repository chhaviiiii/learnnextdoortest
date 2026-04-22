import Link from "next/link";
import { Search, ShoppingBag, Home, Grid3X3, User, Store } from "lucide-react";
import { Logo } from "./Logo";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/utils";

export async function StudentHeader({ query }: { query?: string } = {}) {
  const user = await getCurrentUser();
  const bookingCount = user
    ? await prisma.booking.count({
        where: { userId: user.id, status: { in: ["CONFIRMED", "PENDING"] } },
      })
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-6">
        <Logo />

        <form action="/browse" method="get" className="relative ml-6 flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search classes, workshops, courses..."
            className="input pl-11"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-surface-100"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-surface-100"
          >
            <Grid3X3 className="h-4 w-4" /> Browse
          </Link>
          <Link
            href="/provider/login"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            <Store className="h-4 w-4" /> For Providers
          </Link>
        </nav>

        <Link
          href="/my-bookings"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-ink-700 hover:bg-surface-200"
          aria-label="My bookings"
        >
          <ShoppingBag className="h-5 w-5" />
          {bookingCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
              {bookingCount}
            </span>
          )}
        </Link>

        {user ? (
          <Link
            href="/account"
            className="inline-flex items-center gap-2 rounded-full bg-surface-100 py-1.5 pl-1.5 pr-3 hover:bg-surface-200"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
              {initials(user.name ?? "You")}
            </span>
            <span className="text-sm font-semibold text-ink-800">
              {(user.name ?? "You").split(" ")[0]}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            <User className="h-4 w-4" /> Login
          </Link>
        )}
      </div>
    </header>
  );
}
