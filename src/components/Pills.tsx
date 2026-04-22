import { cn } from "@/lib/utils";

export function TypePill({ type }: { type: string }) {
  const styles: Record<string, string> = {
    REGULAR: "bg-brand-50 text-brand-700",
    WORKSHOP: "bg-accent-50 text-accent-700",
    COURSE: "bg-emerald-50 text-emerald-700",
  };
  const labels: Record<string, string> = {
    REGULAR: "Regular",
    WORKSHOP: "Workshop",
    COURSE: "Course",
  };
  return (
    <span className={cn("pill", styles[type] ?? "bg-surface-200 text-ink-700")}>
      {labels[type] ?? type}
    </span>
  );
}

export function FreeTrialPill() {
  return <span className="pill bg-emerald-50 text-emerald-700">Free Trial</span>;
}

export function EarlyBirdPill() {
  return <span className="pill bg-amber-50 text-amber-700">Early Bird</span>;
}

export function KycPill({ status }: { status: string }) {
  if (status === "VERIFIED")
    return <span className="pill bg-emerald-50 text-emerald-700">KYC Verified</span>;
  if (status === "PENDING")
    return <span className="pill bg-amber-50 text-amber-700">KYC Pending</span>;
  if (status === "REJECTED")
    return <span className="pill bg-rose-50 text-rose-700">KYC Rejected</span>;
  return <span className="pill bg-surface-200 text-ink-600">KYC Not Uploaded</span>;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    PAUSED: "bg-amber-50 text-amber-700",
    DRAFT: "bg-surface-200 text-ink-600",
    ARCHIVED: "bg-rose-50 text-rose-700",
    CONFIRMED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    CANCELLED: "bg-rose-50 text-rose-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    PROCESSING: "bg-amber-50 text-amber-700",
    OPEN: "bg-amber-50 text-amber-700",
    RESOLVED: "bg-emerald-50 text-emerald-700",
    CLOSED: "bg-surface-200 text-ink-600",
  };
  return (
    <span className={cn("pill", map[status] ?? "bg-surface-200 text-ink-600")}>
      {status}
    </span>
  );
}
