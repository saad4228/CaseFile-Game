import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";
import { PrismaClient } from "./generated/client";

// One client per server process (and per hot reload in development).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  if (!env.databaseUrl) throw new Error("DATABASE_URL is not configured");
  const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
    // Serverless-friendly: keep the pool small; use a pooled URL in production.
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  });
  return new PrismaClient({ adapter });
}

export function db(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = create();
  return globalForPrisma.prisma;
}

export type { Prisma } from "./generated/client";
