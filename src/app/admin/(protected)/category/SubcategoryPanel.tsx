"use client";

import { Plus, ChevronRight, Layers } from "lucide-react";
import type { Category, Subcategory } from "./types";
import { DataTableRow } from "@/components/admin/DataTableRow";
import { AddItemForm } from "@/components/admin/AddItemForm";

interface SubCategoryPanelProps {
  category: Category | null;
  editingId: string | null;
  showAddForm: boolean;
  onStartEdit: (sub: Subcategory) => void;
  onSaveEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onDelete: (sub: Subcategory) => void;
  onShowAdd: () => void;
  onAdd: (name: string) => void;
  onCancelAdd: () => void;
  validateName: (name: string, excludeId?: string) => string | null;
};

export function SubcategoryPanel({
  category,
  editingId,
  showAddForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onShowAdd,
  onAdd,
  onCancelAdd,
  validateName,
}: SubCategoryPanelProps) {
  
  // Fallback if no category is selected
  if (!category) {
    return (
      <div className="card text-center py-16">
        <Layers className="mx-auto h-10 w-10 text-ink-500/40" />
        <div className="mt-3 font-display text-lg font-bold text-ink-900">Select a category</div>
        <p className="mt-1 text-sm text-ink-500">
          Click a category on the left to view and manage its subcategories.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 lg:mt-0 space-y-2 xl:space-y-4">
      {/* Breadcrumb header */}
      
        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          <Layers className="h-3.5 w-3.5 text-brand-600" />
          <span>{category?.name}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink-900 font-semibold">Subcategories</span>
        </div>
        
        
        <div className="flex items-center justify-between">
        
          <h2 className="font-display text-lg font-bold text-ink-900">
            {category?.name} — Subcategories
          </h2>

          <button
            onClick={onShowAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add Subcategory
          </button>
        </div>

      {/* Add subcategories */}
      {showAddForm && (
        <AddItemForm
          label="New Subcategory Name"
          placeholder="e.g. Bharatanatyam"
          maxLength={75}
          validate={(v) => validateName(v)}
          onSave={onAdd}
          onCancel={onCancelAdd}
        />
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-800/5 text-sm">
            
            {/* Header */}
            <thead className="bg-surface-100 border-b border-ink-500/50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Subcategory Name</th>
                <th className="px-4 py-3 text-center">Active Listings</th>
                <th className="px-4 py-3">Created On</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table body */}
            <tbody className="divide-y divide-ink-800/5">
              {category?.subcategories?.map((sub) => (
                <DataTableRow
                  key={sub.id}
                  code={sub.subcategoryCode}
                  name={sub.name}
                  activeListings={sub.activeListings}
                  createdAt={sub.createdAt}
                  isEditing={editingId === sub.id}
                  editMaxLength={75}
                  validateEdit={(v) => validateName(v, sub.id)}
                  onSaveEdit={(name) => onSaveEdit(sub.id, name)}
                  onCancelEdit={onCancelEdit}
                  onStartEdit={() => onStartEdit(sub)}
                  onDelete={() => onDelete(sub)}
                />
              ))}

              {/* If no subcategories exist */}
              {category?.subcategories?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-500">
                    No subcategories. Click <strong>&quot;+ Add Subcategory&quot;</strong> to create one.
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
