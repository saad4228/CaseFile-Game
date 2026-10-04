import { z } from "zod";
import type { ConflictMark, EdgeKind, ProofSlot, VerdictField } from "./types";

// The investigation's shared, player-editable state and the operations that change it.
// This reducer runs in the browser (optimistic) and on the server (authoritative), so it
// must stay pure and deterministic. Discovery (leads, interviews, sharing) is NOT here:
// those go through dedicated server endpoints because they reveal hidden data.

export type BoardNodeKind = "evidence" | "suspect" | "note" | "unknown" | "location";

export interface BoardNode {
  id: string;
  kind: BoardNodeKind;
  ref?: string;
  text?: string;
  x: number;
  y: number;
}

export interface BoardEdge {
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

export type AssumptionStatus = "open" | "supported" | "contradicted";

export interface Assumption {
  id: string;
  key: string;
  text: string;
  status: AssumptionStatus;
  evidence: string[];
}

export type ClaimKind = "culprit" | "lying" | "present" | "custom";

export interface Theory {
  id: string;
  title: string;
  suspect: string | null;
  claim: ClaimKind;
  assumptions: Assumption[];
  by?: string;
  createdAt: number;
  archived?: boolean;
}

export interface VerdictDraft {
  who: string | null;
  how: string | null;
  when: string | null;
  where: string | null;
  why: string | null;
  proof: Record<ProofSlot, string[]>;
  statement: string;
}

export interface SharedState {
  v: 1;
  board: { nodes: BoardNode[]; edges: BoardEdge[] };
  timeline: { placed: string[]; custom: CustomEvent[] };
  conflictMarks: Record<string, ConflictMark>;
  theories: Theory[];
  verdict: VerdictDraft;
}

export interface PersonalState {
  v: 1;
  seen: string[];
  notes: Record<string, string>;
}

export const emptyVerdict = (): VerdictDraft => ({
  who: null,
  how: null,
  when: null,
  where: null,
  why: null,
  proof: { motive: [], opportunity: [], means: [], timeline: [], identity: [] },
  statement: "",
});

export const initialShared = (): SharedState => ({
  v: 1,
  board: { nodes: [], edges: [] },
  timeline: { placed: [], custom: [] },
  conflictMarks: {},
  theories: [],
  verdict: emptyVerdict(),
});

export const initialPersonal = (): PersonalState => ({ v: 1, seen: [], notes: {} });

// ─── Limits ──────────────────────────────────────────────────────────────────

export const LIMITS = {
  nodes: 300,
  edges: 600,
  custom: 60,
  theories: 30,
  assumptions: 16,
  attached: 30,
  noteText: 600,
  label: 160,
  observation: 2000,
  statement: 1200,
};

// ─── Operation schemas ───────────────────────────────────────────────────────

const id = z.string().min(1).max(64).regex(/^[\w.:-]+$/);
const coord = z.number().finite().min(-100000).max(100000);
const edgeKind = z.enum([
  "SUPPORTS",
  "CONTRADICTS",
  "CAUSES",
  "ASSOCIATED_WITH",
  "OCCURRED_BEFORE",
  "OCCURRED_AFTER",
  "DISPROVES",
  "SUSPECTED",
]);
const nodeKind = z.enum(["evidence", "suspect", "note", "unknown", "location"]);
const time = z.string().regex(/^\d{2}:\d{2}$/);
const slot = z.enum(["motive", "opportunity", "means", "timeline", "identity"]);
const verdictField = z.enum(["who", "how", "when", "where", "why"]);
const mark = z.enum(["contradiction", "explained", "ignored"]);
const status = z.enum(["open", "supported", "contradicted"]);
const claim = z.enum(["culprit", "lying", "present", "custom"]);

const assumption = z.object({
  id,
  key: z.string().max(40),
  text: z.string().min(1).max(LIMITS.label),
  status,
  evidence: z.array(id).max(LIMITS.attached),
});

export const SharedOpSchema = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("board.add"),
    node: z.object({ id, kind: nodeKind, ref: id.optional(), text: z.string().max(LIMITS.noteText).optional(), x: coord, y: coord }),
  }),
  z.object({ t: z.literal("board.move"), id, x: coord, y: coord }),
  z.object({ t: z.literal("board.text"), id, text: z.string().max(LIMITS.noteText) }),
  z.object({ t: z.literal("board.remove"), id }),
  z.object({ t: z.literal("edge.add"), edge: z.object({ id, source: id, target: id, kind: edgeKind }) }),
  z.object({ t: z.literal("edge.kind"), id, kind: edgeKind }),
  z.object({ t: z.literal("edge.remove"), id }),
  z.object({ t: z.literal("timeline.place"), id }),
  z.object({ t: z.literal("timeline.remove"), id }),
  z.object({ t: z.literal("custom.add"), event: z.object({ id, time, label: z.string().max(LIMITS.label) }) }),
  z.object({ t: z.literal("custom.update"), event: z.object({ id, time, label: z.string().max(LIMITS.label) }) }),
  z.object({ t: z.literal("custom.remove"), id }),
  z.object({ t: z.literal("conflict.mark"), id, mark: mark.nullable() }),
  z.object({
    t: z.literal("theory.add"),
    theory: z.object({
      id,
      title: z.string().min(1).max(LIMITS.label),
      suspect: id.nullable(),
      claim,
      assumptions: z.array(assumption).max(LIMITS.assumptions),
      by: z.string().max(40).optional(),
      createdAt: z.number().int().nonnegative(),
    }),
  }),
  z.object({
    t: z.literal("theory.update"),
    id,
    patch: z.object({ title: z.string().min(1).max(LIMITS.label).optional(), archived: z.boolean().optional() }),
  }),
  z.object({ t: z.literal("theory.remove"), id }),
  z.object({ t: z.literal("assumption.add"), theoryId: id, assumption }),
  z.object({
    t: z.literal("assumption.update"),
    theoryId: id,
    id,
    patch: z.object({ status: status.optional(), text: z.string().min(1).max(LIMITS.label).optional() }),
  }),
  z.object({ t: z.literal("assumption.remove"), theoryId: id, id }),
  z.object({ t: z.literal("assumption.attach"), theoryId: id, id, evidence: id }),
  z.object({ t: z.literal("assumption.detach"), theoryId: id, id, evidence: id }),
  z.object({ t: z.literal("verdict.set"), field: verdictField, value: id.nullable() }),
  z.object({ t: z.literal("verdict.statement"), text: z.string().max(LIMITS.statement) }),
  z.object({ t: z.literal("verdict.attach"), slot, evidence: id }),
  z.object({ t: z.literal("verdict.detach"), slot, evidence: id }),
]);

