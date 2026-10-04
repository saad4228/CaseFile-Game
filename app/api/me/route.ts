import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasDatabase } from "@/lib/env";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    {
      database: hasDatabase(),
      user: user && { id: user.id, codename: user.codename, isGuest: user.isGuest, isAdmin: user.isAdmin },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
