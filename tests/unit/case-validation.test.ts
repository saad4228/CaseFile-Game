import { describe, expect, it } from "vitest";
import { bundleIds, requireBundle } from "@/lib/game-engine/cases.server";
import { validateCase } from "@/lib/game-engine/validate.server";

describe.each(bundleIds())("case %s", (caseId) => {
  const report = validateCase(requireBundle(caseId));

  it.each(report.checks.map((c) => [c.label, c] as const))("%s", (_label, check) => {
    expect(check.details).toEqual([]);
  });

  it("a perfect investigation earns a top rank", () => {
    expect(report.stats.reachable).toBe(report.stats.evidence);
    expect(["S", "A"]).toContain(report.stats.perfectRank);
  });
});
