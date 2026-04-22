"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProviderAuthPassthrough({ children }: { children: React.ReactNode }) {
  const p = usePathname() ?? "";
  const router = useRouter();
  const isAuthPage = p === "/provider/login" || p === "/provider/signup";

  useEffect(() => {
    if (!isAuthPage) router.replace("/provider/login");
  }, [isAuthPage, router]);

  if (!isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-500">
        Redirecting to login…
      </div>
    );
  }
  return <>{children}</>;
}
