import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { hasDatabase } from "@/lib/env";

/** Liveness and database check for load balancers, Docker and uptime monitors. */
export async function GET() {
  let database: "up" | "down" | "off" = "off";
  if (hasDatabase()) {
    try {
      await db().$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }
  }
  return NextResponse.json(
    { ok: database !== "down", database, mode: hasDatabase() ? "online" : "demo" },
    { status: database === "down" ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
