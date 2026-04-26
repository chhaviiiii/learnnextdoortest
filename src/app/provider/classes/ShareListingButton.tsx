"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function ShareListingButton({ path, disabled }: { path: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (disabled) return;
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      disabled={disabled}
      title={disabled ? "This listing is not live yet." : "Copy public listing link"}
      className="btn-soft flex-1 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Share2 className="h-4 w-4" />
      {copied ? "Copied" : "Share"}
    </button>
  );
}
