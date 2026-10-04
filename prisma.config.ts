import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is optional so `prisma generate` works in builds without a database
// (CASEFILE then runs in single-device demo mode). Migrations need it.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
