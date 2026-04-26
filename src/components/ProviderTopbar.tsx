import Link from "next/link";
import { Bell, BadgeCheck } from "lucide-react";
import { Logo } from "./Logo";
import { KycPill } from "./Pills";
import { initials } from "@/lib/utils";

export function ProviderTopbar({
  name,
  instituteName,
  kycStatus,
  notifCount,
  providerId,
}: {
  name: string;
  instituteName: string;
  kycStatus: string;
  notifCount: number;
  providerId: string;
}) {
  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-ink-800/5 bg-white/95 px-3 py-2 backdrop-blur sm:px-5 lg:gap-4">
      <div className="shrink-0 lg:hidden">
        <Logo compact />
      </div>
      <span className="hidden rounded-full bg-surface-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-700 sm:inline-flex">
        Provider Portal
      </span>
      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="hidden rounded-xl bg-white px-3 py-2 text-xs font-semibold text-ink-700 ring-1 ring-ink-800/10 hover:bg-surface-100 sm:inline-flex"
        >
          Exit Portal
        </Link>
        <Link
          href={`/p/${providerId}`}
          target="_blank"
          className="hidden rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100 sm:inline-flex"
        >
          View Public Profile ↗
        </Link>
        <Link
          href="/provider/notifications"
          className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-100 text-ink-700 hover:bg-surface-200"
        >
          <Bell className="h-5 w-5" />
          {notifCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
              {notifCount}
            </span>
          )}
        </Link>
        <Link
          href="/provider/account"
          className="inline-flex min-w-0 max-w-[190px] items-center gap-2 rounded-full bg-surface-100 py-1.5 pl-1.5 pr-2 hover:bg-surface-200 sm:max-w-[260px] sm:gap-3 sm:pr-4"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            {initials(instituteName || name)}
          </span>
          <div className="min-w-0 flex flex-col leading-tight">
            <span className="inline-flex min-w-0 items-center gap-1 text-xs font-semibold text-ink-900">
              <span className="truncate">{instituteName}</span>
              {kycStatus === "VERIFIED" && <BadgeCheck className="h-3.5 w-3.5 fill-brand-600 text-white" />}
            </span>
            <span className="truncate text-[10px] text-ink-500">{name}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
