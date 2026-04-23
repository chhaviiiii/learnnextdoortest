import Link from "next/link";
import { MapPin, Star, Clock, CalendarRange } from "lucide-react";
import { TypePill, FreeTrialPill, EarlyBirdPill } from "./Pills";
import { formatDate, parseCsv, priceLabel } from "@/lib/utils";

type ClassCardProps = {
  cls: {
    id: string;
    title: string;
    type: string;
    category: string;
    imagesCsv: string | null;
    earlyBird: boolean;
    startDate: Date | null;
    durationWeeks: number | null;
    rating: number | null;
    reviewsCount: number;
    provider: { instituteName: string; area: string | null };
    batches: { pricePer4Weeks: number; freeTrialEnabled: boolean; maxStudents: number; enrolled: number }[];
  };
};

export function ClassCard({ cls }: ClassCardProps) {
  const images = parseCsv(cls.imagesCsv);
  const primary = images[0] ?? fallbackImg(cls.category);
  const batch = cls.batches[0];
  const hasTrial = cls.batches.some((b) => b.freeTrialEnabled);
  const price = batch?.pricePer4Weeks ?? 0;

  return (
    <Link
      href={`/class/${cls.id}`}
      className="group block overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-800/5 transition hover:-translate-y-0.5 hover:shadow-float"
    >
      <div className="relative h-40 w-full overflow-hidden sm:h-44">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={primary} alt={cls.title} className="h-full w-full object-cover transition group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <TypePill type={cls.type} />
          {hasTrial && <FreeTrialPill />}
          {cls.earlyBird && <EarlyBirdPill />}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="font-display text-[17px] font-bold leading-snug text-ink-900 line-clamp-2">
          {cls.title}
        </h3>

        <div className="mt-2 flex items-center gap-1 text-xs text-ink-500">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-ink-800">
            {cls.rating ? cls.rating.toFixed(1) : "New"}
          </span>
          {cls.reviewsCount > 0 && <span>· {cls.reviewsCount} reviews</span>}
          <span>·</span>
          <span className="truncate">{cls.category}</span>
        </div>

        <div className="mt-1 text-xs text-ink-500 truncate">
          by {cls.provider.instituteName}
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{cls.provider.area ?? "Delhi"}</span>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-ink-800/5 pt-3">
          <div>
            <div className="text-lg font-bold text-ink-900">
              {priceLabel(cls.type, price)}
            </div>
            {cls.type !== "REGULAR" && cls.durationWeeks && (
              <div className="inline-flex items-center gap-1 text-[11px] text-ink-500">
                <Clock className="h-3 w-3" /> {cls.durationWeeks} weeks
              </div>
            )}
            {cls.type === "WORKSHOP" && cls.startDate && (
              <div className="inline-flex items-center gap-1 text-[11px] text-ink-500">
                <CalendarRange className="h-3 w-3" /> {formatDate(cls.startDate)}
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

function fallbackImg(category: string) {
  const map: Record<string, string> = {
    Dance: "https://images.unsplash.com/photo-1535525153412-5a092d46317e?w=800",
    Music: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
    Art: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
    Coding: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    Yoga: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800",
    Cooking: "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800",
    Fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    Chess: "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=800",
  };
  return map[category] ?? "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800";
}
