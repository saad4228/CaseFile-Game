import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { randomCodename } from "./codename";
import { dummyVerify, hashPassword, verifyPassword } from "./password";

export class AuthError extends Error {}

const normEmail = (e: string) => e.trim().toLowerCase();
export const isValidEmail = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e) && e.length <= 254;

const roleFor = (email: string | null) => (email && env.adminEmails.includes(email.toLowerCase()) ? "ADMIN" : "PLAYER");

export async function createGuest() {
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return db().user.create({
    data: { codename: `GUEST ${suffix}`, isGuest: true, profile: { create: {} } },
  });
}

/** Register with email + password. A signed-in guest is upgraded in place, keeping progress. */
export async function register(input: { email: string; password: string; codename: string }, guestId?: string) {
  const email = normEmail(input.email);
  if (!isValidEmail(email)) throw new AuthError("That email address doesn't look right.");
  if (input.password.length < 8) throw new AuthError("Use at least 8 characters for your password.");
  if (input.password.length > 200) throw new AuthError("That password is too long.");
  const existing = await db().user.findUnique({ where: { email } });
  if (existing) throw new AuthError("A detective with that email is already on file. Sign in instead.");
  const passwordHash = await hashPassword(input.password);

  if (guestId) {
    const guest = await db().user.findUnique({ where: { id: guestId } });
    if (guest?.isGuest) {
      return db().user.update({
        where: { id: guestId },
        data: { email, passwordHash, codename: input.codename, isGuest: false, role: roleFor(email) },
      });
    }
  }
  return db().user.create({
    data: { email, passwordHash, codename: input.codename, role: roleFor(email), profile: { create: {} } },
  });
}

export async function login(emailRaw: string, password: string) {
  const email = normEmail(emailRaw);
  const user = await db().user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    await dummyVerify(password);
    throw new AuthError("That email and password don't match our records.");
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new AuthError("That email and password don't match our records.");
  }
  return user;
}

export interface OAuthIdentity {
  provider: "google" | "github";
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
}

/**
 * Resolve an OAuth sign-in to a user.
 * - Existing link → that user.
 * - Signed in (and not a guest) → link the provider to the current account.
 * - Verified email matching an account whose email is also verified → link.
 *   (Never auto-link to a password account with an unverified email: that would let
 *   whoever registered the address first take over the account.)
 * - Otherwise create a user — or upgrade the current guest in place.
 */
export async function resolveOAuth(identity: OAuthIdentity, current: { id: string; isGuest: boolean } | null) {
  const email = identity.email ? normEmail(identity.email) : null;
  const linked = await db().account.findUnique({
    where: { provider_providerAccountId: { provider: identity.provider, providerAccountId: identity.providerAccountId } },
    include: { user: true },
  });
  if (linked) {
    if (current && !current.isGuest && current.id !== linked.userId) {
      throw new AuthError("That sign-in is already connected to a different detective file.");
    }
    if (current?.isGuest && current.id !== linked.userId) await mergeGuestInto(current.id, linked.userId);
    return linked.user;
  }

  if (current && !current.isGuest) {
    await db().account.create({
      data: { provider: identity.provider, providerAccountId: identity.providerAccountId, userId: current.id },
    });
    return db().user.findUniqueOrThrow({ where: { id: current.id } });
  }

  if (email) {
    const byEmail = await db().user.findUnique({ where: { email } });
    if (byEmail) {
      if (!(identity.emailVerified && byEmail.emailVerified)) {
        throw new AuthError(
          "An account with this email already exists. Sign in with your password, then connect this provider from your profile.",
        );
      }
      await db().account.create({
        data: { provider: identity.provider, providerAccountId: identity.providerAccountId, userId: byEmail.id },
      });
      if (current?.isGuest) await mergeGuestInto(current.id, byEmail.id);
      return byEmail;
    }
  }

  const codename = (identity.name ?? "").replace(/[^\p{L}\p{N} .'_-]/gu, "").slice(0, 24).trim() || randomCodename();
  const data = {
    email,
    emailVerified: Boolean(email && identity.emailVerified),
    image: identity.image,
    isGuest: false,
    role: roleFor(email),
  };

  if (current?.isGuest) {
    return db().user.update({
      where: { id: current.id },
      data: {
        ...data,
        codename,
        accounts: { create: { provider: identity.provider, providerAccountId: identity.providerAccountId } },
      },
    });
  }
  return db().user.create({
    data: {
      ...data,
      codename,
      profile: { create: {} },
      accounts: { create: { provider: identity.provider, providerAccountId: identity.providerAccountId } },
    },
  });
}

/** Move a guest's sessions, messages, achievements and record onto another user, then delete the guest. */
export async function mergeGuestInto(guestId: string, targetId: string) {
  if (guestId === targetId) return;
  await db().$transaction(async (tx) => {
    const guest = await tx.user.findUnique({ where: { id: guestId }, include: { profile: true } });
    if (!guest?.isGuest) return;

    const guestPlayers = await tx.casePlayer.findMany({ where: { userId: guestId } });
    for (const p of guestPlayers) {
      const clash = await tx.casePlayer.findUnique({ where: { sessionId_userId: { sessionId: p.sessionId, userId: targetId } } });
      if (clash) await tx.casePlayer.delete({ where: { id: p.id } });
      else await tx.casePlayer.update({ where: { id: p.id }, data: { userId: targetId } });
    }
    await tx.gameSession.updateMany({ where: { hostId: guestId }, data: { hostId: targetId } });
    await tx.sessionEvidence.updateMany({ where: { holderId: guestId }, data: { holderId: targetId } });
    await tx.message.updateMany({ where: { userId: guestId }, data: { userId: targetId } });

    const owned = new Set((await tx.achievement.findMany({ where: { userId: targetId } })).map((a) => a.key));
    for (const a of await tx.achievement.findMany({ where: { userId: guestId } })) {
      if (owned.has(a.key)) await tx.achievement.delete({ where: { id: a.id } });
      else await tx.achievement.update({ where: { id: a.id }, data: { userId: targetId } });
    }

    if (guest.profile) {
      const p = guest.profile;
      await tx.detectiveProfile.upsert({
        where: { userId: targetId },
        create: { userId: targetId },
        update: {},
      });
      const t = await tx.detectiveProfile.findUniqueOrThrow({ where: { userId: targetId } });
      await tx.detectiveProfile.update({
        where: { userId: targetId },
        data: {
          casesSolved: t.casesSolved + p.casesSolved,
          casesFailed: t.casesFailed + p.casesFailed,
          bestScore: Math.max(t.bestScore, p.bestScore),
          totalScore: t.totalScore + p.totalScore,
          deductionTotal: t.deductionTotal + p.deductionTotal,
          evidenceTotal: t.evidenceTotal + p.evidenceTotal,
          logicTotal: t.logicTotal + p.logicTotal,
          contradictionTotal: t.contradictionTotal + p.contradictionTotal,
          totalSolveSeconds: t.totalSolveSeconds + p.totalSolveSeconds,
        },
      });
    }
    await tx.user.delete({ where: { id: guestId } });
  });
}
