import { requireUser } from "@/lib/auth";
import { AccountClient } from "@/app/account/AccountClient";
import { StudentHeader } from "@/components/StudentHeader";
import { StudentFooter } from "@/components/StudentFooter";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <StudentHeader />
      <AccountClient
        initialUser={{
          name: user.name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
        }}
      />
      <StudentFooter />
    </>
  );
}