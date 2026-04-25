"use client";

import { ChevronRight, Plus } from "lucide-react";
import type { Category } from "./types";
import { AddItemForm } from "@/components/admin/AddItemForm";
import { DataTableRow } from "@/components/admin/DataTableRow";

interface CategoryPanelProps {
  categories: Category[];
  selectedCatId: string | null;
  editingId: string | null;
  showAddForm: boolean;
  onSelect: (id: string) => void;
  onStartEdit: (cat: Category) => void;
  onSaveEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onDelete: (cat: Category) => void;
  onShowAdd: () => void;
  onAdd: (name: string) => void;
  onCancelAdd: () => void;
  validateName: (name: string, excludeId?: string) => string | null;
};

export function CategoryPanel({
  categories,
  selectedCatId,
  editingId,
  showAddForm,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onShowAdd,
  onAdd,
  onCancelAdd,
  validateName,
}: CategoryPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center px-2 justify-between">
        <h2 className="font-display text-lg font-bold text-ink-900">Categories</h2>
        <button
          onClick={onShowAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Add Category
        </button>
      </div>

      {showAddForm && (
        <AddItemForm
          label="New Category Name"
          placeholder="e.g. Performing Arts"
          maxLength={50}
          validate={(v) => validateName(v)}
          onSave={onAdd}
          onCancel={onCancelAdd}
        />
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-800/5 text-sm">
            <thead className="bg-surface-100 border-b border-ink-500/50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3 text-center">Subcategories</th>
                <th className="px-4 py-3 text-center">Active Listings</th>
                <th className="px-4 py-3">Created On</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-800/5">
              
              {/* Each row */}
              {categories.map((cat) => (
                <DataTableRow
                  key={cat.id}
                  code={cat.categoryCode}
                  name={cat.name}
                  activeListings={cat.activeListings}
                  createdAt={cat.createdAt}
                  isEditing={editingId === cat.id}
                  editMaxLength={50}
                  validateEdit={(v) => validateName(v, cat.id)}
                  onSaveEdit={(name) => onSaveEdit(cat.id, name)}
                  onCancelEdit={onCancelEdit}
                  onStartEdit={() => onStartEdit(cat)}
                  onDelete={() => onDelete(cat)}
                  onClick={() => onSelect(cat.id)}
                  selected={selectedCatId === cat.id}
                  stopEditRowClick
                  nameAdornment={selectedCatId === cat.id ? (<ChevronRight className="h-3.5 w-3.5 text-brand-600" />) : null}
                  extraCells={
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center text-xs font-semibold text-ink-700">
                        {cat?.subcategories?.length}
                      </span>
                    </td>
                  }
                />
              ))}

              {/* If no category exists */}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-500">
                    No categories yet. Click &quot;+ Add Category&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
