import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { ClassCard } from "@/components/ClassCard";
import { AssistantDrawer } from "@/components/AssistantDrawer";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "", label: "All types" },
  { value: "REGULAR", label: "Regular" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "COURSE", label: "Course" },
];

const CATEGORIES = ["Dance", "Music", "Art", "Coding", "Yoga", "Cooking", "Fitness", "Chess"];

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string; type?: string };
}) {
  const q = (searchParams?.q ?? "").trim();
  const category = searchParams?.category ?? "";
  const type = searchParams?.type ?? "";

  const classes = await prisma.class.findMany({
    where: {
      status: "ACTIVE",
      liveStatus: "APPROVED",
      ...(type && { type }),
      ...(category && { category }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { tagsCsv: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: { provider: true, batches: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <StudentHeader query={q} />

      <section className="mx-auto max-w-[1240px] px-6 py-8">
        <h1 className="font-display text-3xl font-bold text-ink-900">Browse classes</h1>
        <p className="mt-1 text-sm text-ink-500">
          {classes.length} {classes.length === 1 ? "class" : "classes"}
          {q ? ` matching "${q}"` : ""}
          {category ? ` in ${category}` : ""}
        </p>

        {/* filters */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <FilterChip
                key={t.value}
                href={buildHref({ q, category, type: t.value })}
                active={type === t.value}
                label={t.label}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              href={buildHref({ q, type, category: "" })}
              active={!category}
              label="All categories"
            />
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c}
                href={buildHref({ q, type, category: c })}
                active={category === c}
                label={c}
              />
            ))}
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-10 text-center ring-1 ring-ink-800/5">
            <div className="text-4xl">🔍</div>
            <h3 className="mt-3 font-display text-xl font-bold text-ink-900">
              No classes match your filters
            </h3>
            <p className="mt-1 text-sm text-ink-500">Try clearing filters or searching something else.</p>
            <Link href="/browse" className="btn-ghost mt-5 inline-flex">Clear all filters</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((c) => (
              <ClassCard key={c.id} cls={c as any} />
            ))}
          </div>
        )}
      </section>

      <StudentFooter />
      <AssistantDrawer />
    </>
  );
}

function buildHref(p: { q?: string; category?: string; type?: string }) {
  const s = new URLSearchParams();
  if (p.q) s.set("q", p.q);
  if (p.category) s.set("category", p.category);
  if (p.type) s.set("type", p.type);
  const str = s.toString();
  return `/browse${str ? "?" + str : ""}`;
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition",
        active
          ? "bg-ink-800 text-white ring-ink-800"
          : "bg-white text-ink-700 ring-ink-800/10 hover:bg-surface-100",
      )}
    >
      {label}
    </Link>
  );
}
