"use client";

import { useState, useCallback } from "react";
import { FolderTree } from "lucide-react";
import type { Category, Subcategory } from "./types";
import { SEED_CATEGORIES, nextCatId, nextSubId } from "./types";
import { CategoryPanel } from "./CategoryPanel";
import { SubcategoryPanel } from "./SubcategoryPanel";
import { DeleteModal } from "@/components/admin/DeleteModal";


export function CategoryClient() {
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(SEED_CATEGORIES[0]?.id ?? null);
  const [flash, setFlash] = useState<string | null>(null);

  // Edit state (only one thing editable at a time)
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editSubId, setEditSubId] = useState<string | null>(null);

  // Add form visibility
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);

  // Delete targets
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [deleteSub, setDeleteSub] = useState<Subcategory | null>(null);

  const selectedCat = categories.find((c) => c.id === selectedCatId) ?? null;

  function showFlashMsg(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3500);
  }

  // This will be replaced later by code fetching from db
  function nextCatCode() {
    const nums = categories.map((c) => parseInt(c.categoryCode.replace("CAT-", ""), 10));
    return `CAT-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
  }
  function nextSubCode() {
    const all = categories.flatMap((c) => c.subcategories);
    const nums = all.map((s) => parseInt(s.subcategoryCode.replace("SUB-", ""), 10));
    return `SUB-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
  }

  
  // Name validation 
  const validateCatName = useCallback(
    (name: string, excludeId?: string): string | null => {
      if (!name) return "Category name cannot be blank.";
      if (name.length > 50) return "Category name must be 50 characters or fewer.";
      if (categories.some((c) => c.id !== excludeId && c.name.toLowerCase() === name.toLowerCase()))
        return "A category with this name already exists.";
      return null;
    },
    [categories],
  );

  const validateSubName = useCallback(
    (name: string, excludeId?: string): string | null => {
      if (!selectedCat) return "No category selected.";
      if (!name) return "Subcategory name cannot be blank.";
      if (name.length > 75) return "Subcategory name must be 75 characters or fewer.";
      if (
        selectedCat.subcategories.some(
          (s) => s.id !== excludeId && s.name.toLowerCase() === name.toLowerCase(),
        )
      )
        return "A subcategory with this name already exists in this category.";
      return null;
    },
    [selectedCat],
  );


  //Category handler function
  function handleSelectCategory(id: string) {
    setSelectedCatId(id);
    setShowAddSub(false);
    setEditSubId(null);
    setDeleteSub(null);
  }

  function handleAddCategory(name: string) {
    const newCat: Category = {
      id: nextCatId(),
      categoryCode: nextCatCode(),
      name,
      activeListings: 0,
      createdAt: new Date().toISOString(),
      subcategories: [],
    };
    setCategories((prev) => [...prev, newCat]);
    setShowAddCat(false);
    setSelectedCatId(newCat.id);
    showFlashMsg(`Category "${name}" created.`);
  }

  function handleSaveEditCategory(id: string, name: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    setEditCatId(null);
    showFlashMsg(`Category renamed to "${name}".`);
  }

  // Category Deletion
  function handleDeleteCategory() {
    if (!deleteCat) return;
    setCategories((prev) => prev.filter((c) => c.id !== deleteCat.id));
    if (selectedCatId === deleteCat.id) {
      setSelectedCatId(categories.find((c) => c.id !== deleteCat.id)?.id ?? null);
    }
    showFlashMsg(`Category "${deleteCat.name}" and its subcategories deleted.`);
    setDeleteCat(null);
  }


  // Sub-category handler functions
  function handleAddSubcategory(name: string) {
    if (!selectedCat) return;
    const newSub: Subcategory = {
      id: nextSubId(),
      subcategoryCode: nextSubCode(),
      name,
      activeListings: 0,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) =>
      prev.map((c) =>
        c.id === selectedCat.id
          ? { ...c, subcategories: [...c.subcategories, newSub] }
          : c,
      ),
    );
    setShowAddSub(false);
    showFlashMsg(`Subcategory "${name}" added to ${selectedCat.name}.`);
  }

  function handleSaveEditSubcategory(id: string, name: string) {
    if (!selectedCat) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === selectedCat.id
          ? { ...c, subcategories: c.subcategories.map((s) => (s.id === id ? { ...s, name } : s)) }
          : c,
      ),
    );
    setEditSubId(null);
    showFlashMsg(`Subcategory renamed to "${name}".`);
  }

  function handleDeleteSubcategory() {
    if (!deleteSub || !selectedCat) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === selectedCat.id
          ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== deleteSub.id) }
          : c,
      ),
    );
    showFlashMsg(`Subcategory "${deleteSub.name}" deleted.`);
    setDeleteSub(null);
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <header>

        <h1 className="mt-1 font-display text-2xl md:text-3xl font-bold text-ink-900">
          Category & Subcategory Management
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {categories.length} categories ·{" "}
          {categories.reduce((sum, c) => sum + c.subcategories.length, 0)} sub-categories
        </p>

      </header>

      {/* Flash */}
      {flash && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
          {flash}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Categories Panel */}
        <CategoryPanel
          categories={categories}
          selectedCatId={selectedCatId}
          editingId={editCatId}
          showAddForm={showAddCat}
          onSelect={handleSelectCategory}
          onStartEdit={(cat) => setEditCatId(cat.id)}
          onSaveEdit={handleSaveEditCategory}
          onCancelEdit={() => setEditCatId(null)}
          onDelete={(cat) => setDeleteCat(cat)}
          onShowAdd={() => setShowAddCat(true)}
          onAdd={handleAddCategory}
          onCancelAdd={() => setShowAddCat(false)}
          validateName={validateCatName}
        />

        {/* Right: Subcategories Panel */}
        <SubcategoryPanel
          category={selectedCat}
          editingId={editSubId}
          showAddForm={showAddSub}
          onStartEdit={(sub) => setEditSubId(sub.id)}
          onSaveEdit={handleSaveEditSubcategory}
          onCancelEdit={() => setEditSubId(null)}
          onDelete={(sub) => setDeleteSub(sub)}
          onShowAdd={() => setShowAddSub(true)}
          onAdd={handleAddSubcategory}
          onCancelAdd={() => setShowAddSub(false)}
          validateName={validateSubName}
        />
      </div>

      {/* Delete Category Modal */}
      {deleteCat && (
        <DeleteModal
          title="Delete Category"
          itemName={deleteCat?.name}
          activeListings={deleteCat?.activeListings}
          warningText={`This will permanently delete "${deleteCat?.name}" and all its ${deleteCat.subcategories.length} subcategories. This action cannot be undone.`}
          requireNameConfirm
          deleteMsg={`This item has ${deleteCat?.activeListings} active listings. Reassign or remove them before deleting.`}
          listingsHref={`/admin/listings?category=${encodeURIComponent(deleteCat?.name)}`}
          onConfirm={handleDeleteCategory}
          onClose={() => setDeleteCat(null)}
        />
      )}

      {/* Delete Subcategory Modal */}
      {deleteSub && (
        <DeleteModal
          title="Delete Subcategory"
          itemName={deleteSub?.name}
          activeListings={deleteSub?.activeListings}
          warningText={`Are you sure you want to permanently delete "${deleteSub?.name}"? This action cannot be undone.`}
          deleteMsg={`This item has ${deleteSub?.activeListings} active listings. Reassign or remove them before deleting.`}
          onConfirm={handleDeleteSubcategory}
          onClose={() => setDeleteSub(null)}
        />
      )}
    </div>
  );
}
