"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

type SearchFormProps = {
  query?: string;
  category?: string;
  type?: string;
};

export function SearchForm({ query = "", category, type }: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(query);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    setValue(query);
  }, [query]);

  const isBrowse = pathname === "/browse";

  const baseParams = useMemo(() => {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    if (category !== undefined) {
      if (category) p.set("category", category);
      else p.delete("category");
    }
    if (type !== undefined) {
      if (type) p.set("type", type);
      else p.delete("type");
    }
    return p;
  }, [searchParams, category, type]);

  function buildUrl(nextValue: string) {
    const p = new URLSearchParams(baseParams.toString());
    const trimmed = nextValue.trim();
    if (trimmed) p.set("q", trimmed);
    else p.delete("q");
    const qs = p.toString();
    return `/browse${qs ? `?${qs}` : ""}`;
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
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, isBrowse]);

  return (
    <form
      action="/browse"
      method="get"
      className="order-3 relative w-full md:order-none md:ml-6 md:flex-1 md:max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (timerRef.current) clearTimeout(timerRef.current);
        submitNow(value);
      }}
    >
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
      <input
        name="q"
        value={value}
        onChange={(e) => {
          hasInteractedRef.current = true;
          setValue(e.target.value);
        }}
        placeholder="Search classes, workshops, courses..."
        className="input h-11 pl-11"
      />
      {category ? <input type="hidden" name="category" value={category} /> : null}
      {type ? <input type="hidden" name="type" value={type} /> : null}
    </form>
  );
}
