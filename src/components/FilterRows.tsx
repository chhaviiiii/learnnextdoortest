import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function CollapsibleSection({
  icon,
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink-800/5 first-of-type:border-t-0">
      {/* The header row doubles as the open/close button. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 py-3 text-left"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-700">
          {icon}
          {title}
          {badge && (
            <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        /* Each section with own capped height with an internal scrollbar. */
        <div className="max-h-44 overflow-y-auto pr-1 pb-4">{children}</div>
      )}
    </section>
  );
}

// Each single select option
export function RadioRow({
  name,
  checked,
  onChange,
  label,
  leading,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  leading?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition",
        checked ? "bg-brand-50 text-ink-900" : "text-ink-700 hover:bg-surface-100",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-brand-600"
      />
      {leading}
      <span className="flex-1 truncate font-medium">{label}</span>
    </label>
  );
}

// Each multi select option
export function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition",
        checked ? "bg-brand-50 text-ink-900" : "text-ink-700 hover:bg-surface-100",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded accent-brand-600"
      />
      <span className="flex-1 truncate font-medium">{label}</span>
    </label>
  );
}
