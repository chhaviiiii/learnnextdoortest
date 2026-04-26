"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

const DEBOUNCE_MS = 350;

export function HomeHeroSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteractedRef = useRef(false);

  const isBrowse = pathname === "/browse";

  function buildUrl(nextValue: string) {
    const trimmed = nextValue.trim();
    if (trimmed) return `/browse?q=${encodeURIComponent(trimmed)}`;
    return "/browse";
  }

  function submitNow(nextValue: string) {
    const target = buildUrl(nextValue);
    if (isBrowse) {
      router.replace(target, { scroll: false });
      return;
    }
    router.push(target);
  }

  useEffect(() => {
    if (!hasInteractedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      submitNow(value);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, isBrowse]);

  return (
    <form
      action="/browse"
      method="get"
      className="relative mx-auto mt-8 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (timerRef.current) clearTimeout(timerRef.current);
        submitNow(value);
      }}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500" />
      <input
        name="q"
        value={value}
        onChange={(e) => {
          hasInteractedRef.current = true;
          setValue(e.target.value);
        }}
        placeholder="Try 'guitar', 'pottery', 'chess for kids'..."
        className="w-full rounded-2xl bg-white py-4 pl-12 pr-14 text-sm text-ink-900 shadow-float ring-1 ring-ink-800/5 focus:outline-none focus:ring-2 focus:ring-brand-400 sm:pr-32"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-accent-gradient text-sm font-semibold text-white shadow hover:brightness-105 sm:w-auto sm:px-5"
      >
        <Search className="h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
