import Link from "next/link";
import { ShieldCheck, Sparkles, MapPin, Star, ArrowRight } from "lucide-react";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { ClassCard } from "@/components/ClassCard";
import { AssistantDrawer } from "@/components/AssistantDrawer";
import { HomeHeroSearch } from "@/components/HomeHeroSearch";
import { prisma } from "@/lib/prisma";

const CATEGORIES = [
  { name: "Dance", emoji: "💃", hue: "from-pink-100 to-pink-50" },
  { name: "Music", emoji: "🎸", hue: "from-violet-100 to-violet-50" },
  { name: "Art", emoji: "🎨", hue: "from-amber-100 to-amber-50" },
  { name: "Coding", emoji: "💻", hue: "from-sky-100 to-sky-50" },
  { name: "Yoga", emoji: "🧘", hue: "from-emerald-100 to-emerald-50" },
  { name: "Cooking", emoji: "🍳", hue: "from-orange-100 to-orange-50" },
  { name: "Fitness", emoji: "💪", hue: "from-rose-100 to-rose-50" },
  { name: "Chess", emoji: "♟️", hue: "from-slate-100 to-slate-50" },
];

export default async function HomePage() {
  const classes = await prisma.class.findMany({
    where: { status: "ACTIVE", liveStatus: "APPROVED" },
    include: {
      provider: true,
      batches: true,
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <>
      <StudentHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-surface-100 to-accent-50/40" />
        <div className="mx-auto max-w-[1240px] px-6 pb-16 pt-14 md:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200">
              <Sparkles className="h-3 w-3" /> Hyperlocal · Verified · Trusted
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-ink-900 md:text-6xl">
              Learn anything, from the{" "}
              <span className="logo-text">experts around your block</span>.
            </h1>
            <p className="mt-5 text-base text-ink-500 md:text-lg">
              Discover trusted dance, music, coding, art and fitness classes happening
              right around your neighbourhood. Book a free trial, meet the teacher, and
              start learning — without the long commute.
            </p>

            <HomeHeroSearch />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-500">
              <span>Popular:</span>
              {["Bharatanatyam", "Guitar", "Yoga", "Web development", "Pottery"].map(
                (k) => (
                  <Link
                    key={k}
                    href={`/browse?q=${encodeURIComponent(k)}`}
                    className="rounded-full bg-white px-3 py-1 ring-1 ring-ink-800/5 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {k}
                  </Link>
                ),
              )}
            </div>
          </div>

          {/* stats */}

        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1240px] px-6 py-14">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900 md:text-3xl">
              Browse by category
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              From pirouettes to Python — find your passion.
            </p>
          </div>
          <Link href="/browse" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            See all →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              href={`/browse?category=${encodeURIComponent(c.name)}`}
              className={`group flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-b ${c.hue} p-4 ring-1 ring-ink-800/5 transition hover:-translate-y-0.5 hover:shadow-card`}
            >
              <span className="text-3xl transition group-hover:scale-110">{c.emoji}</span>
              <span className="text-xs font-semibold text-ink-800">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-[1240px] px-6 pb-14">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900 md:text-3xl">
              Trending near you
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Classes, workshops & courses picked by neighbours like you.
            </p>
          </div>
          <Link href="/browse" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {classes.map((c) => (
            <ClassCard key={c.id} cls={c as any} />
          ))}
        </div>
      </section>

      {/* Why LearnNextDoor */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-[1240px] px-6">
          <h2 className="text-center font-display text-2xl font-bold text-ink-900 md:text-3xl">
            Why LearnNextDoor
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-ink-500">
            Built for neighbours, by neighbours. Every provider is KYC-verified, every
            review is real, and every class is within a 15-minute walk.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Verified providers",
                desc:
                  "Every teacher, coach and institute is KYC-verified before they can list a class.",
              },
              {
                icon: MapPin,
                title: "Around your block",
                desc:
                  "See only what's nearby. No long commutes — just walk, learn and come home.",
              },
              {
                icon: Star,
                title: "Real reviews",
                desc:
                  "Reviews are left only by learners who actually attended. No fake ratings.",
              },
            ].map((f, i) => (
              <div key={i} className="card">
                <f.icon className="h-6 w-6 text-brand-600" />
                <h3 className="mt-4 font-display text-lg font-bold text-ink-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-ink-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider CTA */}
      <section className="mx-auto max-w-[1240px] px-6 py-14">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 md:p-14 text-white shadow-float">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-400/30 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                For providers
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
                Teach your craft. Grow your brand. Earn from next door.
              </h2>
              <p className="mt-3 text-sm text-white/80 md:text-base">
                A zero-effort digital storefront for tutors, dance schools, music
                academies, yoga studios and art classes. List in minutes, manage batches,
                get paid on time.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/provider/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow hover:bg-surface-100">
                  Become a provider <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/provider/login" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/20">
                  Provider login
                </Link>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              {[
                "Zero-setup digital storefront",
                "Batch & instructor management",
                "Automatic monthly payouts",
                "Built-in reviews & reputation",
                "KYC verification & trust badge",
                "Holiday & cancellation tools",
              ].map((f) => (
                <li key={f} className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <StudentFooter />
      <AssistantDrawer />
    </>
  );
}
