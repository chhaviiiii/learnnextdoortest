import Link from "next/link";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2">
      <div className="relative h-9 w-9 rounded-xl bg-logo-gradient shadow-float">
        <div className="absolute inset-1 rounded-lg bg-white/20" />
        <div className="absolute inset-[10px] rounded-md bg-white/90 flex items-center justify-center">
          <span className="text-[11px] font-black text-brand-700">Ln</span>
        </div>
      </div>
      {!compact && (
        <div className="flex flex-col leading-tight">
          <span className="logo-text font-display text-[17px] font-extrabold tracking-tight">
            LearnNextDoor
          </span>
          <span className="text-[10px] font-medium text-ink-500">
            Learn from your neighbourhood
          </span>
        </div>
      )}
    </Link>
  );
}
