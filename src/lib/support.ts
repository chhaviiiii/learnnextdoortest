import { prisma } from "@/lib/prisma";
import { DEFAULT_SUPPORT_CATEGORIES } from "@/lib/support-data";

let supportCategoriesSeeded = false;

export async function ensureSupportCategoriesSeeded() {
  if (supportCategoriesSeeded) return;

  const activeCount = await prisma.supportCategory.count({ where: { active: true } });
  if (activeCount >= DEFAULT_SUPPORT_CATEGORIES.length) {
    supportCategoriesSeeded = true;
    return;
  }

  for (const [displayOrder, name] of DEFAULT_SUPPORT_CATEGORIES.entries()) {
    await prisma.supportCategory.upsert({
      where: { name },
      update: { active: true, displayOrder },
      create: { name, displayOrder },
    });
  }

  supportCategoriesSeeded = true;
}

export async function getSupportCategories() {
  await ensureSupportCategoriesSeeded();
  const rows = await prisma.supportCategory.findMany({
    where: { active: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((row) => row.name);
}

export function getProviderSupportContact() {
  return {
    whatsapp: process.env.PROVIDER_SUPPORT_WHATSAPP || "+91 90000 00000",
    email: process.env.PROVIDER_SUPPORT_EMAIL || "support@learnnextdoor.in",
    helpCentreLabel: process.env.PROVIDER_SUPPORT_HELP_LABEL || "Open KB →",
  };
}
