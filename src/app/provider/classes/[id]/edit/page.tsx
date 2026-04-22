import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusPill, TypePill } from "@/components/Pills";
import { formatDate } from "@/lib/utils";
import { EditClassForm } from "./EditClassForm";
import { BatchManager } from "./BatchManager";

export default async function EditClassPage({ params }: { params: { id: string } }) {
  const { provider } = await requireProvider();
  const [cls, instructors] = await Promise.all([
    prisma.class.findFirst({
      where: { id: params.id, providerId: provider.id },
      include: {
        batches: { include: { instructor: true }, orderBy: { createdAt: "asc" } },
        bookings: { include: { user: true, batch: true }, orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    prisma.instructor.findMany({
      where: { providerId: provider.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!cls) return notFound();

  return (
    <div className="space-y-6">
      <nav className="text-xs text-ink-500">
        <Link href="/provider/classes" className="hover:text-ink-800">My classes</Link>
        <span className="mx-1">/</span>
        <span className="text-ink-800">{cls.title}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TypePill type={cls.type} />
            <StatusPill status={cls.status} />
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">{cls.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{cls.category}</p>
        </div>
        <Link href={`/class/${cls.id}`} className="btn-ghost">
          Preview public page →
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <EditClassForm
          initial={{
            id: cls.id,
            title: cls.title,
            description: cls.description ?? "",
            category: cls.category,
            tagsCsv: cls.tagsCsv ?? "",
            imagesCsv: cls.imagesCsv ?? "",
            earlyBird: cls.earlyBird,
          }}
        />

        <aside className="space-y-4">
          <BatchManager
            classId={cls.id}
            classType={cls.type as "REGULAR" | "COURSE" | "WORKSHOP"}
            instructors={instructors}
            initialBatches={cls.batches.map((b) => ({
              id: b.id,
              name: b.name,
              classDaysCsv: b.classDaysCsv,
              fromTime: b.fromTime,
              toTime: b.toTime,
              pricePer4Weeks: b.pricePer4Weeks,
              maxStudents: b.maxStudents,
              enrolled: b.enrolled,
              freeTrialEnabled: b.freeTrialEnabled,
              freeTrialSessions: b.freeTrialSessions,
              instructorId: b.instructorId,
            }))}
          />

          <div className="card">
            <h3 className="font-display text-base font-bold text-ink-900">Recent bookings</h3>
            {cls.bookings.length === 0 ? (
              <p className="mt-2 text-xs text-ink-500">None yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {cls.bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl bg-surface-100 p-3">
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{b.user.name ?? "Learner"}</div>
                      <div className="text-[11px] text-ink-500">{b.batch.name} · {formatDate(b.createdAt)}</div>
                    </div>
                    <StatusPill status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
