import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "./AccountClient";
import { formatDate } from "@/lib/utils";

export default async function AccountPage() {
  const { user, provider } = await requireProvider();
  const sessions = await prisma.authSession.findMany({
    where: { userId: user.id },
    orderBy: { lastActive: "desc" },
  });

  return (
    <AccountClient
      user={{
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      }}
      provider={{
        id: provider.id,
        providerCode: provider.providerCode,
        instituteName: provider.instituteName,
        bio: provider.bio ?? "",
        area: provider.area ?? "",
        address: provider.address ?? "",
        upiId: provider.upiId ?? "",
        upiVerified: provider.upiVerified,
        kycStatus: provider.kycStatus,
        kycDocType: provider.kycDocType ?? "",
        kycVerifiedAt: provider.kycVerifiedAt
          ? formatDate(provider.kycVerifiedAt, { day: "2-digit", month: "short", year: "numeric" })
          : null,
      }}
      sessions={sessions.map((s) => ({
        id: s.id,
        device: s.device ?? "Unknown device",
        location: s.location ?? null,
        current: s.current,
        lastActive: s.lastActive.toISOString(),
      }))}
    />
  );
}
