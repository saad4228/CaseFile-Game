import "server-only";
import { NextResponse } from "next/server";
import { GameError } from "@/lib/game-engine/engine.server";
import { RateLimitError } from "@/lib/rate-limit";

/** Reject cross-site state-changing requests (defence in depth on top of SameSite cookies). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof GameError) return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof RateLimitError)
    return NextResponse.json(
      { error: "Slow down." },
      { status: 429, headers: { "Retry-After": String(e.retryAfterSec) } },
    );
  console.error(e);
  return NextResponse.json({ error: "Archive connection lost." }, { status: 500 });
}

/** Map thrown errors to a user-facing message for server actions. */
export function actionError(e: unknown): { error: string } {
  if (e instanceof GameError) return { error: e.message };
  if (e instanceof RateLimitError) return { error: `Slow down — try again in ${e.retryAfterSec}s.` };
  // Let Next.js control-flow errors (redirect, notFound) propagate.
  if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
  console.error(e);
  return { error: "Archive connection lost. Try again." };
}
