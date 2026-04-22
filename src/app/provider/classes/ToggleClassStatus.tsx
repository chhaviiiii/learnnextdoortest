"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pause, Play } from "lucide-react";

export function ToggleClassStatus({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const willPause = status === "ACTIVE";
  async function toggle() {
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
    <button onClick={toggle} disabled={busy} className="btn-ghost">
      {willPause ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      {willPause ? "Pause" : "Resume"}
    </button>
  );
}
