import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/app/login/LoginForm";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export default async function ProviderLoginPage() {
  const user = await getCurrentUser();
  if (user?.provider) redirect("/provider/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-surface-100 to-accent-50/40">
      <div className="mx-auto flex min-h-screen max-w-[1080px] items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid w-full items-center gap-6 md:grid-cols-2 md:gap-10">
          <div>
            <Logo />
            <span className="mt-6 inline-block rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200">
              Provider Portal
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
              Your teaching, organised.
            </h1>
            <p className="mt-3 text-sm text-ink-500">
              Manage batches, instructors, payouts and students — all from one clean dashboard.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink-600">
              <li>✓ OTP-based secure login</li>
              <li>✓ Auto-generated digital storefront</li>
              <li>✓ Looking to learn? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Student login →</Link></li>
            </ul>
          </div>
          <div className="card">
            <LoginForm redirect="/provider/dashboard" role="PROVIDER" />
            <div className="mt-5 rounded-2xl bg-surface-100 px-4 py-3 text-center text-xs text-ink-500">
              New provider?{" "}
              <Link href="/provider/signup" className="font-semibold text-brand-600 hover:text-brand-700">
                Create a provider account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
