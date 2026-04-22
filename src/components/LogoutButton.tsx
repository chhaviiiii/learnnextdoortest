"use client";
import { useRouter } from "next/navigation";

export function LogoutButton({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <button onClick={logout} className="w-full text-left">
      {children}
    </button>
  );
}
