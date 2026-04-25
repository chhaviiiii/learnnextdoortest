// import Link from "next/link";
// import { redirect } from "next/navigation";
// import { Calendar, Clock, MapPin } from "lucide-react";
// import { StudentHeader } from "@/components/StudentHeader";
// import { StudentFooter } from "@/components/StudentFooter";
// import { StatusPill, TypePill } from "@/components/Pills";
// import { prisma } from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth";
// import { formatDate, formatINR, priceLabel } from "@/lib/utils";
// import { CancelBookingButton } from "./CancelBookingButton";

// export default async function MyBookingsPage({
//   searchParams,
// }: {
//   searchParams?: { just?: string };
// }) {
//   const user = await getCurrentUser();
//   if (!user) redirect("/login?redirect=/my-bookings");

//   const bookings = await prisma.booking.findMany({
//     where: { userId: user.id },
//     include: { class: { include: { provider: true } }, batch: true },
//     orderBy: { createdAt: "desc" },
//   });

//   return (
//     <>
//       <StudentHeader />
//       <section className="mx-auto max-w-[1080px] px-6 py-8">
//         {searchParams?.just && (
//           <div className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
//             🎉 Booking confirmed! Your provider will be notified. Check your dashboard below.
//           </div>
//         )}
//         <h1 className="font-display text-3xl font-bold text-ink-900">My bookings</h1>
//         <p className="mt-1 text-sm text-ink-500">
//           {bookings.length} booking{bookings.length === 1 ? "" : "s"} · Track your classes, trials and workshops.
//         </p>

//         {bookings.length === 0 ? (
//           <div className="mt-10 rounded-3xl bg-white p-12 text-center ring-1 ring-ink-800/5">
//             <div className="text-5xl">🎒</div>
//             <h3 className="mt-3 font-display text-xl font-bold text-ink-900">
//               You haven't booked any classes yet
//             </h3>
//             <p className="mt-1 text-sm text-ink-500">
//               Find something you'd love to learn — there's probably a teacher next door.
//             </p>
//             <Link href="/browse" className="btn-accent mt-5 inline-flex">Browse classes</Link>
//           </div>
//         ) : (
//           <div className="mt-8 space-y-4">
//             {bookings.map((b) => (
//               <div key={b.id} className="card flex flex-wrap items-start justify-between gap-4">
//                 <div className="flex-1 min-w-[260px]">
//                   <div className="flex flex-wrap items-center gap-2">
//                     <TypePill type={b.class.type} />
//                     <StatusPill status={b.status} />
//                     {b.mode === "TRIAL" && (
//                       <span className="pill bg-emerald-50 text-emerald-700">Free trial</span>
//                     )}
//                   </div>
//                   <Link
//                     href={`/class/${b.class.id}`}
//                     className="mt-2 block font-display text-lg font-bold text-ink-900 hover:underline"
//                   >
//                     {b.class.title}
//                   </Link>
//                   <div className="mt-1 text-xs text-ink-500">
//                     {b.class.provider.instituteName} · {b.class.category}
//                   </div>
//                   <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
//                     <span className="inline-flex items-center gap-1">
//                       <Calendar className="h-3.5 w-3.5" /> {b.batch.name}
//                     </span>
//                     <span className="inline-flex items-center gap-1">
//                       <Clock className="h-3.5 w-3.5" /> {b.batch.fromTime} – {b.batch.toTime}
//                     </span>
//                     <span className="inline-flex items-center gap-1">
//                       <MapPin className="h-3.5 w-3.5" />
//                       {b.class.provider.area ?? "Delhi"}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="flex flex-col items-end gap-2 text-right">
//                   <div className="text-base font-bold text-ink-900">
//                     {b.mode === "TRIAL" ? "Free" : priceLabel(b.class.type, b.amount)}
//                   </div>
//                   <div className="text-[11px] text-ink-500">
//                     Booked {formatDate(b.createdAt, { day: "2-digit", month: "short", year: "numeric" })}
//                   </div>
//                   {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
//                     <CancelBookingButton id={b.id} />
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//       <StudentFooter />
//     </>
//   );
// }
