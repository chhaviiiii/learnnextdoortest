"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Layers, SlidersHorizontal, Tag, X } from "lucide-react";
import {
  activeCount,
  readStateFromParams,
  writeStateToParams,
  type FilterState,
} from "@/lib/helper";
import { CheckRow, CollapsibleSection, RadioRow } from "./FilterRows";

/* ─── Config types ─── */

export type FilterConfig = {
  types: { value: string; label: string }[];
  categories: string[];
  sorts?: { value: string; label: string }[];
};

type SectionKey = "type" | "category" | "sort";

/** Single source of truth for "nothing selected" — used by every Clear/Reset action. */
const EMPTY_STATE: FilterState = { type: "", sort: "", category: new Set() };

const DEFAULT_SORTS: NonNullable<FilterConfig["sorts"]> = [
  { value: "", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];


//  hook that bundles the state and push for every time filter changes
function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const state = useMemo(
    () => readStateFromParams(new URLSearchParams(params.toString())),
    [params],
  );

  const push = useCallback(
    (next: FilterState) => {
      const sp = writeStateToParams(new URLSearchParams(params.toString()), next);
      const qs = sp.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return { state, push };
}

//  Desktop sidebar — every click writes to the URL
export function FilterSidebar(props: FilterConfig) {
  const { state, push } = useUrlFilters();

  return (
    <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
      <FilterPanel
        {...props}
        state={state}
        onChange={push}
        onClear={() => push(EMPTY_STATE)}
      />
    </aside>
  );
}

// Mobile button + popup — edits live in a pending copy until Apply 
export function FilterMobileButton(props: FilterConfig) {
  const { state: urlState, push } = useUrlFilters();

  const [open, setOpen] = useState(false);

  const [pending, setPending] = useState<FilterState>(urlState);      // Local copy the user edits inside the popup — only merged into the URL on Apply.

  // set filters on closing pop-up from url path directly, if filters haven't changed
  useEffect(() => {
    if (open) setPending(urlState);
  }, [open, urlState]);

  // Stop the page behind the popup from scrolling while it's open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const apply = () => {
    push(pending);
    setOpen(false);
  };
  const clearAll = () => push(EMPTY_STATE);
  const resetPending = () => setPending(EMPTY_STATE);

  const count = activeCount(urlState);
  const pendingCount = activeCount(pending);

  return (
    <>
      {/* Trigger row — hidden on desktop, shows a Clear chip when filters exist */}
      <div className="flex mt-4 items-center gap-2 lg:hidden mr-auto">

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-800 ring-1 ring-ink-800/10 shadow-card hover:bg-surface-100"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          
          {count > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
              {count}
            </span>
          )}

        </button>

        {count > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink-700 ring-1 ring-ink-800/10 shadow-card hover:bg-surface-100"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop: tap to close, discards pending changes */}
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Popup — centered, padding from all edges, capped height */}
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-float">
            <header className="flex items-center justify-between border-b border-ink-800/5 px-5 py-4">
              
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-ink-700" />
                <h2 className="font-display text-base font-bold text-ink-900">Filters</h2>
              </div>
              
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-ink-500 hover:bg-surface-100 hover:text-ink-800"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Middle scrolls if every section is open at once */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <FilterPanel
                {...props}
                bare
                state={pending}
                onChange={setPending}
                onClear={resetPending}
              />
            </div>

            <footer className="flex items-center gap-3 border-t border-ink-800/5 px-5 py-4">
              <button
                type="button"
                onClick={resetPending}
                className="flex-1 rounded-2xl bg-surface-100 px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-surface-200"
              >
                Reset
              </button>
              
              <button
                type="button"
                onClick={apply}
                className="flex-[1.5] rounded-2xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white hover:bg-ink-800"
              >
                Apply{pendingCount > 0 ? ` (${pendingCount})` : ""}
              </button>
            
            </footer>
          </div>
        </div>
      )}
    </>
  );
}


type FilterPanelProps = FilterConfig & {
  state: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  /** When true, skip the outer white card (the mobile popup already is one). */
  bare?: boolean;
};
// Common filter components for large and small screen
function FilterPanel({
  types,
  categories,
  sorts = DEFAULT_SORTS,
  state,
  onChange,
  onClear,
  bare,
}: FilterPanelProps) {
  // Only "Type" starts open by default
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    type: true,
    category: false,
    sort: false,
  });
  const toggle = (k: SectionKey) =>
    setOpenSections((s) => ({ ...s, [k]: !s[k] }));

  const setType = (v: string) => onChange({ ...state, type: v });
  const setSort = (v: string) => onChange({ ...state, sort: v });
  
  const toggleCategory = (cat: string) => {
    const next = new Set(state.category);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    onChange({ ...state, category: next });
  };

  const hasAny = activeCount(state) > 0;

  const body = (
    <>
      {!bare && (
        <header className="mb-4 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-ink-700" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-900"> Filters </h2>
          </div>
          
          {hasAny && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-500 hover:bg-surface-100 hover:text-ink-800"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}

        </header>
      )}

      {/* Type — single-select */}
      <CollapsibleSection
        icon={<Layers className="h-3.5 w-3.5" />}
        title="Type"
        open={openSections.type}
        onToggle={() => toggle("type")}
      >
        <div className="space-y-1.5">
          {types.map((t) => (
            <RadioRow
              key={t.value || "__all_types"}
              name="type"
              checked={state.type === t.value}
              onChange={() => setType(t.value)}
              label={t.label}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Categories — multi-select */}
      <CollapsibleSection
        icon={<Tag className="h-3.5 w-3.5" />}
        title="Categories"
        badge={state.category.size > 0 ? String(state.category.size) : undefined}
        open={openSections.category}
        onToggle={() => toggle("category")}
      >
        <div className="space-y-1.5">
          {categories.map((c) => (
            <CheckRow
              key={c}
              checked={state.category.has(c)}
              onChange={() => toggleCategory(c)}
              label={c}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Sort — single-select */}
      <CollapsibleSection
        icon={<ArrowDownUp className="h-3.5 w-3.5" />}
        title="Sort by"
        open={openSections.sort}
        onToggle={() => toggle("sort")}
      >
        <div className="space-y-1.5">
          {sorts.map((s) => (
            <RadioRow
              key={s.value || "__default_sort"}
              name="sort"
              checked={state.sort === s.value}
              onChange={() => setSort(s.value)}
              label={s.label}
            />
          ))}
        </div>
      </CollapsibleSection>
    </>
  );


  // Main filter rendering logic for large screen
  return bare ? (
    <div>{body}</div>
  ) : (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-ink-800/5 shadow-card">
      {body}
    </div>
  );
}
