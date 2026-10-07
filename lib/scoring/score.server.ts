import "server-only";
import type { AchievementKey } from "@/lib/achievements";
import { WEIGHTS, type ScoreBreakdown, type ScoreResult } from "./types";
import type { CaseBundle } from "@/lib/game-engine/cases.server";
import type { SharedState } from "@/lib/game-engine/state";
import type { EdgeKind, VerdictField } from "@/lib/game-engine/types";
import { PROOF_SLOTS, VERDICT_FIELDS } from "@/lib/game-engine/types";

// Server-authoritative scoring. Never trust a client-sent score; only the verdict, the
// board and what was discovered go in.

export interface ScoreInput {
  shared: SharedState;
  /** Everything discovered by the team. */
  discovered: Set<string>;
  followedLeads: string[];
  interviewUnlocks: Set<string>;
  durationSec: number;
  budgetMin: number;
  mode: "LOCAL" | "SOLO" | "TEAM";
}


const POINTS: Record<VerdictField, number> = { who: 40, how: 15, when: 15, where: 10, why: 20 };
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const TEMPORAL: EdgeKind[] = ["OCCURRED_BEFORE", "OCCURRED_AFTER"];

/** Judge each board connection against the truth's relation table. */
export function judgeEdges(bundle: CaseBundle, shared: SharedState) {
  const { truth } = bundle;
  const token = new Map<string, string>();
  for (const n of shared.board.nodes) {
    if (n.kind === "evidence" && n.ref) token.set(n.id, n.ref);
    if (n.kind === "suspect" && n.ref) token.set(n.id, `suspect:${n.ref}`);
  }
  const edges: Record<string, "correct" | "wrong" | "neutral"> = {};
  let correct = 0;
  let wrong = 0;
  let neutral = 0;
  const innocent = new Set(bundle.suspects.map((s) => s.id).filter((id) => id !== truth.culprit && id !== "j"));

  for (const e of shared.board.edges) {
    const a = token.get(e.source);
    const b = token.get(e.target);
    let verdict: "correct" | "wrong" | "neutral" = "neutral";
    if (a && b) {
      const forward = truth.relations.find((r) => r.a === a && r.b === b);
      const backward = truth.relations.find((r) => r.a === b && r.b === a);
      const rel = forward ?? backward;
      if (rel) {
        let kind = e.kind;
        // Temporal edges read the other way round when drawn backwards.
        if (!forward && TEMPORAL.includes(kind)) kind = kind === "OCCURRED_BEFORE" ? "OCCURRED_AFTER" : "OCCURRED_BEFORE";
        if (rel.kinds.includes(kind)) verdict = "correct";
        else if (rel.nature === "conflict" && (kind === "SUPPORTS" || kind === "CAUSES")) verdict = "wrong";
        else if (rel.nature === "support" && (kind === "CONTRADICTS" || kind === "DISPROVES")) verdict = "wrong";
        else if (rel.nature === "clears" && (kind === "SUPPORTS" || kind === "SUSPECTED")) verdict = "wrong";
      } else {
        const suspects = [a, b].filter((t) => t.startsWith("suspect:")).map((t) => t.slice(8));
        if (e.kind === "SUSPECTED" && suspects.some((s) => innocent.has(s))) verdict = "wrong";
        else if (e.kind === "SUSPECTED" && suspects.includes(truth.culprit)) verdict = "correct";
        else if (e.kind === "DISPROVES" && suspects.includes(truth.culprit)) verdict = "wrong";
      }
    }
    edges[e.id] = verdict;
    if (verdict === "correct") correct++;
    else if (verdict === "wrong") wrong++;
    else neutral++;
  }
  return { correct, wrong, neutral, edges };
}

