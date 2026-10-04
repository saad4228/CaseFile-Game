import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { enabledProviders, github, githubIdentity, google, googleIdentity, type Provider } from "@/lib/auth/oauth";
import { appOrigin, getCurrentUser, safeNext, startSession } from "@/lib/auth/session";
import { AuthError, resolveOAuth } from "@/lib/auth/users";
import { rateLimit, RateLimitError } from "@/lib/rate-limit";

export async function GET(req: Request, ctx: RouteContext<"/api/auth/oauth/[provider]/callback">) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(reason)}`, url.origin));

  if (!enabledProviders().includes(provider as Provider)) return fail("provider");

  const jar = await cookies();
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const storedState = jar.get("oauth_state")?.value;
  const verifier = jar.get("oauth_verifier")?.value;
  const next = safeNext(jar.get("oauth_next")?.value);
  jar.delete("oauth_state");
  jar.delete("oauth_verifier");
  jar.delete("oauth_next");

  if (!state || !code || !storedState || state !== storedState) return fail("state");

  try {
    await rateLimit(`oauth:${req.headers.get("x-forwarded-for") ?? "local"}`, 20, 60);
    const origin = await appOrigin();
    const identity =
      provider === "google"
        ? googleIdentity(await google(origin).validateAuthorizationCode(code, verifier ?? ""))
        : await githubIdentity(await github(origin).validateAuthorizationCode(code));
    const current = await getCurrentUser();
    const user = await resolveOAuth(identity, current);
    await startSession(user.id);
    return NextResponse.redirect(new URL(next, url.origin));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message);
    if (e instanceof RateLimitError) return fail("Too many attempts. Wait a minute and try again.");
    console.error("OAuth callback failed", e);
    return fail("The sign-in provider didn't answer. Try again.");
  }
}
