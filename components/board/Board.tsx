"use client";

import {
  Background,
  BackgroundVariant,
  BaseEdge,
  ConnectionMode,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
  Handle,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { useGame } from "@/components/game/GameContext";
import { SuspectPortrait } from "@/components/illustrations/SuspectPortrait";
import type { EdgeKind, Evidence, Suspect } from "@/lib/game-engine/types";
import { EVIDENCE_DRAG_TYPE } from "./constants";
import { edgeKindOrder, edgeKinds } from "./edgeKinds";
import { play } from "@/lib/client/sound";

interface BoardCtx {
  evidence: Map<string, Evidence>;
  suspects: Map<string, Suspect>;
  unseen: Set<string>;
  readOnly: boolean;
  judged?: Record<string, "correct" | "wrong" | "neutral">;
  onOpen: (id: string) => void;
  editEdge: (id: string) => void;
}
const BoardContext = createContext<BoardCtx | null>(null);
const useBoard = () => useContext(BoardContext)!;

type NodeData = { ref?: string; text?: string };

function Handles() {
  const { readOnly } = useBoard();
  if (readOnly) return null;
  const cls = "!h-3 !w-3 !border-2 !border-ink-950 !bg-crimson-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100";
  return (
    <>
      <Handle type="source" position={Position.Top} id="t" className={cls} />
      <Handle type="source" position={Position.Right} id="r" className={cls} />
      <Handle type="source" position={Position.Bottom} id="b" className={cls} />
      <Handle type="source" position={Position.Left} id="l" className={cls} />
    </>
  );
}

function Pin() {
  return (
    <span
      className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-crimson-600 shadow-[0_2px_3px_rgba(0,0,0,.6),inset_-2px_-2px_3px_rgba(0,0,0,.35)]"
      aria-hidden="true"
    />
  );
}

const selectedCls = (selected: boolean) => (selected ? "outline outline-2 outline-offset-4 outline-amber-500" : "");

function EvidenceNode({ data, selected }: NodeProps<Node<NodeData>>) {
  const { evidence, unseen, onOpen } = useBoard();
  const e = data.ref ? evidence.get(data.ref) : undefined;
  if (!e) {
    return (
      <div className="w-40 border border-dashed border-steel-400/50 px-3 py-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-steel-400">
        Record withdrawn
        <Handles />
      </div>
    );
  }
  return (
    <div className={`group relative ${selectedCls(selected)}`} onDoubleClick={() => onOpen(e.id)} title="Double-click to inspect">
      <Pin />
      <EvidenceCard e={e} compact unseen={unseen.has(e.id)} />
      <Handles />
    </div>
  );
}

function SuspectNode({ data, selected }: NodeProps<Node<NodeData>>) {
  const { suspects } = useBoard();
  const s = data.ref ? suspects.get(data.ref) : undefined;
  if (!s) return null;
  return (
    <div className={`group relative ${selectedCls(selected)}`}>
      <Pin />
      <div className="photo-print w-28">
        <SuspectPortrait spec={s.portrait} label={s.name} className="block w-full" />
        <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[#1d1a14]">{s.name}</p>
      </div>
      <Handles />
    </div>
  );
}

function NoteNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const { dispatch } = useGame();
  const { readOnly } = useBoard();
  return (
    <div className={`group relative ${selectedCls(selected)}`}>
      <div className="paper-aged w-48 rotate-[-1.5deg] px-3 py-2">
        <textarea
          aria-label="Note"
          readOnly={readOnly}
          maxLength={600}
          className="font-hand nodrag h-24 w-full resize-none bg-transparent text-2xl leading-6 text-[#1f2c55] outline-none placeholder:text-[#1f2c55]/40"
          placeholder="write it down…"
          value={data.text ?? ""}
          onChange={(ev) => dispatch({ t: "board.text", id, text: ev.target.value })}
        />
      </div>
      <Handles />
    </div>
  );
}

function UnknownNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const { dispatch } = useGame();
  const { readOnly } = useBoard();
  return (
    <div className={`group relative ${selectedCls(selected)}`}>
      <div className="w-44 border border-dashed border-steel-400/70 bg-ink-950/80 px-3 py-3 text-center">
        <p className="font-mono text-lg tracking-[0.3em] text-steel-300">?????</p>
        <input
          aria-label="Unknown event"
          readOnly={readOnly}
          maxLength={160}
          className="nodrag mt-1 w-full bg-transparent text-center font-mono text-[11px] uppercase tracking-[0.12em] text-bone-100 outline-none placeholder:text-steel-400"
          placeholder="what happened here?"
          value={data.text ?? ""}
          onChange={(ev) => dispatch({ t: "board.text", id, text: ev.target.value })}
        />
      </div>
      <Handles />
    </div>
  );
}

const nodeTypes = { evidence: EvidenceNode, suspect: SuspectNode, note: NoteNode, unknown: UnknownNode, location: NoteNode };

function ThreadEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: EdgeProps<Edge<{ kind: EdgeKind }>>) {
  const { editEdge, readOnly, judged } = useBoard();
  const kind = data?.kind ?? "ASSOCIATED_WITH";
  const style = edgeKinds[kind];
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature: 0.35 });
  const verdict = judged?.[id];
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{ stroke: style.color, strokeWidth: selected ? style.width + 1.2 : style.width, strokeDasharray: style.dash }}
        markerEnd={style.arrow === "end" ? `url(#arrow-${kind})` : undefined}
        markerStart={style.arrow === "start" ? `url(#arrow-${kind})` : undefined}
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          className="nodrag nopan absolute border bg-ink-950 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]"
          style={{
            transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`,
            pointerEvents: readOnly ? "none" : "all",
            borderColor: style.color,
            color: style.color,
          }}
          onClick={() => editEdge(id)}
          aria-label={`${style.label} — change connection`}
        >
          {style.label}
          {verdict && verdict !== "neutral" && (
            <span className={`ml-1.5 ${verdict === "correct" ? "text-[#9fd49a]" : "text-crimson-400"}`}>
              {verdict === "correct" ? "✓" : "✗"}
            </span>
          )}
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { thread: ThreadEdge };

function ArrowDefs() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true">
      <defs>
        {edgeKindOrder.map((k) => (
          <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={edgeKinds[k].color} />
          </marker>
        ))}
      </defs>
    </svg>
  );
}

function BoardInner({
  onOpen,
  onToast,
  judged,
}: {
  onOpen: (id: string) => void;
  onToast: (msg: string) => void;
  judged?: Record<string, "correct" | "wrong" | "neutral">;
}) {
  const { shared, personal, evidence, suspects, holders, dispatch, newId, phase } = useGame();
  const readOnly = phase === "RESOLVED";
  const { screenToFlowPosition } = useReactFlow();
  const [drag, setDrag] = useState<Record<string, { x: number; y: number }>>({});
  const dragRef = useRef<Record<string, { x: number; y: number }>>({});
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectedEdges, setSelectedEdges] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [personMenu, setPersonMenu] = useState(false);

  const ctx = useMemo<BoardCtx>(
    () => ({
      evidence: new Map(evidence.map((e) => [e.id, e])),
      suspects: new Map(suspects.map((s) => [s.id, s])),
      unseen: new Set(evidence.filter((e) => !personal.seen.includes(e.id)).map((e) => e.id)),
      readOnly,
      judged,
      onOpen,
      editEdge: setEditing,
    }),
    [evidence, suspects, personal.seen, onOpen, readOnly, judged],
  );

  const nodes: Node<NodeData>[] = shared.board.nodes.map((n) => ({
    id: n.id,
    type: n.kind,
    position: drag[n.id] ?? { x: n.x, y: n.y },
    data: { ref: n.ref, text: n.text },
    selected: selectedNodes.has(n.id),
    draggable: !readOnly,
  }));

  const edges: Edge<{ kind: EdgeKind }>[] = shared.board.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "thread",
    data: { kind: e.kind },
    selected: selectedEdges.has(e.id),
  }));

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<NodeData>>[]) => {
      for (const c of changes) {
        if (c.type === "position") {
          if (c.dragging && c.position) {
            dragRef.current[c.id] = c.position;
          } else if (c.dragging === false) {
            const pos = c.position ?? dragRef.current[c.id];
            if (pos) dispatch({ t: "board.move", id: c.id, x: Math.round(pos.x), y: Math.round(pos.y) });
            delete dragRef.current[c.id];
          }
          setDrag({ ...dragRef.current });
        } else if (c.type === "select") {
          setSelectedNodes((sel) => {
            const next = new Set(sel);
            if (c.selected) next.add(c.id);
            else next.delete(c.id);
            return next;
          });
        } else if (c.type === "remove" && !readOnly) {
          dispatch({ t: "board.remove", id: c.id });
        }
      }
    },
    [dispatch, readOnly],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge<{ kind: EdgeKind }>>[]) => {
      for (const c of changes) {
        if (c.type === "select") {
          setSelectedEdges((sel) => {
            const next = new Set(sel);
            if (c.selected) next.add(c.id);
            else next.delete(c.id);
            return next;
          });
        } else if (c.type === "remove" && !readOnly) {
          dispatch({ t: "edge.remove", id: c.id });
        }
      }
    },
    [dispatch, readOnly],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (readOnly || !c.source || !c.target || c.source === c.target) return;
      const id = newId();
      dispatch({ t: "edge.add", edge: { id, source: c.source, target: c.target, kind: "ASSOCIATED_WITH" } });
      play("thread");
      setEditing(id);
    },
    [dispatch, newId, readOnly],
  );

  const center = () => screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2.4 });
  const spread = shared.board.nodes.length;
  const offset = { x: ((spread * 47) % 160) - 80, y: ((spread * 31) % 100) - 50 };

  const addNode = (kind: "note" | "unknown" | "suspect", ref?: string) => {
    const p = center();
    dispatch({ t: "board.add", node: { id: newId(), kind, ref, x: Math.round(p.x + offset.x), y: Math.round(p.y + offset.y) } });
  };

  const onDrop = (ev: React.DragEvent) => {
    const id = ev.dataTransfer.getData(EVIDENCE_DRAG_TYPE);
    if (!id || readOnly) return;
    ev.preventDefault();
    if (holders[id] === "me") {
      onToast("That record is private to you. Share it with the team before pinning it to the board.");
      return;
    }
    const p = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
    dispatch({ t: "board.add", node: { id: newId(), kind: "evidence", ref: id, x: Math.round(p.x - 80), y: Math.round(p.y - 40) } });
  };

  const editingEdge = shared.board.edges.find((e) => e.id === editing);

  return (
    <BoardContext.Provider value={ctx}>
      <div
        className="relative h-full w-full"
        onDragOver={(ev) => {
          if (ev.dataTransfer.types.includes(EVIDENCE_DRAG_TYPE)) {
            ev.preventDefault();
            ev.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={onDrop}
      >
        <ArrowDefs />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          connectionMode={ConnectionMode.Loose}
          connectionLineStyle={{ stroke: "#9c2929", strokeWidth: 2 }}
          deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
          nodesConnectable={!readOnly}
          minZoom={0.25}
          maxZoom={2}
          fitView={shared.board.nodes.length > 0}
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          className="casefile-board"
        >
          <Background variant={BackgroundVariant.Dots} gap={44} size={1.4} color="rgba(0,0,0,0.35)" />
          <Controls showInteractive={false} className="casefile-controls" position="bottom-right" />
          {!readOnly && (
            <Panel position="top-left" className="!m-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost btn-sm bg-ink-950/80" onClick={() => addNode("note")}>
                + Note
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm bg-ink-950/80"
                onClick={() => addNode("unknown")}
                aria-label="Add an unknown event"
                title="Something happened here, but you don't know what yet"
              >
                + ?????
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm bg-ink-950/80"
                  aria-expanded={personMenu}
                  onClick={() => setPersonMenu((v) => !v)}
                >
                  + Person ▾
                </button>
                {personMenu && (
                  <ul className="panel absolute left-0 top-full z-20 mt-1 w-52 py-1">
                    {suspects.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm hover:bg-ink-800"
                          onClick={() => {
                            addNode("suspect", s.id);
                            setPersonMenu(false);
                          }}
                        >
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          )}
        </ReactFlow>
        <BoardLamp />

        {shared.board.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-3xl italic text-bone-100/70 md:text-4xl">The board is quiet. Keep looking.</p>
            <p className="label mt-4 max-w-md normal-case tracking-[0.08em]">
              Drag records up from the tray, or open one and pin it. Pull a thread from the edge of any pinned item to connect it.
            </p>
          </div>
        )}

        {editingEdge && !readOnly && (
          <div className="panel absolute right-3 top-3 z-20 w-64 p-3 shadow-2xl" role="dialog" aria-label="Connection type">
            <p className="label mb-2">How are they connected?</p>
            <ul className="space-y-1">
              {edgeKindOrder.map((k) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ t: "edge.kind", id: editingEdge.id, kind: k });
                      setEditing(null);
                    }}
                    className={`flex w-full items-center gap-3 px-2 py-1.5 text-left font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-ink-800 ${
                      editingEdge.kind === k ? "bg-ink-800 text-bone-100" : "text-bone-100/75"
                    }`}
                  >
                    <svg width="34" height="8" aria-hidden="true">
                      <line x1="0" y1="4" x2="34" y2="4" stroke={edgeKinds[k].color} strokeWidth={edgeKinds[k].width} strokeDasharray={edgeKinds[k].dash} />
                    </svg>
                    {edgeKinds[k].label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-ink-700 pt-2">
              <button
                type="button"
                className="label !text-crimson-400 hover:!text-bone-100"
                onClick={() => {
                  dispatch({ t: "edge.remove", id: editingEdge.id });
                  setEditing(null);
                }}
              >
                Cut thread
              </button>
              <button type="button" className="label hover:text-bone-100" onClick={() => setEditing(null)}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </BoardContext.Provider>
  );
}

export function Board(props: {
  onOpen: (id: string) => void;
  onToast: (msg: string) => void;
  judged?: Record<string, "correct" | "wrong" | "neutral">;
}) {
  return (
    <ReactFlowProvider>
      <BoardInner {...props} />
    </ReactFlowProvider>
  );
}

/** A green-shaded banker's lamp hanging over the wall; the light pool is in `.casefile-board`. */
function BoardLamp() {
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-0 z-[5] hidden h-12 w-28 -translate-x-1/2 md:block"
      viewBox="0 0 112 48"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="board-lamp-bulb" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#f0ae55" stopOpacity="0" />
        </radialGradient>
      </defs>
      <line x1="56" y1="0" x2="56" y2="16" stroke="#05070a" strokeWidth="2" />
      <path d="M40 30 L72 30 L64 16 L48 16 Z" fill="#0a0d11" stroke="#1d252e" strokeWidth="1" />
      <ellipse cx="56" cy="31" rx="17" ry="3" fill="#2b2014" />
      <ellipse cx="56" cy="34" rx="22" ry="9" fill="url(#board-lamp-bulb)" />
    </svg>
  );
}
