import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Star, Clock, CalendarRange, BadgeCheck, User, Users } from "lucide-react";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { TypePill, FreeTrialPill, EarlyBirdPill, KycPill } from "@/components/Pills";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR, parseCsv, priceLabel, initials } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { BookClassForm } from "./BookClassForm";

export default async function ClassPage({ params }: { params: { id: string } }) {
  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: {
      provider: { include: { user: true } },
      batches: { include: { instructor: true }, orderBy: { createdAt: "asc" } },
      reviews: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  if (!cls) return notFound();
  const user = await getCurrentUser();
  const images = parseCsv(cls.imagesCsv);
  const primary = images[0] ?? "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1600";
  const hasTrial = cls.batches.some((b) => b.freeTrialEnabled);
  const tags = parseCsv(cls.tagsCsv);
  const lowest = cls.batches.length ? Math.min(...cls.batches.map((b) => b.pricePer4Weeks)) : 0;

  return (
    <>
      <StudentHeader />

      <section className="mx-auto max-w-[1240px] px-6 py-8">
        {/* breadcrumbs */}
        <nav className="mb-4 text-xs text-ink-500">
          <Link href="/" className="hover:text-ink-800">Home</Link>
          <span className="mx-1">/</span>
          <Link href="/browse" className="hover:text-ink-800">Browse</Link>
          <span className="mx-1">/</span>
          <Link href={`/browse?category=${cls.category}`} className="hover:text-ink-800">{cls.category}</Link>
          <span className="mx-1">/</span>
          <span className="text-ink-800">{cls.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* LEFT */}
          <div>
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-ink-800/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={primary} alt={cls.title} className="aspect-[16/9] w-full object-cover" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <TypePill type={cls.type} />
                {hasTrial && <FreeTrialPill />}
                {cls.earlyBird && <EarlyBirdPill />}
              </div>
            </div>

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="aspect-[4/3] w-full rounded-2xl object-cover ring-1 ring-ink-800/5"
                  />
                ))}
              </div>
            )}

            <h1 className="mt-6 font-display text-3xl font-extrabold text-ink-900 md:text-4xl">
              {cls.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-500">
              <div className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-ink-800">
                  {cls.rating ? cls.rating.toFixed(1) : "New"}
                </span>
                {cls.reviewsCount > 0 && <span>· {cls.reviewsCount} reviews</span>}
              </div>
              <span>·</span>
              <span>{cls.category}</span>
              <span>·</span>
              <div className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{cls.provider.area ?? "Delhi"}</span>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="rounded-full bg-surface-100 px-3 py-1 text-xs text-ink-700">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <section className="mt-8">
              <h2 className="font-display text-xl font-bold text-ink-900">About this class</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">
                {cls.description ?? "No description provided."}
              </p>
            </section>

            {/* Batches */}
            <section className="mt-10">
              <h2 className="font-display text-xl font-bold text-ink-900">
                {cls.type === "WORKSHOP" ? "Schedule" : "Available batches"}
              </h2>
              <div className="mt-4 space-y-3">
                {cls.batches.map((b) => {
                  const spotsLeft = Math.max(0, b.maxStudents - b.enrolled);
                  return (
                    <div key={b.id} className="card flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="font-display text-base font-bold text-ink-900">
                          {b.name}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarRange className="h-3.5 w-3.5" /> {b.classDaysCsv?.split(",").join(" · ")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {b.fromTime} – {b.toTime}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {spotsLeft} of {b.maxStudents} spots left
                          </span>
                          {b.instructor && (
                            <span className="inline-flex items-center gap-1">
                              <User className="h-3.5 w-3.5" /> {b.instructor.name}
                            </span>
                          )}
                        </div>
                        {b.freeTrialEnabled && (
                          <div className="mt-2">
                            <FreeTrialPill />
                            <span className="ml-2 text-[11px] text-ink-500">
                              {b.freeTrialSessions} free session{b.freeTrialSessions > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-ink-900">
                          {priceLabel(cls.type, b.pricePer4Weeks)}
                        </div>
                        <div className="text-[11px] text-ink-500">
                          {cls.type === "REGULAR"
                            ? "Billed monthly"
                            : cls.type === "COURSE"
                              ? `Full ${cls.durationWeeks ?? ""}-week course`
                              : "One-time workshop"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Reviews */}
            <section className="mt-10">
              <h2 className="font-display text-xl font-bold text-ink-900">
                Reviews ({cls.reviewsCount})
              </h2>
              {cls.reviews.length === 0 ? (
                <p className="mt-2 text-sm text-ink-500">Be the first to review after your class!</p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {cls.reviews.map((r) => (
                    <div key={r.id} className="card">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                          {initials(r.user.name ?? "U")}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-ink-900">{r.user.name ?? "Learner"}</div>
                          <div className="inline-flex items-center gap-1 text-[11px] text-ink-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-ink-500/30"}`}
                              />
                            ))}
                            <span>· {formatDate(r.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-ink-600">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT — booking panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold text-ink-900">
                    {priceLabel(cls.type, lowest)}
                  </div>
                  <div className="text-xs text-ink-500">
                    {cls.type === "REGULAR"
                      ? "Starting price · per month"
                      : cls.type === "COURSE"
                        ? `Full course · ${cls.durationWeeks ?? ""} weeks`
                        : "One-time workshop"}
                  </div>
                </div>
                {cls.earlyBird && <EarlyBirdPill />}
              </div>

              <BookClassForm
                classId={cls.id}
                batches={cls.batches.map((b) => ({
                  id: b.id,
                  name: b.name,
                  price: b.pricePer4Weeks,
                  free: b.freeTrialEnabled,
                  spots: Math.max(0, b.maxStudents - b.enrolled),
                }))}
                loggedIn={!!user}
                classType={cls.type}
              />
            </div>

            {/* Provider card */}
            <div className="card mt-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-base font-bold text-white">
                  {initials(cls.provider.instituteName)}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="font-display text-base font-bold text-ink-900">
                      {cls.provider.instituteName}
                    </div>
                    {cls.provider.kycStatus === "VERIFIED" && (
                      <BadgeCheck className="h-4 w-4 fill-brand-600 text-white" />
                    )}
                  </div>
                  <div className="text-xs text-ink-500">
                    Provider · {cls.provider.providerCode}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <KycPill status={cls.provider.kycStatus} />
              </div>
              <p className="mt-3 text-sm text-ink-600">
                {cls.provider.bio ?? "A trusted local institute serving your neighbourhood."}
              </p>
              <div className="mt-3 text-xs text-ink-500">
                <MapPin className="mr-1 inline-block h-3 w-3" />
                {cls.provider.address ?? cls.provider.area ?? "Delhi"}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <StudentFooter />
    </>
  );
}
