import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasDatabase } from "@/lib/env";
import { errorResponse } from "@/lib/http";
import { syncSession } from "@/lib/sessions/service.server";

export async function GET(req: Request, ctx: RouteContext<"/api/sessions/[id]/sync">) {
  if (!hasDatabase()) return NextResponse.json({ error: "No database" }, { status: 503 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const v = Number(url.searchParams.get("v") ?? -1);
  const have = new Set((url.searchParams.get("have") ?? "").split(",").filter((x) => /^E-\d{3}$/.test(x)).slice(0, 200));
  try {
    const res = await syncSession(id, user, Number.isFinite(v) ? v : -1, have);
    return NextResponse.json(res, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
