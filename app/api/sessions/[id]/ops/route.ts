import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { PersonalOpSchema, SharedOpSchema } from "@/lib/game-engine/state";
import { hasDatabase } from "@/lib/env";
import { errorResponse, sameOrigin } from "@/lib/http";
import { applyOps } from "@/lib/sessions/service.server";

const Body = z.object({
  shared: z.array(SharedOpSchema).max(100).default([]),
  personal: z.array(PersonalOpSchema).max(100).default([]),
});

export async function POST(req: Request, ctx: RouteContext<"/api/sessions/[id]/ops">) {
  if (!hasDatabase()) return NextResponse.json({ error: "No database" }, { status: 503 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { id } = await ctx.params;
  const raw = await req.text();
  if (raw.length > 200_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let parsed;
  try {
    parsed = Body.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "Invalid operations" }, { status: 400 });
  try {
    const res = await applyOps(id, user, parsed.data.shared, parsed.data.personal);
    return NextResponse.json(res);
  } catch (e) {
    return errorResponse(e);
  }
}
