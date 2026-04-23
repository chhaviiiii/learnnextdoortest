import Link from "next/link";
import { Plus, Edit, ShieldAlert } from "lucide-react";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, parseCsv, priceLabel } from "@/lib/utils";
import { StatusPill, TypePill } from "@/components/Pills";
import { ToggleClassStatus } from "./ToggleClassStatus";

export default async function ProviderClassesPage() {
  const { provider } = await requireProvider();
  const classes = await prisma.class.findMany({
    where: { providerId: provider.id },
    include: { batches: true },
    orderBy: { createdAt: "desc" },
  });

  const kycVerified = provider.kycStatus === "VERIFIED";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">My listed classes</h1>
          <p className="mt-1 text-sm text-ink-500">
            {classes.length} class{classes.length === 1 ? "" : "es"} — manage visibility, batches and bookings.
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

      {classes.length === 0 ? (
        <div className="card text-center">
          <div className="text-4xl">📚</div>
          <h3 className="mt-3 font-display text-xl font-bold text-ink-900">No classes yet</h3>
          <p className="mt-1 text-sm text-ink-500">Create your first class in under 2 minutes.</p>
          <Link href="/provider/classes/create" className="btn-accent mt-5 inline-flex">
            Create a class
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const images = parseCsv(c.imagesCsv);
            const primary = images[0] ?? "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800";
            const enrolled = c.batches.reduce((a, b) => a + b.enrolled, 0);
            const capacity = c.batches.reduce((a, b) => a + b.maxStudents, 0);
            const price = c.batches[0]?.pricePer4Weeks ?? 0;
            return (
              <div key={c.id} className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-800/5">
                <div className="relative h-36 w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={primary} alt={c.title} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <TypePill type={c.type} />
                    <StatusPill status={c.status} />
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
                    <ToggleClassStatus id={c.id} status={c.status} />
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
