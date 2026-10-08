import { describe, expect, it } from "vitest";
import { nextStep, type HintInput } from "@/lib/game-engine/hint";
import { initialShared } from "@/lib/game-engine/state";
import type { Evidence, InterviewView, LeadView, Suspect } from "@/lib/game-engine/types";

const record = (id: string, title = id): Evidence =>
  ({ id, number: 1, title, category: "DOCUMENT", source: "", time: null, location: null,
     reliability: "VERIFIED", summary: "", body: { kind: "document", lines: [] },
     suspects: [], locations: [], related: [], role: "DETECTIVE" }) as unknown as Evidence;

const person = (id: string, name: string) => ({ id, name }) as unknown as Suspect;
const lead = (id: string): LeadView => ({ id, label: id, detail: "" });
const talked: InterviewView = { transcript: [{ key: "open", kind: "OPEN", prompt: "", lines: [] }], questions: [] };

/** A player who has done everything the ladder asks, so each test can undo one rung. */
function done(): HintInput {
  const shared = initialShared();
  shared.board.nodes = [{ id: "n1", kind: "note", x: 0, y: 0 }];
  shared.board.edges = [{ id: "e1", source: "n1", target: "n1", kind: "ASSOCIATED_WITH" }];
  shared.theories = [{ id: "t1", title: "x", suspect: "a", claim: "culprit", assumptions: [], createdAt: 0 }];
  shared.verdict = { ...shared.verdict, who: "a", how: "b", when: "c", where: "d", why: "e" };
  for (const slot of ["motive", "opportunity", "means"] as const) shared.verdict.proof[slot] = ["E-1", "E-2"];
  return {
    evidence: [record("E-1")],
    seen: ["E-1"],
    leads: [],
    conflicts: [],
    conflictMarks: {},
    interviews: { a: { ...talked, transcript: [...talked.transcript, { key: "p", kind: "PRESENT", prompt: "", lines: [] }] } },
    suspects: [person("a", "Sarah Vale")],
    shared,
  };
}

describe("nextStep", () => {
  it("sends you to an unread record before anything else", () => {
    const input: HintInput = { ...done(), seen: [], leads: [lead("L-1")] };
    const hint = nextStep(input);
    expect(hint.target).toEqual({ kind: "record", id: "E-1" });
  });

  it("prefers an open lead once everything is read", () => {
    const input: HintInput = { ...done(), leads: [lead("L-1")] };
    expect(nextStep(input).target).toEqual({ kind: "desk", tab: "leads" });
  });

  it("names a suspect who has never been questioned", () => {
    const input = { ...done(), interviews: { a: talked } };
    const hint = nextStep(input);
    expect(hint.step).toContain("Sarah Vale");
    expect(hint.target).toEqual({ kind: "suspect", id: "a" });
  });

  it("asks you to press someone you have only talked to", () => {
    const input = done();
    input.interviews = { a: { ...talked, transcript: [...talked.transcript, { key: "q", kind: "ASK", prompt: "", lines: [] }] } };
    expect(nextStep(input).step).toContain("Show Sarah Vale");
  });

  it("raises an unsettled conflict before the board", () => {
    const input = { ...done(), conflicts: [{ id: "C-1" }], conflictMarks: {} };
    expect(nextStep(input).target).toEqual({ kind: "desk", tab: "conflicts" });
  });

  it("falls through to the board, then theories, then the verdict", () => {
    const empty = done();
    empty.shared.board.nodes = [];
    expect(nextStep(empty).target).toEqual({ kind: "view", view: "board" });

    const noTheory = done();
    noTheory.shared.theories = [];
    expect(nextStep(noTheory).target).toEqual({ kind: "view", view: "theories" });

    const blank = done();
    blank.shared.verdict = { ...blank.shared.verdict, why: null };
    expect(nextStep(blank).target).toEqual({ kind: "view", view: "verdict" });
  });

  it("says you are ready once the verdict is answered and backed up", () => {
    expect(nextStep(done()).step).toBe("You're ready to file");
  });

  it("never mentions the culprit", () => {
    for (const input of [done(), { ...done(), seen: [] }, { ...done(), interviews: { a: talked } }]) {
      const hint = nextStep(input as HintInput);
      expect(`${hint.step} ${hint.why}`).not.toMatch(/killed|culprit|guilty|murderer/i);
    }
  });
});
