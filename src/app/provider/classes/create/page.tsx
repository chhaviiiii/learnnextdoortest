import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateClassWizard } from "./CreateClassWizard";

export default async function CreateClassPage() {
  const { provider } = await requireProvider();
  const instructors = await prisma.instructor.findMany({
    where: { providerId: provider.id },
    orderBy: { name: "asc" },
  });
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
        />
      </div>
    </div>
  );
}
