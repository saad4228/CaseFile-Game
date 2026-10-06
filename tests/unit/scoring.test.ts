import { describe, expect, it } from "vitest";
import { requireBundle } from "@/lib/game-engine/cases.server";
import { applyShared, initialShared, type SharedState } from "@/lib/game-engine/state";
import { PROOF_SLOTS, VERDICT_FIELDS } from "@/lib/game-engine/types";
import { judgeEdges, scoreVerdict, type ScoreInput } from "@/lib/scoring/score.server";
import { reachableSet } from "@/lib/game-engine/validate.server";

const bundle = requireBundle("047");
const { truth } = bundle;
const everything = reachableSet(bundle).have;

function solvedState(): SharedState {
  const s = initialShared();
  for (const f of VERDICT_FIELDS) s.verdict[f] = truth.answers[f];
  for (const slot of PROOF_SLOTS) s.verdict.proof[slot] = truth.proof[slot].accepted.slice(0, truth.proof[slot].min);
  return s;
}

const input = (shared: SharedState, extra: Partial<ScoreInput> = {}): ScoreInput => ({
  shared,
  discovered: everything,
  followedLeads: truth.relevantLeads,
  interviewUnlocks: new Set(["E-031", "E-032", "E-033", "E-034"]),
  durationSec: 1800,
  budgetMin: 50,
  mode: "SOLO",
  ...extra,
});

describe("verdict scoring", () => {
  it("the right answers with proof solve the case", () => {
    const r = scoreVerdict(bundle, input(solvedState()));
    expect(r.solved).toBe(true);
    expect(r.final).toBeGreaterThan(60);
    expect(r.achievements).toContain("case_closed");
  });

  it("the wrong culprit never solves it", () => {
    const s = solvedState();
    s.verdict.who = "marcus_reed";
    const r = scoreVerdict(bundle, input(s));
    expect(r.solved).toBe(false);
  });

  it("the right culprit without proof doesn't solve it", () => {
    const s = solvedState();
    for (const slot of PROOF_SLOTS) s.verdict.proof[slot] = [];
    expect(scoreVerdict(bundle, input(s)).solved).toBe(false);
  });

  it("proof the team never found doesn't count", () => {
    const r = scoreVerdict(bundle, input(solvedState(), { discovered: new Set(bundle.brief) }));
    expect(r.solved).toBe(false);
  });

  it("closes the case on defensible proof, not only the neatest records", () => {
    // The player got every answer right and backed it with records a careful reader would
    // reach for: the scene photograph for the drink, the examiner's window and the last call
    // for the timeline, the staff gate log for identity. None is the tidiest possible choice,
    // and the player is never told which ones count — so these have to be accepted.
    const s = solvedState();
    s.verdict.proof = {
      motive: ["E-010"],
      opportunity: ["E-018", "E-019"],
      means: ["E-003", "E-023"],
      timeline: ["E-002", "E-004"],
      identity: ["E-027", "E-025"],
    };
    expect(scoreVerdict(bundle, input(s)).solved).toBe(true);
  });

  it("scores stay within 0–100", () => {
    const r = scoreVerdict(bundle, input(initialShared(), { durationSec: 999999 }));
    expect(r.final).toBeGreaterThanOrEqual(0);
    expect(r.final).toBeLessThanOrEqual(100);
    for (const v of Object.values(r.scores)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe("board logic", () => {
  const rel = truth.relations.find((r) => r.nature === "conflict" && !r.b.startsWith("suspect:"))!;
  const board = (kind: "CONTRADICTS" | "SUPPORTS") => {
    let s = initialShared();
    s = applyShared(s, { t: "board.add", node: { id: "a", kind: "evidence", ref: rel.a, x: 0, y: 0 } });
    s = applyShared(s, { t: "board.add", node: { id: "b", kind: "evidence", ref: rel.b, x: 0, y: 0 } });
    return applyShared(s, { t: "edge.add", edge: { id: "e", source: "a", target: "b", kind } });
  };

  it("credits a correct contradiction and penalises the opposite reading", () => {
    expect(judgeEdges(bundle, board("CONTRADICTS")).edges.e).toBe("correct");
    expect(judgeEdges(bundle, board("SUPPORTS")).edges.e).toBe("wrong");
  });

  it("judges the relation the same way when drawn backwards", () => {
    let s = board("CONTRADICTS");
    s = { ...s, board: { ...s.board, edges: [{ ...s.board.edges[0], source: "b", target: "a" }] } };
    expect(judgeEdges(bundle, s).edges.e).toBe("correct");
  });
});
