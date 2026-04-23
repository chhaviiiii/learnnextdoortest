"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  classId: string;
}

/**
 * Inline star-rating + comment form shown to users who have booked
 * but haven't yet reviewed this class.
 */
export function ReviewForm({ classId }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (comment.trim().length < 5) { setError("Comment must be at least 5 characters."); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, rating, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Failed to submit review."); return; }
      setDone(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-800 font-semibold">
        ✓ Thanks for your review! It will appear shortly.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-ink-800/10 shadow-sm">
      <h3 className="font-display text-base font-bold text-ink-900">Leave a review</h3>
      <p className="text-xs text-ink-500 mt-0.5">Share your experience to help other learners.</p>

      {/* Star selector */}
      <div className="flex items-center gap-1 mt-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                s <= (hovered || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-ink-200"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-semibold text-ink-700">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="What did you like or dislike about this class?"
        className="input mt-3 resize-none text-sm"
      />
      <div className="text-right text-[10px] text-ink-400 -mt-1">{comment.length}/500</div>

      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 border border-rose-200">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="btn-accent mt-3 w-full"
      >
        {busy ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}
