import "server-only";
import type { CaseBundle } from "@/lib/game-engine/cases.server";
import type { VerdictDraft } from "@/lib/game-engine/state";
import { VERDICT_FIELDS, type VerdictField } from "@/lib/game-engine/types";
import type { ResultView } from "@/lib/sessions/types";
import type { ScoreResult } from "./types";

/** The post-verdict reveal. Only ever built after a verdict has been filed. */
export function buildResolution(
  bundle: CaseBundle,
  verdict: VerdictDraft,
  score: ScoreResult,
  discovered: Set<string>,
  filedAt: Date,
  filedBy: string,
): ResultView {
  const { truth, verdictOptions, meta } = bundle;
  const label = (f: VerdictField, id: string | null) =>
    id ? { id, label: verdictOptions[f].find((o) => o.id === id)?.label ?? id } : null;

  const given = {} as ResultView["given"];
  const answers = {} as ResultView["truth"]["answers"];
  for (const f of VERDICT_FIELDS) {
    given[f] = label(f, verdict[f]);
    answers[f] = label(f, truth.answers[f])!;
  }
  const nameOf = (id: string) => bundle.suspects.find((s) => s.id === id)?.name ?? id;

  return {
    caseId: meta.id,
    number: meta.number,
    title: meta.title,
    filedAt: filedAt.getTime(),
    filedBy,
    score,
    given,
    truth: {
      answers,
      summary: truth.summary,
      sequence: truth.sequence,
      conflicts: bundle.conflicts.map((c) => ({
        id: c.id,
        number: c.number,
        prompt: c.prompt,
        explanation: truth.conflictTruth[c.id]?.explanation ?? "",
        implicates: nameOf(truth.conflictTruth[c.id]?.implicates ?? ""),
      })),
      redHerrings: truth.redHerrings.map((r) => ({ ...r, name: nameOf(r.suspect) })),
      falsified: Object.entries(truth.evidenceTruth).map(([id, actual]) => {
        const e = bundle.evidenceById.get(id)!;
        return { id, number: e.number, title: e.title, filed: e.reliability, actual: actual! };
      }),
      missedKey: truth.keyEvidence
        .filter((id) => !discovered.has(id))
        .map((id) => {
          const e = bundle.evidenceById.get(id)!;
          return { id, number: e.number, title: e.title };
        }),
      metaClue: { symbol: truth.metaClue.symbol, teaser: truth.metaClue.teaser, nextCase: truth.metaClue.nextCase },
    },
  };
}
