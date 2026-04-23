import Link from "next/link";
import {
  Users,
  BookOpen,
  Wallet,
  Star,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusPill, TypePill } from "@/components/Pills";

export default async function ProviderDashboard({
  searchParams,
}: {
  searchParams?: { welcome?: string };
}) {
  const { provider } = await requireProvider();

  const [classes, bookings, reviews, instructors] = await Promise.all([
    prisma.class.findMany({
      where: { providerId: provider.id },
      include: { batches: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { class: { providerId: provider.id } },
      include: { user: true, class: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.review.findMany({
      where: { class: { providerId: provider.id } },
      include: { user: true, class: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.instructor.count({ where: { providerId: provider.id } }),
  ]);

  const totalStudents = await prisma.booking.count({
    where: {
      class: { providerId: provider.id },
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
  });
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : null;

  // Onboarding state — shown until the provider has KYC verified AND has at least 1 class.
  const kycPending = provider.kycStatus !== "VERIFIED";
  const hasNoClasses = classes.length === 0;
  const showOnboarding = !!searchParams?.welcome || kycPending || hasNoClasses;

  // Build a checklist: steps 1–3. Step is "done" when condition holds.
  const steps = [
    {
      key: "profile",
      label: "Set up your provider profile",
      done: !!(provider.bio && provider.address && provider.upiId),
      href: "/provider/account",
      cta: "Edit profile",
    },
    {
      key: "kyc",
      label: "Verify your KYC",
      done: provider.kycStatus === "VERIFIED",
      href: "/provider/account",
      cta: provider.kycStatus === "PENDING" ? "KYC in review" : "Upload documents",
      disabled: provider.kycStatus === "PENDING",
    },
    {
      key: "class",
      label: "List your first class",
      done: !hasNoClasses,
      href: "/provider/classes/create",
      cta: "Create a class",
    },
  ];
  const nextStep = steps.find((s) => !s.done);

  return (
    <div className="space-y-8">
      {showOnboarding && nextStep && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-accent-500 p-5 text-white shadow-float">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
            <Sparkles className="h-3.5 w-3.5" />
            {searchParams?.welcome ? `Welcome, ${provider.instituteName}!` : "Let's finish setup"}
          </div>
          <h2 className="mt-1 font-display text-xl font-bold">
            {steps.filter((s) => s.done).length} of {steps.length} steps done
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Complete every step to start taking bookings on LearnNextDoor.
          </p>

          <ol className="mt-4 space-y-2">
            {steps.map((s, i) => (
              <li
                key={s.key}
                className={`flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 ${
                  s.done ? "opacity-70" : ""
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    s.done ? "bg-emerald-400 text-white" : "bg-white text-brand-700"
                  }`}
                >
                  {s.done ? "✓" : i + 1}
                </span>
                <span className={`flex-1 ${s.done ? "line-through" : ""}`}>{s.label}</span>
                {!s.done && (
                  <Link
                    href={s.disabled ? "#" : s.href}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                      s.disabled
                        ? "bg-white/20 text-white/60 cursor-not-allowed"
                        : "bg-white text-brand-700 hover:bg-surface-100"
                    }`}
                    aria-disabled={s.disabled}
                  >
                    {s.cta} →
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {!showOnboarding && provider.kycStatus === "PENDING" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-200">
          <ShieldCheck className="h-5 w-5" />
          <div className="flex-1 text-sm">
            <strong>KYC is under review.</strong> You can list classes now — bookings activate once verification completes.
          </div>
          <Link href="/provider/account" className="text-xs font-semibold underline">
            View status
          </Link>
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">
            Welcome back, {provider.instituteName}. Here's what's happening today.
          </p>
        </div>
        <Link href="/provider/classes/create" className="btn-accent">
          + Create a Class
        </Link>
      </header>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={BookOpen}
          label="Active classes"
          value={classes.filter((c) => c.status === "ACTIVE").length.toString()}
          trend={`${classes.length} total`}
          hue="brand"
        />
        <Stat
          icon={Users}
          label="Total students"
          value={totalStudents.toString()}
          trend={`${instructors} instructor${instructors === 1 ? "" : "s"}`}
          hue="accent"
        />

        <Stat
          icon={Star}
          label="Average rating"
          value={avgRating ? avgRating.toFixed(1) : "—"}
          trend={`${reviews.length} recent reviews`}
          hue="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent bookings */}
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900">Recent bookings</h2>
            <Link href="/provider/classes" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">
              No bookings yet. Share your class link to start enrolling students.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-ink-800/5">
              {bookings.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="text-sm font-semibold text-ink-900">{b.user.name ?? "Learner"}</div>
                    <div className="text-xs text-ink-500">
                      {b.class.title} · {b.mode === "TRIAL" ? "Free trial" : formatINR(b.amount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <StatusPill status={b.status} />
                    <span className="text-ink-500">{formatDate(b.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


      </div>

      {/* Classes quick list */}
      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">My classes</h2>
          <Link href="/provider/classes" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            Manage all →
          </Link>
        </div>
        {classes.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-surface-100 p-8 text-center">
            <p className="text-sm text-ink-500">You haven't listed any classes yet.</p>
            <Link href="/provider/classes/create" className="btn-accent mt-4 inline-flex">
              Create your first class
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {classes.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/provider/classes/${c.id}/edit`}
                className="group flex flex-col gap-2 rounded-2xl bg-surface-100 p-4 ring-1 ring-ink-800/5 hover:bg-surface-200"
              >
                <div className="flex items-center gap-2">
                  <TypePill type={c.type} />
                  <StatusPill status={c.status} />
                </div>
                <div className="font-display text-sm font-bold text-ink-900">{c.title}</div>
                <div className="text-xs text-ink-500">
                  {c.batches.length} batch{c.batches.length === 1 ? "" : "es"} ·{" "}
                  {c.batches.reduce((a, b) => a + b.enrolled, 0)} enrolled
                </div>
                <ArrowUpRight className="ml-auto mt-2 h-4 w-4 text-brand-600 opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  trend,
  hue,
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  hue: "brand" | "accent" | "emerald" | "amber";
}) {
  const hues: Record<string, string> = {
    brand: "from-brand-500 to-brand-700 text-white",
    accent: "from-accent-400 to-accent-600 text-white",
    emerald: "from-emerald-400 to-emerald-600 text-white",
    amber: "from-amber-400 to-amber-600 text-white",
  };
  return (
    <div className="card">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${hues[hue]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-ink-900">{value}</div>
      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-500">
        <TrendingUp className="h-3 w-3" /> {trend}
      </div>
    </div>
  );
}
