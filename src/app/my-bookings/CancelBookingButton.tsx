// "use client";
// import { useRouter } from "next/navigation";
// import { useState } from "react";

// export function CancelBookingButton({ id }: { id: string }) {
//   const [busy, setBusy] = useState(false);
//   const router = useRouter();
//   async function cancel() {
//     if (!confirm("Cancel this booking?")) return;
//     setBusy(true);
//     try {
//       await fetch(`/api/bookings/${id}`, { method: "DELETE" });
//       router.refresh();
//     } finally {
//       setBusy(false);
//     }
//   }
//   return (
//     <button onClick={cancel} disabled={busy} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
//       {busy ? "Cancelling…" : "Cancel booking"}
//     </button>
//   );
// }
