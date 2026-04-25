import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { ClassCard } from "@/components/ClassCard";
import { AssistantDrawer } from "@/components/AssistantDrawer";
import { FilterSidebar, FilterMobileButton } from "@/components/FilterSidebar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const TYPES = [
  { value: "", label: "All types" },
  { value: "REGULAR", label: "Regular" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "COURSE", label: "Course" },
];

const CATEGORIES = ["Dance", "Music", "Art", "Coding", "Yoga", "Cooking", "Fitness", "Chess"];

type SortKey = "" | "distance" | "price_asc" | "price_desc";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    category?: string;
    type?: string;
    sort?: string;
  };
}) {
  const q = (searchParams?.q ?? "").trim();
  const type = searchParams?.type ?? "";
  const sort = (searchParams?.sort ?? "") as SortKey;

  // Support both ?categories=A,B (new, multi) and the legacy ?category=A.
  const rawCategories = searchParams?.category ?? "";
  const selectedCategories = rawCategories
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const classes = await prisma.class.findMany({
    where: {
      status: "ACTIVE",
      liveStatus: "APPROVED",
      ...(type && { type }),
      ...(selectedCategories.length > 0 && { category: { in: selectedCategories } }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { subcategory: { contains: q, mode: "insensitive" } },
          { tagsCsv: { contains: q, mode: "insensitive" } },
          { provider: { instituteName: { contains: q, mode: "insensitive" } } },
          { provider: { area: { contains: q, mode: "insensitive" } } },
          { provider: { address: { contains: q, mode: "insensitive" } } },
          {
            batches: {
              some: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { classDaysCsv: { contains: q, mode: "insensitive" } },
                  { instructor: { is: { name: { contains: q, mode: "insensitive" } } } },
                ],
              },
            },
          },
        ],
      }),
    },
    include: { provider: true, batches: true },
    orderBy: { createdAt: "desc" },
  });

  const sorted = applySort(classes, sort);

  const countLabel = `${sorted.length} ${sorted.length === 1 ? "class" : "classes"}`;
  const categoryLabel =
    selectedCategories.length === 1
      ? ` in ${selectedCategories[0]}`
      : selectedCategories.length > 1
        ? ` across ${selectedCategories.length} categories`
        : "";

  return (
    <>
      <StudentHeader query={q} category={rawCategories} type={type} />

      <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Browse classes</h1>
            <p className="mt-1 text-sm text-ink-500">
              {countLabel}
              {q ? ` matching "${q}"` : ""}
              {categoryLabel}
            </p>
          </div>
        </div>

        <FilterMobileButton types={TYPES} categories={CATEGORIES} />

        <div className="mt-5 grid gap-6 sm:mt-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <FilterSidebar types={TYPES} categories={CATEGORIES} />

          <div>
            {sorted.length === 0 ? (
              <div className="mt-2 rounded-3xl bg-white p-6 text-center ring-1 ring-ink-800/5 sm:p-10">
                <div className="text-4xl">🔍</div>
                <h3 className="mt-3 font-display text-xl font-bold text-ink-900">
                  No classes match your filters
                </h3>
                <p className="mt-1 text-sm text-ink-500">
                  Try clearing filters or searching something else.
                </p>
                <Link href="/browse" className="btn-ghost mt-5 inline-flex">
                  Clear all filters
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {sorted.map((c) => (
                  <ClassCard key={c.id} cls={c as any} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <StudentFooter />
      <AssistantDrawer />
    </>
  );
}


// Type-safe shape used by sorting helpers (batches + provider area).
type ClassWithRelations = Awaited<ReturnType<typeof prisma.class.findMany>>[number] & {
  batches: { pricePer4Weeks: number }[];
  provider: { area: string | null };
};


// Returns the lowest batch price for a class; Infinity if no batches exist.
function minPrice(c: ClassWithRelations) {
  if (!c.batches?.length) return Number.POSITIVE_INFINITY;
  return Math.min(...c.batches.map((b) => b.pricePer4Weeks ?? Number.POSITIVE_INFINITY));
}

// Applies selected sort without mutating the original list.
function applySort<T extends ClassWithRelations>(rows: T[], sort: SortKey): T[] {
  if (!sort) return rows;
  const copy = [...rows];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => minPrice(a) - minPrice(b));
    case "price_desc":
      return copy.sort((a, b) => minPrice(b) - minPrice(a));
    case "distance":
      // We don't have geolocation yet; approximate "nearest" by grouping providers in the same area together (stable, deterministic).
      return copy.sort((a, b) =>
        (a.provider.area ?? "zzz").localeCompare(b.provider.area ?? "zzz"),
      );
    default:
      return rows;
  }
}
