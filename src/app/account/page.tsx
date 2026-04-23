import { redirect } from "next/navigation";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AccountClient } from "./AccountClient";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account");

  const [sessions, totalBookings, totalReviews] = await Promise.all([
    prisma.authSession.findMany({
      where: { userId: user.id },
      orderBy: { lastActive: "desc" },
    }),
    prisma.booking.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { userId: user.id } })
  ]);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <StudentHeader />
      <main className="flex-1 mx-auto max-w-[1080px] w-full px-6 py-8">
        <AccountClient 
          user={{ ...user, createdAtIso: user.createdAt.toISOString() }}
          stats={{ totalBookings, totalReviews }}
          sessions={sessions.map((s) => ({
            id: s.id,
            device: s.device ?? "Unknown device",
            location: s.location ?? null,
            current: s.current,
            lastActive: s.lastActive.toISOString(),
          }))}
        />
      </main>
      <StudentFooter />
    </div>
  );
}
