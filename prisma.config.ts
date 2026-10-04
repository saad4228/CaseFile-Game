import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is optional so `prisma generate` works in builds without a database
// (CASEFILE then runs in single-device demo mode). Migrations need it — or DIRECT_URL,
// a non-pooled connection, when DATABASE_URL points at a transaction pooler.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
