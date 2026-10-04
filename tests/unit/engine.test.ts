import { describe, expect, it } from "vitest";
import { requireBundle } from "@/lib/game-engine/cases.server";
import { buildPlayView, followLead, GameError, sanitizeLocal } from "@/lib/game-engine/engine.server";
import { resolvePresent, runInterview } from "@/lib/game-engine/interview";
import type { InterviewAction } from "@/lib/game-engine/types";

const bundle = requireBundle("047");
const brief = new Set(bundle.brief);

describe("single-device anti-forgery", () => {
  it("drops records only an interview can reveal when no interview happened", () => {
    const forged = ["E-031", "E-032", "E-033", "E-034"]; // revised statements
    const { have } = sanitizeLocal(bundle, [...bundle.brief, ...forged], []);
    for (const id of forged) expect(have.has(id)).toBe(false);
  });

  it("drops unknown ids and records with no path from what was claimed", () => {
    const { have } = sanitizeLocal(bundle, [...bundle.brief, "E-999", "../etc"], []);
    expect([...have].sort()).toEqual([...bundle.brief].sort());
  });

  it("accepts records a lead legitimately reveals", () => {
    const lead = bundle.leads.find((l) => l.requires.every((r) => brief.has(r)))!;
    const { have, followed } = sanitizeLocal(bundle, [...bundle.brief, ...lead.unlocks], []);
    for (const id of lead.unlocks) expect(have.has(id)).toBe(true);
    expect(followed.has(lead.id)).toBe(true);
  });

  it("ignores forged interview actions for records the player never held", () => {
    const forged: InterviewAction[] = [{ suspectId: "elena_cross", kind: "PRESENT", ref: "E-018", outcome: "ec-r-rawlog" }];
    const { have } = sanitizeLocal(bundle, [...bundle.brief, "E-034"], forged);
    expect(have.has("E-034")).toBe(false);
  });

  it("drops junk in place of actions", () => {
    expect(sanitizeLocal(bundle, "nope", [{ kind: "DROP" }, null, 7]).actions).toEqual([]);
  });
});

describe("leads", () => {
  it("refuses unknown, repeated or locked leads", () => {
    expect(() => followLead(bundle, "L-99", brief, new Set(), brief)).toThrow(GameError);
    const open = bundle.leads.find((l) => l.requires.every((r) => brief.has(r)))!;
    expect(() => followLead(bundle, open.id, brief, new Set([open.id]), brief)).toThrow(GameError);
    const locked = bundle.leads.find((l) => !l.requires.some((r) => brief.has(r)))!;
    expect(() => followLead(bundle, locked.id, brief, new Set(), brief)).toThrow(GameError);
  });
});

describe("interviews", () => {
  const sarah = bundle.interviews.sarah_vale;

  it("presenting the garage footage makes Sarah revise her statement", () => {
    const have = new Set([...bundle.brief, "E-017"]);
    const outcome = resolvePresent(sarah, "E-017", have, { triggered: new Set(), presented: new Set(), deflections: 0 });
    expect(outcome).toBe("sv-r-garage");
    const run = runInterview(sarah, [{ suspectId: "sarah_vale", kind: "PRESENT", ref: "E-017", outcome }], have, bundle.evidenceById);
    expect([...run.unlocked]).toContain("E-031");
  });

  it("a record the asker doesn't hold unlocks nothing", () => {
    const run = runInterview(
      sarah,
      [{ suspectId: "sarah_vale", kind: "PRESENT", ref: "E-017", outcome: "sv-r-garage" }],
      brief,
      bundle.evidenceById,
    );
    expect(run.unlocked.size).toBe(0);
  });

  it("irrelevant records get a deflection", () => {
    const outcome = resolvePresent(sarah, "E-002", brief, { triggered: new Set(), presented: new Set(), deflections: 0 });
    expect(outcome.startsWith("deflect")).toBe(true);
  });
});

describe("play view", () => {
  it("never includes records outside the visible set", () => {
    const view = buildPlayView(bundle, { visible: brief, followed: [], actions: [] });
    expect(view.evidence.every((e) => brief.has(e.id))).toBe(true);
    expect(view.conflicts.every((c) => brief.has(c.a) && brief.has(c.b))).toBe(true);
    expect(JSON.stringify(view.leads)).not.toMatch(/E-\d{3}/); // leads never say what they unlock
  });
});
