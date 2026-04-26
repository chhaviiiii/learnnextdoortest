import { prisma } from "@/lib/prisma";
import { DEFAULT_TAXONOMY } from "@/lib/taxonomy-data";

export type CategoryTaxonomyItem = {
  id: string;
  name: string;
  icon: string | null;
  hue: string | null;
  subcategories: string[];
};

let seeded = false;

export async function ensureTaxonomySeeded() {
  if (seeded) return;

  const activeCount = await prisma.category.count({ where: { active: true } });
  if (activeCount >= DEFAULT_TAXONOMY.length) {
    seeded = true;
    return;
  }

  let subcategoryIndex = 1;
  for (const [categoryIndex, item] of DEFAULT_TAXONOMY.entries()) {
    const category = await prisma.category.upsert({
      where: { name: item.name },
      update: {
        icon: item.icon,
        hue: item.hue,
        active: true,
        displayOrder: categoryIndex,
      },
      create: {
        categoryCode: `CAT-${String(categoryIndex + 1).padStart(3, "0")}`,
        name: item.name,
        icon: item.icon,
        hue: item.hue,
        displayOrder: categoryIndex,
      },
    });

    for (const [displayOrder, subcategoryName] of item.subcategories.entries()) {
      await prisma.subcategory.upsert({
        where: { categoryId_name: { categoryId: category.id, name: subcategoryName } },
        update: { active: true, displayOrder },
        create: {
          subcategoryCode: `SUB-${String(subcategoryIndex).padStart(3, "0")}`,
          categoryId: category.id,
          name: subcategoryName,
          displayOrder,
        },
      });
      subcategoryIndex += 1;
    }
  }

  seeded = true;
}

export async function getCategoryTaxonomy(): Promise<CategoryTaxonomyItem[]> {
  await ensureTaxonomySeeded();

  const rows = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      subcategories: {
        where: { active: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  return rows.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    hue: category.hue,
    subcategories: category.subcategories.map((subcategory) => subcategory.name),
  }));
}

export function parseSubcategoryCsv(value: unknown) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function validateCategorySelection(category: unknown, subcategory: unknown) {
  const categoryName = String(category ?? "").trim();
  if (!categoryName) {
    return { ok: false as const, error: "Category is required." };
  }

  const taxonomy = await getCategoryTaxonomy();
  const categoryRow = taxonomy.find((item) => item.name === categoryName);
  if (!categoryRow) {
    return { ok: false as const, error: "Choose a valid category." };
  }

  const requestedSubcategories = parseSubcategoryCsv(subcategory);
  const invalidSubcategory = requestedSubcategories.find(
    (item) => !categoryRow.subcategories.includes(item),
  );
  if (invalidSubcategory) {
    return {
      ok: false as const,
      error: `"${invalidSubcategory}" is not valid for ${categoryName}.`,
    };
  }

  return {
    ok: true as const,
    category: categoryName,
    subcategory: requestedSubcategories.join(","),
  };
}
