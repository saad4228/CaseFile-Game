import "server-only";

// Server configuration. Everything is optional: with no DATABASE_URL, CASEFILE runs in
// single-device demo mode (no accounts, rooms or profiles).

const trim = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

export const env = {
  databaseUrl: trim(process.env.DATABASE_URL),
  appUrl: trim(process.env.APP_URL)?.replace(/\/$/, ""),
  googleClientId: trim(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: trim(process.env.GOOGLE_CLIENT_SECRET),
  githubClientId: trim(process.env.GITHUB_CLIENT_ID),
  githubClientSecret: trim(process.env.GITHUB_CLIENT_SECRET),
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
};

export const hasDatabase = () => Boolean(env.databaseUrl);
export const hasGoogle = () => Boolean(env.googleClientId && env.googleClientSecret);
export const hasGitHub = () => Boolean(env.githubClientId && env.githubClientSecret);
