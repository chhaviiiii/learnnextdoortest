"use client";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

export function MarkReadButton() {
  const router = useRouter();
  async function mark() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }
  return (
    <button onClick={mark} className="btn-ghost">
      <CheckCheck className="h-4 w-4" /> Mark all as read
    </button>
  );
}
