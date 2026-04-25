"use client";

import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

type Props = {
  label: string;
  placeholder: string;
  maxLength: number;
  /** Return an error string if invalid, or null if valid. */
  validate: (value: string) => string | null;
  onSave: (value: string) => void;
  onCancel: () => void;
};

export function AddItemForm({
  label,
  placeholder,
  maxLength,
  validate,
  onSave,
  onCancel,
}: Props) {
  const [value, setValue] = useState("");
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
    <div className="card p-4 space-y-3 border-2 border-brand-200">
      <div className="flex items-center justify-between py-2">
        <label className="text-sm font-medium text-ink-900">{label}</label>
        <button onClick={onCancel} className="btn-chip border-none px-3">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
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
            maxLength={maxLength}
            placeholder={placeholder}
            className="input"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-500">
            {value.length}/{maxLength}
          </span>
        </div>

        <button onClick={handleSave} className="btn-primary px-4">
          Save
        </button>
        {value && value.length > 0 && (
          <button onClick={() => setValue("")} className="btn-ghost px-4">
            Clear
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-rose-600 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
