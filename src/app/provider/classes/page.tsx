import Link from "next/link";
import { ExternalLink, Plus, Edit, Search, ShieldAlert } from "lucide-react";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCsv, priceLabel } from "@/lib/utils";
import { LiveStatusPill, StatusPill, TypePill } from "@/components/Pills";
import { ToggleClassStatus } from "./ToggleClassStatus";
import { ShareListingButton } from "./ShareListingButton";

const TYPE_FILTERS = [
  { value: "", label: "All types" },
  { value: "REGULAR", label: "Regular" },
  { value: "COURSE", label: "Course" },
  { value: "WORKSHOP", label: "Workshop" },
];

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PENDING", label: "Awaiting review" },
  { value: "BLOCKED", label: "Blocked" },
];

export default async function ProviderClassesPage({
  searchParams,
}: {
  searchParams?: { q?: string; type?: string; status?: string };
}) {
  const { provider } = await requireProvider();
  const classes = await prisma.class.findMany({
    where: { providerId: provider.id },
    include: { batches: true },
    orderBy: { createdAt: "desc" },
  });

  const kycVerified = provider.kycStatus === "VERIFIED";
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const typeFilter = searchParams?.type ?? "";
  const statusFilter = searchParams?.status ?? "";
  const filteredClasses = classes.filter((c) => {
    const matchesQuery =
      !q ||
      [c.title, c.category, c.description ?? "", c.tagsCsv ?? ""]
        .some((value) => value.toLowerCase().includes(q));
    const matchesType = !typeFilter || c.type === typeFilter;
    const isPublished = c.status === "ACTIVE" && c.liveStatus === "APPROVED";
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "PUBLISHED" && isPublished) ||
      (statusFilter === "INACTIVE" && !isPublished) ||
      (statusFilter === "PENDING" && c.liveStatus === "PENDING_APPROVAL") ||
      (statusFilter === "BLOCKED" && c.liveStatus === "BLOCKED");
    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">My listed classes</h1>
          <p className="mt-1 text-sm text-ink-500">
            {filteredClasses.length} of {classes.length} class{classes.length === 1 ? "" : "es"} — manage visibility, batches and bookings.
          </p>
        </div>
        {kycVerified ? (
          <Link href="/provider/classes/create" className="btn-accent">
            <Plus className="h-4 w-4" /> New class
          </Link>
        ) : (
          <Link href="/provider/account?kyc=required" className="btn-accent opacity-60 cursor-not-allowed pointer-events-none">
            <Plus className="h-4 w-4" /> New class
          </Link>
        )}
      </header>

      {/* KYC gate banner — shown when provider is not yet verified */}
      {!kycVerified && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">KYC verification required to list classes</p>
            <p className="mt-1 text-sm text-amber-700">
              {provider.kycStatus === "PENDING"
                ? "Your documents are under review. You'll be able to create classes once our team approves your KYC."
                : provider.kycStatus === "REJECTED"
                ? `Your KYC was rejected. Reason: "${provider.kycRejectionReason ?? "See account page for details"}". Please resubmit.`
                : "Upload a valid government ID to unlock class creation and start accepting bookings."}
            </p>
            <Link href="/provider/account?kyc=required" className="mt-3 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              Complete KYC →
            </Link>
          </div>
        </div>
      )}

      {classes.length > 0 && (
        <form className="grid gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink-800/5 md:grid-cols-[minmax(220px,1fr)_180px_190px_auto]">
          <label className="relative block">
            <span className="sr-only">Search listings</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              name="q"
              defaultValue={searchParams?.q ?? ""}
              placeholder="Search by listing name"
              className="input pl-10"
            />
          </label>
          <label className="block">
            <span className="sr-only">Class type</span>
            <select name="type" defaultValue={typeFilter} className="input">
              {TYPE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Listing status</span>
            <select name="status" defaultValue={statusFilter} className="input">
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button className="btn-accent flex-1 md:flex-none" type="submit">
              Apply
            </button>
            <Link href="/provider/classes" className="btn-ghost flex-1 md:flex-none">
              Clear
            </Link>
          </div>
        </form>
      )}

      {classes.length === 0 ? (
        <div className="card text-center">
          <div className="text-4xl">📚</div>
          <h3 className="mt-3 font-display text-xl font-bold text-ink-900">No classes yet</h3>
          <p className="mt-1 text-sm text-ink-500">Create your first class in under 2 minutes.</p>
          <Link href="/provider/classes/create" className="btn-accent mt-5 inline-flex">
            Create a class
          </Link>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="card text-center">
          <h3 className="font-display text-xl font-bold text-ink-900">No listings match these filters</h3>
          <p className="mt-1 text-sm text-ink-500">Clear filters to see every listing.</p>
          <Link href="/provider/classes" className="btn-ghost mt-5 inline-flex">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClasses.map((c) => {
            const images = parseCsv(c.imagesCsv);
            const primary = images[0] ?? "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800";
            const enrolled = c.batches.reduce((a, b) => a + b.enrolled, 0);
            const capacity = c.batches.reduce((a, b) => a + b.maxStudents, 0);
            const price = c.batches[0]?.pricePer4Weeks ?? 0;
            const isLive = c.status === "ACTIVE" && c.liveStatus === "APPROVED";
            return (
              <div key={c.id} className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-800/5">
                <div className="relative h-36 w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={primary} alt={c.title} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <TypePill type={c.type} />
                    <StatusPill status={c.status} />
                    <LiveStatusPill status={c.liveStatus} />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base font-bold text-ink-900 line-clamp-1">
                    {c.title}
                  </h3>
                  <div className="text-xs text-ink-500">{c.category} · {c.batches.length} batch{c.batches.length === 1 ? "" : "es"}</div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Stat label="Enrolled" value={`${enrolled}/${capacity}`} />
                    <Stat label="Price" value={priceLabel(c.type, price)} />
                    <Stat label="Rating" value={c.rating ? c.rating.toFixed(1) : "—"} />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Link href={`/provider/classes/${c.id}/edit`} className="btn-soft flex-1">
                      <Edit className="h-4 w-4" /> Edit
                    </Link>
                    <Link
                      href={`/class/${c.id}`}
                      target="_blank"
                      aria-disabled={!isLive}
                      className={`btn-soft flex-1 ${isLive ? "" : "pointer-events-none cursor-not-allowed opacity-50"}`}
                      title={isLive ? "Open public listing" : "This listing is not live yet."}
                    >
                      <ExternalLink className="h-4 w-4" /> View
                    </Link>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <ShareListingButton path={`/class/${c.id}`} disabled={!isLive} />
                    <ToggleClassStatus id={c.id} status={c.status} liveStatus={c.liveStatus} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-100 p-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="text-sm font-bold text-ink-900">{value}</div>
    </div>
  );
}
