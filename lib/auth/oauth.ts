import "server-only";
import { decodeIdToken, GitHub, Google, type OAuth2Tokens } from "arctic";
import { env, hasGitHub, hasGoogle } from "@/lib/env";
import type { OAuthIdentity } from "./users";

export type Provider = "google" | "github";

export const enabledProviders = (): Provider[] => [
  ...(hasGoogle() ? (["google"] as const) : []),
  ...(hasGitHub() ? (["github"] as const) : []),
];

const callbackUrl = (origin: string, provider: Provider) => `${origin}/api/auth/oauth/${provider}/callback`;

export function google(origin: string) {
  return new Google(env.googleClientId!, env.googleClientSecret!, callbackUrl(origin, "google"));
}

export function github(origin: string) {
  return new GitHub(env.githubClientId!, env.githubClientSecret!, callbackUrl(origin, "github"));
}

export function googleIdentity(tokens: OAuth2Tokens): OAuthIdentity {
  const claims = decodeIdToken(tokens.idToken()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  return {
    provider: "google",
    providerAccountId: claims.sub,
    email: claims.email ?? null,
    emailVerified: Boolean(claims.email_verified),
    name: claims.name ?? null,
    image: claims.picture ?? null,
  };
}

export async function githubIdentity(tokens: OAuth2Tokens): Promise<OAuthIdentity> {
  const headers = {
    Authorization: `Bearer ${tokens.accessToken()}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "casefile",
  };
  const userRes = await fetch("https://api.github.com/user", { headers });
  if (!userRes.ok) throw new Error(`GitHub user lookup failed: ${userRes.status}`);
  const user = (await userRes.json()) as { id: number; login: string; name: string | null; avatar_url: string | null };

  let email: string | null = null;
  let verified = false;
  const emailRes = await fetch("https://api.github.com/user/emails", { headers });
  if (emailRes.ok) {
    const emails = (await emailRes.json()) as { email: string; primary: boolean; verified: boolean }[];
    const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
    if (primary) {
      email = primary.email;
      verified = true;
    }
  }
  return {
    provider: "github",
    providerAccountId: String(user.id),
    email,
    emailVerified: verified,
    name: user.name ?? user.login,
    image: user.avatar_url,
  };
}
