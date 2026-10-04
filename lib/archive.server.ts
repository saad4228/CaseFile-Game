import "server-only";
import { db } from "@/lib/db/prisma";
import { getBundle } from "@/lib/game-engine/cases.server";
import type { CaseProgress } from "./archive-types";

/** Per-case progress for one player, plus teasers for files their solved cases point to. */
export async function archiveProgress(userId: string) {
  const rows = await db().casePlayer.findMany({
    where: { userId },
    select: {
      session: {
        select: { code: true, caseId: true, phase: true, result: { select: { solved: true, rank: true, final: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
    take: 100,
  });
  const progress: Record<string, CaseProgress> = {};
  const teasers: Record<string, string> = {};
  for (const { session: s } of rows) {
    const cur = progress[s.caseId];
    if (s.result) {
      const p: CaseProgress = { state: s.result.solved ? "SOLVED" : "CLOSED", rank: s.result.rank, score: s.result.final };
      const better = !cur || cur.state === "OPEN" || (p.state === "SOLVED" && cur.state !== "SOLVED") || (p.state === cur.state && (p.score ?? 0) > (cur.score ?? 0));
      if (better) progress[s.caseId] = p;
      if (s.result.solved) {
        const clue = getBundle(s.caseId)?.truth.metaClue;
        if (clue) teasers[clue.nextCase] = clue.teaser;
      }
    } else if (!cur) {
      progress[s.caseId] = { state: "OPEN", code: s.code };
    }
  }
  return { progress, teasers };
}
