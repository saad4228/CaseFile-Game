"use client";

import { createContext, useContext } from "react";
import type { Evidence, Suspect } from "@/lib/game-engine/types";

// Everything the board's nodes and edges need to draw themselves, kept out of React Flow's
// own node data so it isn't copied onto every node.

export interface BoardCtx {
  evidence: Map<string, Evidence>;
  suspects: Map<string, Suspect>;
  unseen: Set<string>;
  readOnly: boolean;
  judged?: Record<string, "correct" | "wrong" | "neutral">;
  onOpen: (id: string) => void;
  editEdge: (id: string) => void;
}
export const BoardContext = createContext<BoardCtx | null>(null);
export const useBoard = () => useContext(BoardContext)!;

export type NodeData = { ref?: string; text?: string };
