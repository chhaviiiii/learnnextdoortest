import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InstructorsClient } from "./InstructorsClient";

export default async function InstructorsPage() {
  const { provider } = await requireProvider();
  const instructors = await prisma.instructor.findMany({
    where: { providerId: provider.id },
    include: {
      batches: {
        where: { class: { status: "ACTIVE" } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <InstructorsClient
      instructors={instructors.map((i) => ({
        id: i.id,
        name: i.name,
        email: i.email ?? "",
        phone: i.phone ?? "",
        specialty: i.specialty ?? "",
        kycStatus: i.kycStatus,
        activeListings: i.batches.length,
      }))}
    />
  );
}
