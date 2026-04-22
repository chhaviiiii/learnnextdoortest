import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MarkReadButton } from "./MarkReadButton";
import { NotificationRow } from "./NotificationRow";

const ICONS: Record<string, string> = {
  NEW_ENROLLMENT: "🎒",
  SETTLEMENT_PROCESSED: "💰",
  SETTLEMENT_FAILED: "⚠️",
  REFUND_PROCESSED: "↩️",
  KYC_APPROVED: "✅",
  KYC_REJECTED: "❌",
  KYC_REVOKED: "⛔",
  LISTING_APPROVED: "🎉",
  LISTING_REJECTED: "📝",
  LISTING_BLOCKED: "🚫",
  LISTING_EDITED_BY_ADMIN: "✏️",
  EARLY_BIRD_SOLD_OUT: "⚡",
  SUPPORT_TICKET_UPDATE: "💬",
  HOLIDAY_DECLARED: "📅",
  CANCELLATION_PROCESSED: "🛑",
  USER_ACCOUNT_SUSPENDED: "⛔",
  USER_ACCOUNT_REINSTATED: "✅",
  DEFAULT: "🔔",
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500">
            {notifications.filter((n) => !n.read).length} unread of {notifications.length}
          </p>
        </div>
        <MarkReadButton />
      </header>

      {notifications.length === 0 ? (
        <div className="card text-center">
          <Bell className="mx-auto h-10 w-10 text-ink-500/50" />
          <h3 className="mt-3 font-display text-xl font-bold text-ink-900">All caught up!</h3>
          <p className="mt-1 text-sm text-ink-500">New updates will show up here.</p>
        </div>
      ) : (
        <div className="card">
          <div className="divide-y divide-ink-800/5">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                icon={ICONS[n.type] ?? ICONS.DEFAULT}
                notification={{
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  type: n.type,
                  read: n.read,
                  createdAtIso: n.createdAt.toISOString(),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
