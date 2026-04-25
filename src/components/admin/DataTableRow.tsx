"use client";

import { Pencil, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { InlineEditCell } from "./InlineEditCell";
import type { ReactNode } from "react";

interface DataTableRowsProps {
  code: string;
  name: string;     // Display name — switches to InlineEditCell when `isEditing` is true.
  activeListings: number;
  createdAt: string;
  isEditing: boolean;     // for editing 
  editMaxLength: number;
  validateEdit: (name: string) => string | null;
  onSaveEdit: (name: string) => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onClick?: () => void;   // If provided, the row becomes clickable
  selected?: boolean;
  nameAdornment?: ReactNode;
  extraCells?: ReactNode;     //Additional `<td>` elements inserted between the name column and Active Listings.
  
  stopEditRowClick?: boolean;   // Prevent edit input clicks from bubbling to the row onClick. If that category row is open and editing as well, so it won't interfere
};

export function DataTableRow({
  code,
  name,
  activeListings,
  createdAt,
  isEditing,
  editMaxLength,
  validateEdit,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
  onClick,
  selected = false,
  nameAdornment,
  extraCells,
  stopEditRowClick = false,
}: DataTableRowsProps) {
  
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition",
        onClick && "cursor-pointer",
        selected ? "bg-brand-50/60" : "hover:bg-surface-50",
      )}
    >
      {/* ID */}
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-ink-500">{code}</span>
      </td>

      {/* Name (or inline edit) */}
   
      {isEditing ? (
        <td colSpan={extraCells ? 3 : 2} className="px-4 py-3 w-full">
          <InlineEditCell
            initialValue={name}
            maxLength={editMaxLength}
            validate={validateEdit}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            stopRowClick={stopEditRowClick}
          />
        </td>
        ) : (
        <>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink-900">{name}</span>
              {nameAdornment}
            </div>
          </td>

          {/* Extra cells (e.g. subcategory count) */}
          {extraCells}

          {/* Active Listings */}
          <td className="text-center text-xs font-semibold text-ink-700">
            {/* <ListingsBadge count={activeListings} /> */}
            {activeListings}
          </td>
        </>)}

      {/* Created On */}
      <td className="px-4 py-3 text-xs text-ink-500">
        {formatDate(createdAt, { day: "2-digit", month: "short", year: "numeric" })}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onStartEdit}
            className="p-1.5 rounded-lg text-ink-500 hover:bg-surface-100 hover:text-brand-600"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          
        </div>
      </td>
    </tr>
  );
}
