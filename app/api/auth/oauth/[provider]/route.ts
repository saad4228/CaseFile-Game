import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { enabledProviders, github, google, type Provider } from "@/lib/auth/oauth";
import { appOrigin, safeNext } from "@/lib/auth/session";
import { env } from "@/lib/env";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProduction,
  path: "/",
  maxAge: 600,
};

export async function GET(req: Request, ctx: RouteContext<"/api/auth/oauth/[provider]">) {
  const { provider } = await ctx.params;
  if (!enabledProviders().includes(provider as Provider)) {
    return NextResponse.redirect(new URL("/login?error=provider", req.url));
  }
  const origin = await appOrigin();
  const state = generateState();
  const jar = await cookies();
  jar.set("oauth_state", state, COOKIE_OPTS);
  jar.set("oauth_next", safeNext(new URL(req.url).searchParams.get("next")), COOKIE_OPTS);

  let url: URL;
  if (provider === "google") {
    const verifier = generateCodeVerifier();
    jar.set("oauth_verifier", verifier, COOKIE_OPTS);
    url = google(origin).createAuthorizationURL(state, verifier, ["openid", "profile", "email"]);
  } else {
    url = github(origin).createAuthorizationURL(state, ["read:user", "user:email"]);
  }
  return NextResponse.redirect(url);
}
