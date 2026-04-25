"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, AlertTriangle } from "lucide-react";

type Props = {
  initialValue: string;
  maxLength: number;
  /** Return an error string if invalid, or null if valid. */
  validate: (value: string) => string | null;
  onSave: (value: string) => void;
  onCancel: () => void;
  /** If true, clicks inside the input won't propagate (useful inside clickable rows). */
  stopRowClick?: boolean;
};

export function InlineEditCell({
  initialValue,
  maxLength,
  validate,
  onSave,
  onCancel,
  stopRowClick,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function handleSave() {
    const trimmed = value.trim();
    const err = validate(trimmed);
    if (err) {
      setError(err);
      return;
    }
    onSave(trimmed);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <input
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") onCancel();
          }}
          onClick={stopRowClick ? (e) => e.stopPropagation() : undefined}
          maxLength={maxLength}
          className="input py-1.5 px-2.5 text-sm"
        />
        <button
          onClick={(e) => {
            if (stopRowClick) e.stopPropagation();
            handleSave();
          }}
          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            if (stopRowClick) e.stopPropagation();
            onCancel();
          }}
          className="p-1.5 rounded-lg text-ink-500 hover:bg-surface-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p className="text-xs text-rose-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
