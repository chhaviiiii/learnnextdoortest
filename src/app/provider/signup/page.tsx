import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignupForm } from "./SignupForm";

export default function ProviderSignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-surface-100 to-accent-50/40">
      <div className="mx-auto max-w-[1080px] px-6 py-10">
        <Logo />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <span className="inline-block rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200">
              Become a Provider
            </span>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-ink-900">
              List your institute. Reach your neighbourhood.
            </h1>
            <p className="mt-3 max-w-prose text-sm text-ink-500">
              Fill in a few details to create your provider account. You can list
              classes and accept bookings after KYC verification (takes under 24 hours).
            </p>

            <div className="mt-8 card">
              <SignupForm />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card">
              <h3 className="font-display text-base font-bold text-ink-900">What you get</h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-600">
                <li>✓ Zero-setup digital storefront</li>
                <li>✓ Batch & instructor management</li>
                <li>✓ Automated monthly payouts</li>
                <li>✓ Built-in reviews & reputation</li>
                <li>✓ KYC verification trust badge</li>
                <li>✓ Holiday & cancellation tools</li>
              </ul>
            </div>
            <div className="card bg-brand-gradient text-white">
              <h3 className="font-display text-base font-bold">Already have an account?</h3>
              <p className="mt-1 text-sm text-white/80">Log in to access your dashboard.</p>
              <Link href="/provider/login" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700">
                Provider login →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
