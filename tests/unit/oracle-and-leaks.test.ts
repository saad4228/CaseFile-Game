import { describe, expect, it } from "vitest";
import { requireBundle } from "@/lib/game-engine/cases.server";
import { buildPlayView } from "@/lib/game-engine/engine.server";
import { casePublic } from "@/lib/game-engine/public.server";
import { searchOracle } from "@/lib/oracle/oracle.server";

const bundle = requireBundle("047");
const brief = new Set(bundle.brief);
const play = buildPlayView(bundle, { visible: brief, followed: [], actions: [] });

describe("ORACLE record search", () => {
  it("only cites records the player holds", () => {
    for (const q of ["What contradicts Marcus Reed?", "between 23:40 and 23:50", "garage", "Elena Cross", "monkshood poison"]) {
      const a = searchOracle(bundle, play.evidence, play.conflicts, q);
      for (const ref of a.refs) expect(brief.has(ref)).toBe(true);
      for (const m of a.text.matchAll(/#(\d{3})/g)) {
        expect(play.evidence.some((e) => e.number === Number(m[1]))).toBe(true);
      }
    }
  });

  it("never names the culprit as the answer", () => {
    const a = searchOracle(bundle, play.evidence, play.conflicts, "Who killed Daniel?");
    expect(a.text.toLowerCase()).not.toContain("killed daniel");
    expect(a.text).not.toContain(bundle.truth.summary.how);
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
