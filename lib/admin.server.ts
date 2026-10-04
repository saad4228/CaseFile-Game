import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasDatabase } from "@/lib/env";

/** The signed-in admin, or a 404 — the admin area doesn't announce itself to anyone else. */
export async function requireAdmin() {
  await connection();
  if (!hasDatabase()) notFound();
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();
  return user;
}

/** Page title for an admin route: the real one for admins, the 404's for everyone else. */
export async function adminTitle(title: string) {
  if (!hasDatabase()) return "No such file";
  const user = await getCurrentUser();
  return user?.isAdmin ? title : "No such file";
}

export async function adminOverview() {
  const weekAgo = new Date(Date.now() - 7 * 86400_000);
  const [registered, guests, active, lobby, resolvedWeek, results, solved, sessions, flags] = await Promise.all([
    db().user.count({ where: { isGuest: false } }),
    db().user.count({ where: { isGuest: true } }),
    db().gameSession.count({ where: { phase: "ACTIVE" } }),
    db().gameSession.count({ where: { phase: "LOBBY" } }),
    db().gameSession.count({ where: { phase: "RESOLVED", endedAt: { gte: weekAgo } } }),
    db().caseResult.aggregate({ _avg: { final: true, durationSec: true }, _count: { _all: true } }),
    db().caseResult.count({ where: { solved: true } }),
    db().gameSession.findMany({
      orderBy: { lastActivityAt: "desc" },
      take: 40,
      select: {
        code: true,
        caseId: true,
        mode: true,
        phase: true,
        createdAt: true,
        lastActivityAt: true,
        _count: { select: { players: true, evidence: true, messages: true } },
        result: { select: { rank: true, final: true, solved: true } },
      },
    }),
    db().caseFile.findMany(),
  ]);
  return { registered, guests, active, lobby, resolvedWeek, results, solved, sessions, flags };
}
