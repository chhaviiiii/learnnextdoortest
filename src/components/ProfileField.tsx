"use client";

import { Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type VerificationState = "empty" | "pending" | "verified";
export type ProfileFieldType = "text" | "email" | "phone";

type SaveResult = {
  ok: boolean;
  error?: string;
};

type ProfileFieldProps = {
  label: string;
  value: string;
  state: VerificationState;
  type: ProfileFieldType;
  onSave: (value: string) => SaveResult;
  onVerify: () => void;
  helperText?: string;
};

const INPUT_TYPE_MAP: Record<ProfileFieldType, "text" | "email" | "tel"> = {
  text: "text",
  email: "email",
  phone: "tel",
};

const EMPTY_VALUE_PLACEHOLDER_MAP: Record<ProfileFieldType, string> = {
  text: "Not added yet",
  email: "Not added yet",
  phone: "Not added yet",
};

const INPUT_PLACEHOLDER_MAP: Record<ProfileFieldType, string> = {
  text: "Not added yet",
  email: "you@example.com",
  phone: "Not added yet",
};

export function ProfileField({
  label,
  value,
  state,
  type,
  onSave,
  onVerify,
  helperText,
}: ProfileFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [showVerifiedToast, setShowVerifiedToast] = useState(false);
  const prevStateRef = useRef<VerificationState>(state);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  useEffect(() => {
    if (state !== "empty") {
      setIsEditing(false);
      setError(null);
    }
  }, [state]);

  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = state;

    if (prevState === "pending" && state === "verified") {
      setShowVerifiedToast(true);
      const timeout = setTimeout(() => {
        setShowVerifiedToast(false);
      }, 1800);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  const shownValue = useMemo(() => {
    if (value.trim()) return value;
    return EMPTY_VALUE_PLACEHOLDER_MAP[type];
  }, [type, value]);

  function handleSave() {
    const result = onSave(draftValue.trim());
    if (!result.ok) {
      setError(result.error ?? "Please check this field");
      return;
    }
    setError(null);
    setIsEditing(false);
  }

  const isEmpty = state === "empty";
  const isPending = state === "pending";
  const isVerified = state === "verified";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{label}</h2>
          {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
        </div>

        {isPending && (
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            Pending Verification
          </span>
        )}
      </div>

      <div className="mt-4">
        {isVerified && (
          <div className="space-y-2">
            {showVerifiedToast && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                Verified successfully
              </p>
            )}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <p className="text-sm text-slate-800">{shownValue}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Lock className="h-3.5 w-3.5" aria-label="Locked field" />
              </span>
            </div>
          </div>
        )}

        {isPending && (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-slate-800">
              {shownValue}
            </div>
            <button
              type="button"
              onClick={onVerify}
              className="inline-flex rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Verify
            </button>
          </div>
        )}

        {isEmpty && !isEditing && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-sm text-slate-400">{shownValue}</p>
            <button
              type="button"
              onClick={() => {
                setDraftValue(value);
                setError(null);
                setIsEditing(true);
              }}
              className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Add
            </button>
          </div>
        )}

        {isEmpty && isEditing && (
          <div className="space-y-2">
            <input
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              type={INPUT_TYPE_MAP[type]}
              placeholder={INPUT_PLACEHOLDER_MAP[type]}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-brand-400 transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2"
            />
            {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftValue(value);
                  setError(null);
                  setIsEditing(false);
                }}
                className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}