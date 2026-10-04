"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cleanCodename } from "@/lib/auth/codename";
import { endSession, getCurrentUser, safeNext, startSession } from "@/lib/auth/session";
import { AuthError, createGuest, login, register } from "@/lib/auth/users";
import { db } from "@/lib/db/prisma";
import { hasDatabase } from "@/lib/env";
import { rateLimit, RateLimitError } from "@/lib/rate-limit";

export interface AuthFormState {
  error?: string;
  ok?: string;
  /** Echoed back so the form keeps what was typed (React resets fields after an action). */
  email?: string;
  codename?: string;
}

const ip = async () => (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

async function guard<T>(fn: () => Promise<T>): Promise<T | AuthFormState> {
  if (!hasDatabase()) return { error: "Accounts need a database. This deployment is running in demo mode." };
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return { error: e.message };
    if (e instanceof RateLimitError) return { error: `Too many attempts. Try again in ${e.retryAfterSec}s.` };
    // redirect() throws a control-flow error that must propagate
    throw e;
  }
}

export async function signInAction(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));
  const res = await guard(async () => {
    await rateLimit(`login:${await ip()}`, 20, 300);
    await rateLimit(`login:${email.toLowerCase()}`, 8, 300);
    const user = await login(email, password);
    await startSession(user.id);
    return null;
  });
  if (res) return { ...res, email: email.slice(0, 254) };
  redirect(next);
}

export async function registerAction(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const next = safeNext(form.get("next"));
  const rawCodename = String(form.get("codename") ?? "").slice(0, 24);
  const rawEmail = String(form.get("email") ?? "").slice(0, 254);
  const codename = cleanCodename(rawCodename);
  if (!codename) return { error: "Choose a codename of 2–24 letters, numbers or spaces.", email: rawEmail, codename: rawCodename };
  const res = await guard(async () => {
    await rateLimit(`register:${await ip()}`, 10, 3600);
    const current = await getCurrentUser();
    const user = await register(
      { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? ""), codename },
      current?.isGuest ? current.id : undefined,
    );
    if (!current || current.id !== user.id) await startSession(user.id);
    return null;
  });
  if (res) return { ...res, email: rawEmail, codename: rawCodename };
  redirect(next);
}

export async function guestAction(form: FormData) {
  const next = safeNext(form.get("next"));
  if (!hasDatabase()) redirect(next);
  const current = await getCurrentUser();
  if (!current) {
    await rateLimit(`guest:${await ip()}`, 30, 3600).catch(() => {
      redirect("/login?error=" + encodeURIComponent("Too many new guests from this network. Try again later."));
    });
    const guest = await createGuest();
    await startSession(guest.id);
  }
  redirect(next);
}

export async function signOutAction() {
  await endSession();
  redirect("/");
}

export async function updateCodenameAction(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const raw = String(form.get("codename") ?? "");
  const codename = cleanCodename(raw);
  if (!codename) return { error: "Choose a codename of 2–24 letters, numbers or spaces.", codename: raw.slice(0, 24) };
  await db().user.update({ where: { id: user.id }, data: { codename } });
  revalidatePath("/profile");
  return { ok: "Codename updated.", codename };
}
