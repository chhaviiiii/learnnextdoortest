import { requireProvider } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCategoryTaxonomy } from "@/lib/taxonomy";
import { CreateClassWizard } from "./CreateClassWizard";

export default async function CreateClassPage() {
  const { provider } = await requireProvider();

  // KYC gate: providers must have submitted documents (PENDING or VERIFIED) to create classes.
  // NOT_UPLOADED or REJECTED providers are blocked until they upload valid documents.
  if (provider.kycStatus === "NOT_UPLOADED" || provider.kycStatus === "REJECTED") {
    redirect("/provider/account?kyc=required");
  }
  const [instructors, taxonomy] = await Promise.all([
    prisma.instructor.findMany({
      where: { providerId: provider.id },
      orderBy: { name: "asc" },
    }),
    getCategoryTaxonomy(),
  ]);
  return (
    <div className="max-w-4xl">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Create a class</h1>
        <p className="mt-1 text-sm text-ink-500">
          Fill in 4 quick steps. You can edit any of this later.
        </p>
      </header>
      <div className="mt-8">
        <CreateClassWizard
          instructors={instructors.map((i) => ({ id: i.id, name: i.name }))}
          taxonomy={taxonomy.map((item) => ({
            name: item.name,
            subcategories: item.subcategories,
          }))}
        />
      </div>
    </div>
  );
}
