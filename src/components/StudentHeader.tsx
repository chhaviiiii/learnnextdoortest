import Link from "next/link";
import { Home, Grid3X3, User, Store } from "lucide-react";
import { Logo } from "./Logo";
import { SearchForm } from "./SearchForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/utils";
import { StudentMenuDrawer } from "./AssistantDrawer";

export async function StudentHeader({
  query,
  category,
  type,
}: {
  query?: string;
  category?: string;
  type?: string;
} = {}) {
  const user = await getCurrentUser();
  // const bookingCount = user
  //   ? await prisma.booking.count({
  //       where: { userId: user.id, status: { in: ["CONFIRMED", "PENDING"] } },
  //     })
  //   : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex justify-between max-w-[1240px] flex-wrap items-center gap-3 px-4 py-3 md:h-16 md:flex-nowrap md:gap-4 md:px-6 md:py-0">
        <Logo />

        <SearchForm query={query} category={category} type={type} />

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

        {/* <Link
          href="/my-bookings"
          className="relative ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-ink-700 hover:bg-surface-200 md:ml-0"
          aria-label="My bookings"
        >
          <ShoppingBag className="h-5 w-5" />
          {bookingCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
              {bookingCount}
            </span>
          )}
        </Link> */}

        {user ? (
          // <Link
          //   href="/account"
          //   className="inline-flex items-center gap-2 rounded-full bg-surface-100 py-1.5 pl-1.5 pr-3 hover:bg-surface-200"
          // >
          //   <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
          //     {initials(user.name ?? "You")}
          //   </span>
            // <span className="hidden text-sm font-semibold text-ink-800 sm:inline">
            //   {(user.name ?? "You").split(" ")[0]}
            // </span>
          // </Link>
          <StudentMenuDrawer userName={user.name ?? "You"} />
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}
