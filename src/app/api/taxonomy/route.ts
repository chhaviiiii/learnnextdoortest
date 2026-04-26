import { NextResponse } from "next/server";
import { getCategoryTaxonomy } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await getCategoryTaxonomy();
  return NextResponse.json({ categories });
}