export function scoreVerdict(bundle: CaseBundle, input: ScoreInput): ScoreResult {
  const { truth } = bundle;
  const v = input.shared.verdict;

  // Deduction
  const answers = {} as ScoreResult["details"]["answers"];
  let deduction = 0;
  for (const f of VERDICT_FIELDS) {
    const given = v[f];
    const correct = given === truth.answers[f];
    const credit = correct ? 1 : given ? (truth.partial[f]?.[given] ?? 0) : 0;
    deduction += POINTS[f] * credit;
    answers[f] = { given, correct, credit };
  }

  // Proof — only records the team actually holds count.
  const proof = {} as ScoreResult["details"]["proof"];
  let proofPts = 0;
  let provenSlots = 0;
  for (const slot of PROOF_SLOTS) {
    const rule = truth.proof[slot];
    const attached = v.proof[slot]
      .filter((id) => input.discovered.has(id))
      .map((id) => ({ id, accepted: rule.accepted.includes(id) }));
    const n = new Set(attached.filter((x) => x.accepted).map((x) => x.id)).size;
    const misleading = attached.filter((x) => truth.misleadingProof.includes(x.id)).length;
    const proven = n >= rule.min;
    const points = Math.max(0, (proven ? 20 : n === 1 ? 10 : 0) - misleading * 5);
    if (proven) provenSlots++;
    proofPts += points;
    proof[slot] = { attached, proven, points };
  }

  // Evidence
  const found = truth.keyEvidence.filter((id) => input.discovered.has(id)).length;
  const evidence = (found / truth.keyEvidence.length) * 100;

  // Logic
  const logic = judgeEdges(bundle, input.shared);
  const culpritTheory = input.shared.theories.some(
    (t) =>
      !t.archived &&
      t.suspect === truth.culprit &&
      t.assumptions.filter((a) => a.status === "supported" && a.evidence.length > 0).length >= 3,
  );
  const graded = logic.correct + logic.wrong;
  // Never score a player below the 35 they'd get for leaving the board empty: drawing a
  // thread and reading it wrong is still reasoning, and the board is the signature mechanic.
  // Eight sound connections was also more than a first-time player will ever find, with no
  // way of knowing which pairs the case even has an opinion about.
  const judged = graded === 0 ? 35 : 100 * (0.6 * (logic.correct / graded) + 0.4 * Math.min(1, logic.correct / 5));
  let logicScore = Math.max(35, judged);
  if (culpritTheory) logicScore += 10;

  // Contradictions. A conflict only surfaces once the team holds both of its records, so
  // judge them on the ones that actually reached the desk — scoring against all eleven
  // marked players down for pairs the game never showed them.
  const surfaced = bundle.conflicts.filter((x) => input.discovered.has(x.a) && input.discovered.has(x.b));
  const total = surfaced.length;
  let c = 0;
  let ex = 0;
  let ig = 0;
  for (const conflict of surfaced) {
    const mark = input.shared.conflictMarks[conflict.id];
    if (mark === "contradiction") c++;
    else if (mark === "explained") ex++;
    else if (mark === "ignored") ig++;
  }
  const contradictions = total === 0 ? 50 : ((c + ex * 0.5) / total) * 100;

  // Efficiency
  const relevant = input.followedLeads.filter((l) => truth.relevantLeads.includes(l)).length;
  const efficiency = input.followedLeads.length === 0 ? 50 : (relevant / input.followedLeads.length) * 100;

  // Time
  const minutes = input.durationSec / 60;
  const comfortable = input.budgetMin * 0.7;
  const time = clamp(100 - Math.max(0, minutes - comfortable) * 1.2, 30, 100);

  const scores: ScoreBreakdown = {
    deduction: Math.round(clamp(deduction)),
    evidence: Math.round(clamp(evidence)),
    logic: Math.round(clamp(logicScore)),
    contradictions: Math.round(clamp(contradictions)),
    efficiency: Math.round(clamp(efficiency)),
    proof: Math.round(clamp(proofPts)),
    time: Math.round(time),
  };
  const final = Math.round(
    (Object.keys(WEIGHTS) as (keyof ScoreBreakdown)[]).reduce((sum, k) => sum + scores[k] * WEIGHTS[k], 0),
  );
  // Name the right person, name the method, and hold two parts of it up with real records:
  // that is a solved case. Three slots asked a player to also guess which records the file
  // happens to accept, with no feedback to guide them, for the two they had least to go on.
  const solved = answers.who.correct && answers.how.correct && provenSlots >= 2;
  let rank: ScoreResult["rank"] = final >= 90 ? "S" : final >= 80 ? "A" : final >= 65 ? "B" : final >= 50 ? "C" : "D";
  if (!solved && (rank === "S" || rank === "A")) rank = "B";
  if (!answers.who.correct && rank === "B") rank = "C";

  const achievements: AchievementKey[] = [];
  const allEvidence = bundle.evidence.every((e) => input.discovered.has(e.id));
  const revised = ["E-031", "E-032", "E-033", "E-034"].every((id) => input.interviewUnlocks.has(id) || input.discovered.has(id));
  if (solved) achievements.push("case_closed");
  if (rank === "S") achievements.push("rank_s");
  if (c === total) achievements.push("contradiction_hunter");
  if (allEvidence) achievements.push("nothing_unread");
  if (solved && input.followedLeads.length <= 8) achievements.push("straight_line");
  if (solved && minutes < 35) achievements.push("before_the_rain_stops");
  if (solved && input.mode === "TEAM") achievements.push("partners");
  if (revised) achievements.push("pressure");
  if (input.discovered.has(truth.metaClue.seenIn)) achievements.push("the_ring");
  if (logic.correct >= 8 && logic.wrong === 0) achievements.push("red_thread");

  return {
    scores,
    final,
    rank,
    solved,
    details: {
      answers,
      proof,
      logic,
      contradictions: { contradiction: c, explained: ex, ignored: ig, total },
      efficiency: { followed: input.followedLeads.length, relevant },
      evidence: { found, total: truth.keyEvidence.length },
      durationSec: input.durationSec,
    },
    achievements,
  };
}
