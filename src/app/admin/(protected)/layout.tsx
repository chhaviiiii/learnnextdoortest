import { requireAdmin } from "@/lib/admin-auth";
import { AdminShell } from "./AdminShell";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell
      admin={{
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role as "SUPER_ADMIN" | "ADMIN",
      }}
    >
      {children}
    </AdminShell>
  );
}
