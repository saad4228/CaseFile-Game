import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db/prisma";
import { env, hasDatabase } from "@/lib/env";

export const SESSION_COOKIE = "casefile_session";
const SESSION_DAYS = 60;
const RENEW_WHEN_DAYS_LEFT = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export interface CurrentUser {
  id: string;
  codename: string;
  email: string | null;
  isGuest: boolean;
  isAdmin: boolean;
  image: string | null;
}

/** Create a session for the user and set the cookie (server actions / route handlers only). */
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const h = await headers();
  await db().authSession.create({
    data: {
      tokenHash: sha256(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000),
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && hasDatabase()) {
    await db().authSession.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!hasDatabase()) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const session = await db().authSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db().authSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.expiresAt.getTime() - Date.now() < RENEW_WHEN_DAYS_LEFT * 86400_000) {
    await db()
      .authSession.update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000) },
      })
      .catch(() => {});
  }
  const u = session.user;
  return {
    id: u.id,
    codename: u.codename,
    email: u.email,
    isGuest: u.isGuest,
    isAdmin: u.role === "ADMIN" || Boolean(u.email && env.adminEmails.includes(u.email.toLowerCase())),
    image: u.image,
  };
});

/** Absolute app origin for OAuth redirects and invite links. */
export async function appOrigin() {
  if (env.appUrl) return env.appUrl;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Only allow same-site relative redirects. */
export function safeNext(next: unknown, fallback = "/archive") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next.slice(0, 300);
}