export const PersonalOpSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("seen"), id }),
  z.object({ t: z.literal("note"), id, text: z.string().max(LIMITS.observation) }),
]);

export type SharedOp = z.infer<typeof SharedOpSchema>;
export type PersonalOp = z.infer<typeof PersonalOpSchema>;

// ─── Reducers ────────────────────────────────────────────────────────────────

const uniq = (xs: string[]) => Array.from(new Set(xs));
const mapTheory = (s: SharedState, theoryId: string, f: (t: Theory) => Theory): SharedState => ({
  ...s,
  theories: s.theories.map((t) => (t.id === theoryId ? f(t) : t)),
});
const mapAssumption = (t: Theory, aid: string, f: (a: Assumption) => Assumption): Theory => ({
  ...t,
  assumptions: t.assumptions.map((a) => (a.id === aid ? f(a) : a)),
});

/** Apply one shared operation. Invalid or no-op operations return the state unchanged. */
export function applyShared(s: SharedState, op: SharedOp): SharedState {
  switch (op.t) {
    case "board.add": {
      if (s.board.nodes.length >= LIMITS.nodes) return s;
      if (s.board.nodes.some((n) => n.id === op.node.id)) return s;
      if (op.node.ref && (op.node.kind === "evidence" || op.node.kind === "suspect" || op.node.kind === "location")) {
        if (s.board.nodes.some((n) => n.kind === op.node.kind && n.ref === op.node.ref)) return s;
      }
      return { ...s, board: { ...s.board, nodes: [...s.board.nodes, op.node] } };
    }
    case "board.move":
      return {
        ...s,
        board: { ...s.board, nodes: s.board.nodes.map((n) => (n.id === op.id ? { ...n, x: op.x, y: op.y } : n)) },
      };
    case "board.text":
      return {
        ...s,
        board: { ...s.board, nodes: s.board.nodes.map((n) => (n.id === op.id ? { ...n, text: op.text } : n)) },
      };
    case "board.remove":
      return {
        ...s,
        board: {
          nodes: s.board.nodes.filter((n) => n.id !== op.id),
          edges: s.board.edges.filter((e) => e.source !== op.id && e.target !== op.id),
        },
      };
    case "edge.add": {
      const { edge } = op;
      if (s.board.edges.length >= LIMITS.edges || edge.source === edge.target) return s;
      const ids = new Set(s.board.nodes.map((n) => n.id));
      if (!ids.has(edge.source) || !ids.has(edge.target)) return s;
      if (s.board.edges.some((e) => e.id === edge.id)) return s;
      if (
        s.board.edges.some(
          (e) => (e.source === edge.source && e.target === edge.target) || (e.source === edge.target && e.target === edge.source),
        )
      )
        return s;
      return { ...s, board: { ...s.board, edges: [...s.board.edges, edge] } };
    }
    case "edge.kind":
      return {
        ...s,
        board: { ...s.board, edges: s.board.edges.map((e) => (e.id === op.id ? { ...e, kind: op.kind } : e)) },
      };
    case "edge.remove":
      return { ...s, board: { ...s.board, edges: s.board.edges.filter((e) => e.id !== op.id) } };
    case "timeline.place":
      return { ...s, timeline: { ...s.timeline, placed: uniq([...s.timeline.placed, op.id]) } };
    case "timeline.remove":
      return { ...s, timeline: { ...s.timeline, placed: s.timeline.placed.filter((p) => p !== op.id) } };
    case "custom.add":
      if (s.timeline.custom.length >= LIMITS.custom || s.timeline.custom.some((c) => c.id === op.event.id)) return s;
      return { ...s, timeline: { ...s.timeline, custom: [...s.timeline.custom, op.event] } };
    case "custom.update":
      return {
        ...s,
        timeline: { ...s.timeline, custom: s.timeline.custom.map((c) => (c.id === op.event.id ? op.event : c)) },
      };
    case "custom.remove":
      return { ...s, timeline: { ...s.timeline, custom: s.timeline.custom.filter((c) => c.id !== op.id) } };
    case "conflict.mark": {
      const marks = { ...s.conflictMarks };
      if (op.mark) marks[op.id] = op.mark;
      else delete marks[op.id];
      return { ...s, conflictMarks: marks };
    }
    case "theory.add":
      if (s.theories.length >= LIMITS.theories || s.theories.some((t) => t.id === op.theory.id)) return s;
      return { ...s, theories: [...s.theories, op.theory] };
    case "theory.update":
      return mapTheory(s, op.id, (t) => ({ ...t, ...op.patch }));
    case "theory.remove":
      return { ...s, theories: s.theories.filter((t) => t.id !== op.id) };
    case "assumption.add":
      return mapTheory(s, op.theoryId, (t) =>
        t.assumptions.length >= LIMITS.assumptions || t.assumptions.some((a) => a.id === op.assumption.id)
          ? t
          : { ...t, assumptions: [...t.assumptions, op.assumption] },
      );
    case "assumption.update":
      return mapTheory(s, op.theoryId, (t) => mapAssumption(t, op.id, (a) => ({ ...a, ...op.patch })));
    case "assumption.remove":
      return mapTheory(s, op.theoryId, (t) => ({ ...t, assumptions: t.assumptions.filter((a) => a.id !== op.id) }));
    case "assumption.attach":
      return mapTheory(s, op.theoryId, (t) =>
        mapAssumption(t, op.id, (a) =>
          a.evidence.length >= LIMITS.attached ? a : { ...a, evidence: uniq([...a.evidence, op.evidence]) },
        ),
      );
    case "assumption.detach":
      return mapTheory(s, op.theoryId, (t) =>
        mapAssumption(t, op.id, (a) => ({ ...a, evidence: a.evidence.filter((e) => e !== op.evidence) })),
      );
    case "verdict.set":
      return { ...s, verdict: { ...s.verdict, [op.field]: op.value } };
    case "verdict.statement":
      return { ...s, verdict: { ...s.verdict, statement: op.text } };
    case "verdict.attach": {
      const cur = s.verdict.proof[op.slot];
      if (cur.includes(op.evidence) || cur.length >= LIMITS.attached) return s;
      return { ...s, verdict: { ...s.verdict, proof: { ...s.verdict.proof, [op.slot]: [...cur, op.evidence] } } };
    }
    case "verdict.detach":
      return {
        ...s,
        verdict: {
          ...s.verdict,
          proof: { ...s.verdict.proof, [op.slot]: s.verdict.proof[op.slot].filter((e) => e !== op.evidence) },
        },
      };
  }
}

