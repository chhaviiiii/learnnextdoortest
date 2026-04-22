import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "./UsersClient";

export default async function UsersPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireAdmin();
  const q = (searchParams.q ?? "").trim();

  let users: Awaited<ReturnType<typeof loadUsers>> = [];
  if (q) users = await loadUsers(q);

  const [totalActive, totalSuspended] = await Promise.all([
    prisma.user.count({ where: { suspended: false, role: "STUDENT" } }),
    prisma.user.count({ where: { suspended: true } }),
  ]);

  return (
    <UsersClient
      q={q}
      totalActive={totalActive}
      totalSuspended={totalSuspended}
      users={users.map((u) => ({
        id: u.id,
        name: u.name ?? "—",
        email: u.email ?? null,
        phone: u.phone ?? null,
        role: u.role,
        suspended: u.suspended,
        suspendedAtIso: u.suspendedAt?.toISOString() ?? null,
        suspensionReason: u.suspensionReason ?? null,
        bookingsCount: u._count.bookings,
        createdAtIso: u.createdAt.toISOString(),
      }))}
    />
  );
}

async function loadUsers(q: string) {
  return prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
