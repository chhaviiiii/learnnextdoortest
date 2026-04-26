"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";

export function NotificationRow({
  notification,
  icon,
}: {
  notification: {
    id: string;
    title: string;
    body: string;
    type: string;
    read: boolean;
    createdAtIso: string;
  };
  icon: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function markRead() {
    setBusy(true);
    try {
      await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  const date = new Date(notification.createdAtIso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={`group flex items-start gap-4 py-4 transition ${
        !notification.read ? "bg-brand-50/40 -mx-6 px-6" : ""
      } ${busy || pending ? "opacity-60" : ""}`}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink-900">{notification.title}</span>
          {!notification.read && (
            <span className="inline-block h-2 w-2 rounded-full bg-accent-500" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-ink-600">{notification.body}</p>
        <div className="mt-1 text-[11px] text-ink-500">
          {date} · {notification.type.replace(/_/g, " ").toLowerCase()}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        {!notification.read && (
          <button
            onClick={markRead}
            disabled={busy}
            title="Mark as read"
            className="rounded-lg p-1.5 text-ink-500 hover:bg-surface-100 hover:text-emerald-600"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
