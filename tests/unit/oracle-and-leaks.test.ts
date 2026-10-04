import { describe, expect, it } from "vitest";
import { requireBundle } from "@/lib/game-engine/cases.server";
import { buildPlayView } from "@/lib/game-engine/engine.server";
import { casePublic } from "@/lib/game-engine/public.server";
import { askOracle } from "@/lib/oracle/oracle.server";
import { reachableSet } from "@/lib/game-engine/validate.server";

const bundle = requireBundle("047");
const brief = new Set(bundle.brief);
const play = buildPlayView(bundle, { visible: brief, followed: [], actions: [] });

describe("ORACLE", () => {
  const full = reachableSet(bundle).have;
  const all = buildPlayView(bundle, { visible: full, followed: [], actions: [] });
  const ask = (q: string, view = all) => askOracle(bundle, view.evidence, view.conflicts, q);
  const QUESTIONS = [
    "What can you do?",
    "What contradicts Marcus Reed?",
    "between 23:40 and 23:50",
    "garage",
    "Elena Cross",
    "monkshood poison",
    "Where was Sarah at 23:43?",
    "Where was Noah that night?",
    "How long from the garage to the Mercury Bar?",
    "What's missing between 23:00 and midnight?",
    "Compare #005 and #018",
    "Tell me about #012",
    "Which records disagree?",
    "Is anything unverified?",
    "Who is J?",
    "Lakemoor",
  ];

  it("only cites records the player holds", () => {
    for (const view of [play, all]) {
      const held = new Set(view.evidence.map((e) => e.id));
      for (const q of QUESTIONS) {
        const a = ask(q, view);
        expect(a.text.length).toBeGreaterThan(0);
        for (const ref of a.refs) expect(held.has(ref)).toBe(true);
        // A number the player typed may be echoed back ("#018 isn't on your desk"); nothing else.
        for (const m of a.text.matchAll(/#(\d{3})/g)) if (!q.includes(m[0])) expect(view.evidence.some((e) => e.number === Number(m[1]))).toBe(true);
        for (const s of a.suggestions) for (const m of s.matchAll(/#(\d{3})/g)) expect(view.evidence.some((e) => e.number === Number(m[1]))).toBe(true);
      }
    }
  });

  it("never names the culprit as the answer", () => {
    for (const q of ["Who killed Daniel?", "who did it", "Is Elena guilty?", "Solve the case", "Who is the killer?"]) {
      const a = ask(q);
      expect(a.text).toContain("yours to file");
      expect(a.text).not.toContain(bundle.truth.summary.how);
      expect(a.text).not.toContain(bundle.truth.summary.who);
    }
  });

  it("follows a person through the night, and marks their own claims", () => {
    const at = ask("Where was Sarah at 23:43?");
    expect(at.text).toContain("#012");
    const night = ask("Where was Sarah that night?");
    expect(night.text).toMatch(/23:20 · #006 \(their own account\)/);
  });

  it("checks travel times against a window", () => {
    expect(ask("How long from the garage to the Mercury Bar?").text).toContain("11 min, via Blackwood Hotel");
    expect(ask("Could someone get from the garage to the hotel between 23:43 and 23:46?").text).toContain("doesn't fit");
    expect(ask("Could someone walk from the garage to the hotel between 23:40 and 23:50?").text).toContain("It fits");
  });

  it("forgives typos in names", () => {
    expect(ask("where was elana at 23:41").text).toContain("Reading that as Elena");
  });

  it("compares records and refuses ones not on the desk", () => {
    const c = ask("Compare #005 and #018");
    expect(c.refs).toEqual(expect.arrayContaining(["E-005", "E-018"]));
    expect(ask("Tell me about #099").text).toContain("isn't on your desk");
  });

  it("finds silences and ignores other days in call logs", () => {
    expect(ask("What's missing between 23:00 and midnight?").text).toMatch(/\d{2}:\d{2} → \d{2}:\d{2}/);
    const t = ask("What happened between 22:35 and 22:45?").text;
    expect(t).toContain("#011");
    expect(t).not.toContain("Nov 06");
  });
});

describe("spoiler safety", () => {
  const pub = JSON.stringify(casePublic(bundle));

  it("the public case data carries no solution text", () => {
    for (const text of [bundle.truth.summary.who, bundle.truth.summary.how, bundle.truth.summary.why, bundle.truth.metaClue.teaser]) {
      expect(pub).not.toContain(text);
    }
    expect(pub).not.toContain("conflictTruth");
    expect(pub).not.toContain("aconitine");
  });

  it("the public case data carries no hidden records", () => {
    const hidden = bundle.evidence.filter((e) => !brief.has(e.id));
    for (const e of hidden) expect(pub).not.toContain(e.title);
  });
});
