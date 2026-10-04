"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ConflictMark, EdgeKind } from "@/lib/game-engine/types";

// Player-side investigation state. Single-player milestone: persisted per case in
// localStorage. Moves into a server session (Postgres + Realtime) with multiplayer.

export type BoardNodeKind = "evidence" | "suspect" | "note" | "unknown" | "location";

export interface BoardNodeData {
  id: string;
  kind: BoardNodeKind;
  /** evidence / suspect / location id */
  ref?: string;
  text?: string;
  x: number;
  y: number;
}

export interface BoardEdgeData {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
}

export interface CustomEvent {
  id: string;
  time: string;
  label: string;
}

export interface InvestigationState {
  version: 1;
  startedAt: number;
  discovered: string[];
  seen: string[];
  followedLeads: string[];
  conflictMarks: Record<string, ConflictMark>;
  notes: Record<string, string>;
  pinned: string[];
  board: { nodes: BoardNodeData[]; edges: BoardEdgeData[] };
  timeline: { placed: string[]; custom: CustomEvent[] };
}

type Action =
  | { type: "discover"; ids: string[]; lead?: string }
  | { type: "seen"; id: string }
  | { type: "markConflict"; id: string; mark: ConflictMark | null }
  | { type: "note"; id: string; text: string }
  | { type: "togglePin"; id: string }
  | { type: "boardAdd"; node: BoardNodeData }
  | { type: "boardMove"; id: string; x: number; y: number }
  | { type: "boardRemove"; id: string }
  | { type: "boardText"; id: string; text: string }
  | { type: "edgeAdd"; edge: BoardEdgeData }
  | { type: "edgeKind"; id: string; kind: EdgeKind }
  | { type: "edgeRemove"; id: string }
  | { type: "timelinePlace"; id: string }
  | { type: "timelineRemove"; id: string }
  | { type: "customAdd"; event: CustomEvent }
  | { type: "customUpdate"; event: CustomEvent }
  | { type: "customRemove"; id: string }
  | { type: "reset"; brief: string[] };

const uniq = (xs: string[]) => Array.from(new Set(xs));

/** A free-ish spot for the n-th pinned item: a loose grid, like cards laid on a table. */
export function boardSlot(n: number) {
  const col = n % 5;
  const row = Math.floor(n / 5);
  return { x: 40 + col * 230 + (row % 2) * 60, y: 40 + row * 190 + (col % 2) * 24 };
}

export function initialState(brief: string[]): InvestigationState {
  return {
    version: 1,
    startedAt: Date.now(),
    discovered: brief,
    seen: [],
    followedLeads: [],
    conflictMarks: {},
    notes: {},
    pinned: [],
    board: { nodes: [], edges: [] },
    timeline: { placed: [], custom: [] },
  };
}

