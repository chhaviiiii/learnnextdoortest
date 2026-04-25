import Link from "next/link";
import { Logo } from "./Logo";

export function StudentFooter() {
  return (
    <footer className="mt-16 border-t border-ink-800/5 bg-white sm:mt-24">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-4 md:gap-10">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-ink-500">
            Hyperlocal learning, powered by neighbours. Find trusted teachers for
            every skill — right around your block.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink-800">For learners</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li><Link href="/browse" className="hover:text-ink-800">Browse classes</Link></li>
            <li><Link href="/browse?type=WORKSHOP" className="hover:text-ink-800">Workshops</Link></li>
            <li><Link href="/browse?type=COURSE" className="hover:text-ink-800">Courses</Link></li>
            {/* <li><Link href="/my-bookings" className="hover:text-ink-800">My bookings</Link></li> */}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink-800">For providers</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li><Link href="/provider/signup" className="hover:text-ink-800">Become a provider</Link></li>
            <li><Link href="/provider/login" className="hover:text-ink-800">Provider login</Link></li>
            <li><Link href="/provider/dashboard" className="hover:text-ink-800">Provider dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink-800">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li>About</li>
            <li>Contact</li>
            <li>Privacy</li>
            <li>Terms</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800/5 py-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} LearnNextDoor. Made for neighbours, by
        neighbours.
      </div>
    </footer>
  );
}
