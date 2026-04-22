import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HolidaysClient } from "./HolidaysClient";

export default async function HolidaysPage() {
  const { provider } = await requireProvider();

  const [holidays, classes, cancellations] = await Promise.all([
    prisma.holiday.findMany({
      where: { providerId: provider.id },
      orderBy: { date: "asc" },
      include: {
        batch: { select: { name: true } },
        class: { select: { title: true } },
      },
    }),
    prisma.class.findMany({
      where: { providerId: provider.id, status: { not: "ARCHIVED" } },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        batches: {
          select: { id: true, name: true, pricePer4Weeks: true, enrolled: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cancellationRequest.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        class: { select: { title: true, type: true } },
        batch: { select: { name: true } },
      },
    }),
  ]);

  return (
    <HolidaysClient
      holidays={holidays.map((h) => ({
        id: h.id,
        date: h.date.toISOString().slice(0, 10),
        reason: h.reason,
        affectsAll: h.affectsAll,
        compensation: h.compensation as "EXTEND" | "REFUND" | "NONE",
        className: h.class?.title ?? null,
        batchName: h.batch?.name ?? null,
      }))}
      classes={classes.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type as "REGULAR" | "COURSE" | "WORKSHOP",
        status: c.status,
        batches: c.batches.map((b) => ({
          id: b.id,
          name: b.name,
          pricePer4Weeks: b.pricePer4Weeks,
          enrolled: b.enrolled,
        })),
      }))}
      cancellations={cancellations.map((x) => ({
        id: x.id,
        scope: x.scope as "WORKSHOP" | "COURSE" | "BATCH",
        reason: x.reason,
        totalRefund: x.totalRefund,
        affectedBookings: x.affectedBookings,
        status: x.status,
        createdAtIso: x.createdAt.toISOString(),
        classTitle: x.class.title,
        classType: x.class.type,
        batchName: x.batch?.name ?? null,
      }))}
    />
  );
}
