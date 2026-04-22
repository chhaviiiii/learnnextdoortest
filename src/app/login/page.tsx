import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Logo";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const redirect = searchParams?.redirect ?? "/";
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-surface-100 to-accent-50/40">
      <div className="mx-auto flex min-h-screen max-w-[1080px] items-center justify-center px-6 py-12">
        <div className="grid w-full items-center gap-10 md:grid-cols-2">
          <div>
            <Logo />
            <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight text-ink-900">
              Welcome back.
            </h1>
            <p className="mt-3 text-sm text-ink-500">
              Log in with your phone number to book classes, track progress, and leave reviews for
              your neighbourhood teachers.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink-600">
              <li>✓ Instant OTP — no password to remember</li>
              <li>✓ Your bookings, everywhere</li>
              <li>✓ Teaching instead? <Link href="/provider/login" className="font-semibold text-brand-600 hover:underline">Provider login →</Link></li>
            </ul>
          </div>

          <div className="card">
            <LoginForm redirect={redirect} role="STUDENT" />
          </div>
        </div>
      </div>
    </main>
  );
}
