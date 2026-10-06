import { describe, expect, it } from "vitest";
import { requireBundle } from "@/lib/game-engine/cases.server";
import { buildPlayView, followLead, GameError, resistanceFor, sanitizeLocal } from "@/lib/game-engine/engine.server";
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
  /** An interview nobody has worked yet. */
  const fresh = () => ({ asked: new Set<string>(), triggered: new Set<string>(), presented: new Set<string>(), deflections: 0 });
  const ask = (id: string) => ({ suspectId: "sarah_vale", kind: "ASK" as const, ref: id });
  const show = { suspectId: "sarah_vale", kind: "PRESENT" as const, ref: "E-017" };

  it("presenting the garage footage makes Sarah revise her statement", () => {
    const have = new Set([...bundle.brief, "E-017"]);
    const outcome = resolvePresent(sarah, "E-017", have, fresh());
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
    const outcome = resolvePresent(sarah, "E-002", brief, fresh());
    expect(outcome.startsWith("deflect")).toBe(true);
  });

  it("reads how hard each suspect is to move from their hidden profile", () => {
    const of = (id: string) => resistanceFor(bundle, id);
    // The terrified friend folds first; the lawyered-up publisher holds out longest.
    expect(of("noah_grant")).toBeLessThan(of("sarah_vale"));
    expect(of("marcus_reed")).toBeGreaterThan(of("elena_cross"));
    for (const id of Object.keys(bundle.interviews)) expect(of(id)).toBeGreaterThan(0);
  });

  it("a composed suspect holds the line until she has been worked", () => {
    const have = new Set([...bundle.brief, "E-017"]);
    const resists = resistanceFor(bundle, "sarah_vale");

    // Walking in and slamming the record down: she feels it and gives up nothing.
    const cold = runInterview(sarah, [show], have, bundle.evidenceById, resists);
    expect(cold.unlocked.size).toBe(0);
    expect(cold.triggered.size).toBe(0);

    // The same record, once her own account is on the table.
    const asks = sarah.questions.slice(0, resists).map((q) => ask(q.id));
    const worked = runInterview(sarah, [...asks, show], have, bundle.evidenceById, resists);
    expect([...worked.unlocked]).toContain("E-031");
  });

  it("holding the line doesn't spend the record", () => {
    const have = new Set([...bundle.brief, "E-017"]);
    const resists = resistanceFor(bundle, "sarah_vale");
    const asks = sarah.questions.slice(0, resists).map((q) => ask(q.id));
    // Shown too early, then again after the questions — the second time has to land.
    const run = runInterview(sarah, [show, ...asks, show], have, bundle.evidenceById, resists);
    expect([...run.unlocked]).toContain("E-031");
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
