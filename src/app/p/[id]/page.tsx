import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Star, Users, BookOpen, Clock } from "lucide-react";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { KycPill } from "@/components/Pills";
import { ClassCard } from "@/components/ClassCard";
import { prisma } from "@/lib/prisma";
import { initials, formatDate } from "@/lib/utils";

export default async function ProviderProfilePage({ params }: { params: { id: string } }) {
  const provider = await prisma.provider.findUnique({
    where: { id: params.id },
    include: {
      classes: {
        where: { status: "ACTIVE", liveStatus: "APPROVED" },
        include: { batches: true, provider: true },
        orderBy: { createdAt: "desc" }
      },
    },
  });

  if (!provider) return notFound();

  const reviews = await prisma.review.findMany({
    where: { class: { providerId: provider.id } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <StudentHeader />
      
      <main className="mx-auto max-w-[1080px] w-full px-6 py-12 flex-1 space-y-8">
        <div className="card shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-bold text-white">
              {initials(provider.instituteName)}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 flex items-center gap-2">
                {provider.instituteName}
                {provider.kycStatus === "VERIFIED" && (
                  <BadgeCheck className="h-5 w-5 text-brand-500 fill-brand-100" />
                )}
              </h1>
              <div className="mt-1 text-sm text-ink-500">
                Provider · {provider.providerCode} · {provider.area ?? "Delhi"}
              </div>
              <div className="mt-3">
                <KycPill status={provider.kycStatus} />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-ink-800/5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-400">About</h2>
            <p className="mt-2 text-sm text-ink-600 whitespace-pre-wrap">
              {provider.bio ?? "No bio provided."}
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl font-bold text-ink-900 mb-6">Expert classes</h2>
          {provider.classes.length === 0 ? (
            <div className="card text-center text-ink-500 py-12">
              No active classes right now.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {provider.classes.map((cls) => (
                <ClassCard key={cls.id} cls={cls} />
              ))}
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900 mb-6">Learner reviews</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-[10px] font-bold text-white">
                      {initials(r.user.name ?? "U")}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-ink-900">{r.user.name ?? "Learner"}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-ink-200"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink-600 leading-relaxed italic">
                    "{r.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
