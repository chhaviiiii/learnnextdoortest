"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

/** Calls the logout endpoint and navigates the user to the home page.
 *  Can be used as a plain text button (children) or as an icon + text nav item. */
export function LogoutButton({ children, className, showIcon = false }: LogoutButtonProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className={className ?? "w-full text-left"}
    >
      {showIcon && <LogOut className="inline h-4 w-4 mr-1.5" />}
      {children}
    </button>
  );
}
