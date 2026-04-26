"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pause, Play } from "lucide-react";

export function ToggleClassStatus({
  id,
  status,
  liveStatus,
}: {
  id: string;
  status: string;
  liveStatus: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const willPause = status === "ACTIVE";
  const canToggle = liveStatus === "APPROVED" && status !== "ARCHIVED";
  async function toggle() {
    if (!canToggle) return;
    setBusy(true);
    try {
      await fetch(`/api/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: willPause ? "PAUSED" : "ACTIVE" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={toggle}
      disabled={busy || !canToggle}
      title={!canToggle ? "This listing must be live before visibility can be changed." : undefined}
      className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
    >
      {willPause ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      {willPause ? "Pause" : "Resume"}
    </button>
  );
}
