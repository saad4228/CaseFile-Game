import type { AssumptionStatus } from "@/lib/game-engine/state";

// How a thing that would have to be true is marked, and what clicking it does next.

export const statusInfo: Record<AssumptionStatus, { mark: string; label: string; cls: string }> = {
  open: { mark: "○", label: "Not checked", cls: "text-[#4f4636]" },
  supported: { mark: "✓", label: "Backed up", cls: "text-[#3d5a3a]" },
  contradicted: { mark: "✗", label: "Records disagree", cls: "text-crimson-600" },
};
export const nextStatus: Record<AssumptionStatus, AssumptionStatus> = { open: "supported", supported: "contradicted", contradicted: "open" };