function reducer(s: InvestigationState, a: Action): InvestigationState {
  switch (a.type) {
    case "reset":
      return initialState(a.brief);
    case "discover":
      return {
        ...s,
        discovered: uniq([...s.discovered, ...a.ids]),
        followedLeads: a.lead ? uniq([...s.followedLeads, a.lead]) : s.followedLeads,
      };
    case "seen":
      return s.seen.includes(a.id) ? s : { ...s, seen: [...s.seen, a.id] };
    case "markConflict": {
      const marks = { ...s.conflictMarks };
      if (a.mark) marks[a.id] = a.mark;
      else delete marks[a.id];
      return { ...s, conflictMarks: marks };
    }
    case "note":
      return { ...s, notes: { ...s.notes, [a.id]: a.text } };
    case "togglePin":
      return { ...s, pinned: s.pinned.includes(a.id) ? s.pinned.filter((p) => p !== a.id) : [...s.pinned, a.id] };
    case "boardAdd":
      if (a.node.ref && s.board.nodes.some((n) => n.kind === a.node.kind && n.ref === a.node.ref)) return s;
      return { ...s, board: { ...s.board, nodes: [...s.board.nodes, a.node] } };
    case "boardMove":
      return {
        ...s,
        board: { ...s.board, nodes: s.board.nodes.map((n) => (n.id === a.id ? { ...n, x: a.x, y: a.y } : n)) },
      };
    case "boardText":
      return {
        ...s,
        board: { ...s.board, nodes: s.board.nodes.map((n) => (n.id === a.id ? { ...n, text: a.text } : n)) },
      };
    case "boardRemove":
      return {
        ...s,
        board: {
          nodes: s.board.nodes.filter((n) => n.id !== a.id),
          edges: s.board.edges.filter((e) => e.source !== a.id && e.target !== a.id),
        },
      };
    case "edgeAdd":
      if (s.board.edges.some((e) => e.source === a.edge.source && e.target === a.edge.target)) return s;
      return { ...s, board: { ...s.board, edges: [...s.board.edges, a.edge] } };
    case "edgeKind":
      return {
        ...s,
        board: { ...s.board, edges: s.board.edges.map((e) => (e.id === a.id ? { ...e, kind: a.kind } : e)) },
      };
    case "edgeRemove":
      return { ...s, board: { ...s.board, edges: s.board.edges.filter((e) => e.id !== a.id) } };
    case "timelinePlace":
      return { ...s, timeline: { ...s.timeline, placed: uniq([...s.timeline.placed, a.id]) } };
    case "timelineRemove":
      return { ...s, timeline: { ...s.timeline, placed: s.timeline.placed.filter((p) => p !== a.id) } };
    case "customAdd":
      return { ...s, timeline: { ...s.timeline, custom: [...s.timeline.custom, a.event] } };
    case "customUpdate":
      return {
        ...s,
        timeline: { ...s.timeline, custom: s.timeline.custom.map((c) => (c.id === a.event.id ? a.event : c)) },
      };
    case "customRemove":
      return { ...s, timeline: { ...s.timeline, custom: s.timeline.custom.filter((c) => c.id !== a.id) } };
  }
}

const storageKey = (caseId: string) => `casefile:${caseId}:v1`;

function load(caseId: string): InvestigationState | null {
  try {
    const raw = localStorage.getItem(storageKey(caseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.version === 1 ? (parsed as InvestigationState) : null;
  } catch {
    return null;
  }
}

function save(caseId: string, s: InvestigationState) {
  try {
    localStorage.setItem(storageKey(caseId), JSON.stringify(s));
  } catch {
    /* storage unavailable: play continues, progress just isn't kept */
  }
}

interface Ctx {
  state: InvestigationState;
  dispatch: React.Dispatch<Action>;
  newId: () => string;
}

const InvestigationContext = createContext<Ctx | null>(null);

export function InvestigationProvider({
  caseId,
  brief,
  children,
  onHydrated,
}: {
  caseId: string;
  brief: string[];
  children: React.ReactNode;
  onHydrated?: (s: InvestigationState) => void;
}) {
  // The workspace renders client-only, so saved progress can be read synchronously here.
  const [initial] = useState(() => load(caseId) ?? initialState(brief));
  const [state, dispatch] = useReducer(reducer, initial);
  const counter = useRef(0);
  const onHydratedRef = useRef(onHydrated);

  useEffect(() => {
    onHydratedRef.current?.(initial);
  }, [initial]);

  useEffect(() => {
    save(caseId, state);
  }, [caseId, state]);

  const newId = useCallback(() => `${Date.now().toString(36)}-${(counter.current++).toString(36)}`, []);
  const value = useMemo(() => ({ state, dispatch, newId }), [state, newId]);
  return <InvestigationContext.Provider value={value}>{children}</InvestigationContext.Provider>;
}

export function useInvestigation() {
  const ctx = useContext(InvestigationContext);
  if (!ctx) throw new Error("useInvestigation outside provider");
  return ctx;
}
