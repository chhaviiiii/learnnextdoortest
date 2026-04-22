import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Admin · LearnNextDoor",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const existing = await getCurrentAdmin();
  if (existing) redirect("/admin");

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white font-display font-bold text-2xl mb-4">
            LND
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Admin Portal</h1>
          <p className="mt-2 text-sm text-ink-500">Restricted access. All actions are audited.</p>
        </div>
        <div className="card">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">
          Not an admin? <a href="/login" className="text-brand-600 hover:underline">Go to learner login</a>
        </p>
      </div>
    </div>
  );
}
