"use client";

import { useState } from "react";
import { X, AlertTriangle, Trash2, ExternalLink } from "lucide-react";

type Props = {
  title: string;
  /** The display name of the item being deleted. */
  itemName: string;
  activeListings: number;
  /** Extra warning text shown when deletion is allowed (0 active listings). */
  warningText: string;
  /** If true, the user must type the item name to confirm. */
  requireNameConfirm?: boolean;
  /** Optional URL to link to when deletion is blocked. */
  listingsHref?: string;
  deleteMsg?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteModal({
  title,
  itemName,
  activeListings,
  warningText,
  requireNameConfirm = false,
  listingsHref,
  deleteMsg,
  onConfirm,
  onClose,
}: Props) {
  const [confirmName, setConfirmName] = useState("");
  const blocked = activeListings > 0;
  const canDelete = !blocked && (!requireNameConfirm || confirmName === itemName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white shadow-float" >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800/5">
          <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* if Active listings > 0 */}
          {blocked ? (
            <>
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {deleteMsg}
                </span>
              </div>

              {listingsHref && (
                <a href={listingsHref} className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> View listings for {itemName}
                </a>
              )}

            </>
          ) : (

            // If active listings === 0
            <>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{warningText}</span>
              </div>
              
              {/* Required confirmation */}
              {requireNameConfirm && (
                <div>

                  <label className="text-sm font-medium text-ink-900">
                    Type <span className="font-bold">{itemName}</span> to confirm
                  </label>
                  
                  <input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canDelete) onConfirm();
                    }}
                    placeholder={itemName}
                    className="input mt-2"
                    autoFocus
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-ink-800/5">
          <button className="btn-ghost" onClick={onClose}> {blocked ? "Close" : "Cancel"} </button>
          
          {!blocked && (
            <button
              disabled={!canDelete}
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
