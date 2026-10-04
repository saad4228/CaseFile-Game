import type { EdgeKind } from "@/lib/game-engine/types";

// Every connection type differs in colour AND dash pattern AND carries a text label.
export const edgeKinds: Record<
  EdgeKind,
  { label: string; color: string; dash?: string; width: number; arrow?: "end" | "start" }
> = {
  SUPPORTS: { label: "Supports", color: "#d98a3a", width: 2.4 },
  CONTRADICTS: { label: "Contradicts", color: "#e7e2d8", dash: "9 6", width: 2.4 },
  CAUSES: { label: "Causes", color: "#f0ae55", width: 2.8, arrow: "end" },
  // The default thread is classic red rope.
  ASSOCIATED_WITH: { label: "Associated with", color: "#b3282a", width: 2.6 },
  OCCURRED_BEFORE: { label: "Occurred before", color: "#92a3b0", dash: "2 6", width: 2, arrow: "end" },
  OCCURRED_AFTER: { label: "Occurred after", color: "#92a3b0", dash: "2 6", width: 2, arrow: "start" },
  DISPROVES: { label: "Disproves", color: "#c24a3f", width: 3, arrow: "end" },
  SUSPECTED: { label: "Suspected", color: "#c24a3f", dash: "1 7", width: 2.4 },
};

export const edgeKindOrder: EdgeKind[] = [
  "SUPPORTS",
  "CONTRADICTS",
  "CAUSES",
  "ASSOCIATED_WITH",
  "OCCURRED_BEFORE",
  "OCCURRED_AFTER",
  "DISPROVES",
  "SUSPECTED",
];