export function applyPersonal(p: PersonalState, op: PersonalOp): PersonalState {
  switch (op.t) {
    case "seen":
      return p.seen.includes(op.id) ? p : { ...p, seen: [...p.seen, op.id] };
    case "note":
      return { ...p, notes: { ...p.notes, [op.id]: op.text } };
  }
}

/** Coerce stored JSON (possibly from an older shape) into a valid SharedState. */
export function normalizeShared(raw: unknown): SharedState {
  const base = initialShared();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<SharedState>;
  return {
    v: 1,
    board: {
      nodes: Array.isArray(r.board?.nodes) ? r.board.nodes : [],
      edges: Array.isArray(r.board?.edges) ? r.board.edges : [],
    },
    timeline: {
      placed: Array.isArray(r.timeline?.placed) ? r.timeline.placed : [],
      custom: Array.isArray(r.timeline?.custom) ? r.timeline.custom : [],
    },
    conflictMarks: r.conflictMarks && typeof r.conflictMarks === "object" ? r.conflictMarks : {},
    theories: Array.isArray(r.theories) ? r.theories : [],
    verdict: { ...base.verdict, ...(r.verdict ?? {}), proof: { ...base.verdict.proof, ...(r.verdict?.proof ?? {}) } },
  };
}

export function normalizePersonal(raw: unknown): PersonalState {
  const r = (raw ?? {}) as Partial<PersonalState>;
  return {
    v: 1,
    seen: Array.isArray(r.seen) ? r.seen : [],
    notes: r.notes && typeof r.notes === "object" ? r.notes : {},
  };
}

/** Evidence ids an op refers to, for server-side visibility checks. */
export function evidenceRefs(op: SharedOp): string[] {
  switch (op.t) {
    case "board.add":
      return op.node.kind === "evidence" && op.node.ref ? [op.node.ref] : [];
    case "timeline.place":
      return [op.id];
    case "assumption.attach":
    case "verdict.attach":
      return [op.evidence];
    case "theory.add":
      return op.theory.assumptions.flatMap((a) => a.evidence);
    case "assumption.add":
      return op.assumption.evidence;
    default:
      return [];
  }
}

export type { ProofSlot, VerdictField };
