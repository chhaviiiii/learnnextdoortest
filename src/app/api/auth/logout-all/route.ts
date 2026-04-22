import { NextResponse } from "next/server";
import { destroyAllSessionsForCurrentUser } from "@/lib/auth";

export async function POST() {
  await destroyAllSessionsForCurrentUser();
  return NextResponse.json({ ok: true });
}
