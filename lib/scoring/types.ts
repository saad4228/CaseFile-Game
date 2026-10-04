import type { AchievementKey } from "@/lib/achievements";
import type { ProofSlot, VerdictField } from "@/lib/game-engine/types";

export interface ScoreBreakdown {
  deduction: number;
  evidence: number;
  logic: number;
  contradictions: number;
  efficiency: number;
  proof: number;
  time: number;
}

export interface ScoreResult {
  scores: ScoreBreakdown;
  final: number;
  rank: "S" | "A" | "B" | "C" | "D";
  solved: boolean;
  details: {
    answers: Record<VerdictField, { given: string | null; correct: boolean; credit: number }>;
    proof: Record<ProofSlot, { attached: { id: string; accepted: boolean }[]; proven: boolean; points: number }>;
    logic: { correct: number; wrong: number; neutral: number; edges: Record<string, "correct" | "wrong" | "neutral"> };
    contradictions: { contradiction: number; explained: number; ignored: number; total: number };
    efficiency: { followed: number; relevant: number };
    evidence: { found: number; total: number };
    durationSec: number;
  };
  achievements: AchievementKey[];
}

export const WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  deduction: 0.3,
  proof: 0.2,
  logic: 0.15,
  evidence: 0.1,
  contradictions: 0.1,
  efficiency: 0.075,
  time: 0.075,
};
