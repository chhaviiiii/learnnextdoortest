import { redirect } from "next/navigation";
import { ProviderSidebar } from "@/components/ProviderSidebar";
import { ProviderTopbar } from "@/components/ProviderTopbar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProviderAuthPassthrough } from "./ProviderAuthPassthrough";

export async function ProviderShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    // Let login/signup pages render; for the rest, bounce to login
    return <ProviderAuthPassthrough>{children}</ProviderAuthPassthrough>;
  }

  if (!user.provider) {
    return <ProviderAuthPassthrough>{children}</ProviderAuthPassthrough>;
  }

  const notifCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <div className="flex min-h-screen bg-surface-50">
      <ProviderSidebar notifCount={notifCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ProviderTopbar
          name={user.name ?? "Provider"}
          instituteName={user.provider.instituteName}
          kycStatus={user.provider.kycStatus}
          notifCount={notifCount}
        />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
