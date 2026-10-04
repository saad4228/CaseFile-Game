// Runs `prisma migrate deploy` during the build when a database is configured.
// Without DATABASE_URL the app builds in single-device demo mode and this is a no-op.
import { execSync } from "node:child_process";
import "dotenv/config";

if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  console.log("[casefile] DATABASE_URL not set — building in demo mode (no accounts or rooms).");
} else if (process.env.SKIP_MIGRATIONS === "1") {
  console.log("[casefile] SKIP_MIGRATIONS=1 — not applying migrations.");
} else {
  console.log("[casefile] Applying database migrations…");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
