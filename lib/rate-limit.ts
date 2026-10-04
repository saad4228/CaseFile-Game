import "server-only";
import { db } from "@/lib/db/prisma";
import { hasDatabase } from "@/lib/env";

export class RateLimitError extends Error {
  constructor(public retryAfterSec: number) {
    super("Too many requests");
  }
}

// In-memory fallback for demo mode (per server instance).
const memory = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window rate limit. Backed by Postgres when available so limits hold across
 * serverless instances; atomic via a single upsert.
 */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  if (!hasDatabase()) {
    const now = Date.now();
    const cur = memory.get(key);
    if (!cur || cur.resetAt < now) {
      memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
      return;
    }
    cur.count++;
    if (cur.count > limit) throw new RateLimitError(Math.ceil((cur.resetAt - now) / 1000));
    return;
  }
  const rows = await db().$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSec}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < now()
                       THEN now() + make_interval(secs => ${windowSec})
                       ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const row = rows[0];
  if (row && row.count > limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((new Date(row.resetAt).getTime() - Date.now()) / 1000)));
  }
}
