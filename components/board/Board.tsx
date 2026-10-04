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
import { SuspectPortrait } from "@/components/illustrations/SuspectPortrait";
import { useInvestigation } from "@/components/investigation/store";
import type { EdgeKind, Evidence, Suspect } from "@/lib/game-engine/types";
import { EVIDENCE_DRAG_TYPE } from "./constants";
import { edgeKindOrder, edgeKinds } from "./edgeKinds";


interface BoardCtx {
  evidence: Map<string, Evidence>;
  suspects: Map<string, Suspect>;
  unseen: Set<string>;
  onOpen: (id: string) => void;
  editEdge: (id: string) => void;
}
const BoardContext = createContext<BoardCtx | null>(null);
const useBoard = () => useContext(BoardContext)!;

type NodeData = { ref?: string; text?: string };

function Handles() {
  const cls = "!h-2.5 !w-2.5 !border-2 !border-ink-950 !bg-crimson-600 opacity-0 transition-opacity group-hover:opacity-100";
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

function EvidenceNode({ data, selected }: NodeProps<Node<NodeData>>) {
  const { evidence, unseen, onOpen } = useBoard();
  const e = data.ref ? evidence.get(data.ref) : undefined;
  if (!e) return null;
  return (
    <div
      className={`group relative ${selected ? "outline outline-2 outline-offset-4 outline-amber-500" : ""}`}
      onDoubleClick={() => onOpen(e.id)}
      title="Double-click to inspect"
    >
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
    <div className={`group relative ${selected ? "outline outline-2 outline-offset-4 outline-amber-500" : ""}`}>
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
  const { dispatch } = useInvestigation();
  return (
    <div className={`group relative ${selected ? "outline outline-2 outline-offset-4 outline-amber-500" : ""}`}>
      <div className="paper-aged w-48 rotate-[-1.5deg] px-3 py-2">
        <textarea
          aria-label="Note"
          className="font-hand nodrag h-24 w-full resize-none bg-transparent text-2xl leading-6 text-[#1f2c55] outline-none placeholder:text-[#1f2c55]/40"
          placeholder="write it down…"
          value={data.text ?? ""}
          onChange={(ev) => dispatch({ type: "boardText", id, text: ev.target.value })}
        />
      </div>
      <Handles />
    </div>
  );
}

function UnknownNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const { dispatch } = useInvestigation();
  return (
    <div className={`group relative ${selected ? "outline outline-2 outline-offset-4 outline-amber-500" : ""}`}>
      <div className="w-44 border border-dashed border-steel-400/70 bg-ink-950/80 px-3 py-3 text-center">
        <p className="font-mono text-lg tracking-[0.3em] text-steel-300">?????</p>
        <input
          aria-label="Unknown event"
          className="nodrag mt-1 w-full bg-transparent text-center font-mono text-[11px] uppercase tracking-[0.12em] text-bone-100 outline-none placeholder:text-steel-400"
          placeholder="what happened here?"
          value={data.text ?? ""}
          onChange={(ev) => dispatch({ type: "boardText", id, text: ev.target.value })}
        />
      </div>
      <Handles />
    </div>
  );
}

const nodeTypes = { evidence: EvidenceNode, suspect: SuspectNode, note: NoteNode, unknown: UnknownNode, location: NoteNode };

function ThreadEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: EdgeProps<Edge<{ kind: EdgeKind }>>) {
  const { editEdge } = useBoard();
  const kind = data?.kind ?? "ASSOCIATED_WITH";
  const style = edgeKinds[kind];
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature: 0.35 });
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
            pointerEvents: "all",
            borderColor: style.color,
            color: style.color,
          }}
          onClick={() => editEdge(id)}
          aria-label={`${style.label} — change connection`}
        >
          {style.label}
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
  evidence,
  suspects,
  onOpen,
}: {
  evidence: Evidence[];
  suspects: Suspect[];
  onOpen: (id: string) => void;
}) {
  const { state, dispatch, newId } = useInvestigation();
  const { screenToFlowPosition } = useReactFlow();
  const [drag, setDrag] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectedEdges, setSelectedEdges] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [personMenu, setPersonMenu] = useState(false);

  const ctx = useMemo<BoardCtx>(
    () => ({
      evidence: new Map(evidence.map((e) => [e.id, e])),
      suspects: new Map(suspects.map((s) => [s.id, s])),
      unseen: new Set(evidence.filter((e) => !state.seen.includes(e.id)).map((e) => e.id)),
      onOpen,
      editEdge: setEditing,
    }),
    [evidence, suspects, state.seen, onOpen],
  );

  const nodes: Node<NodeData>[] = state.board.nodes.map((n) => ({
    id: n.id,
    type: n.kind,
    position: drag[n.id] ?? { x: n.x, y: n.y },
    data: { ref: n.ref, text: n.text },
    selected: selectedNodes.has(n.id),
  }));

  const edges: Edge<{ kind: EdgeKind }>[] = state.board.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "thread",
    data: { kind: e.kind },
    selected: selectedEdges.has(e.id),
  }));

  const dragRef = useRef<Record<string, { x: number; y: number }>>({});

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<NodeData>>[]) => {
      for (const c of changes) {
        if (c.type === "position") {
          if (c.dragging && c.position) {
            dragRef.current[c.id] = c.position;
          } else if (c.dragging === false) {
            const pos = c.position ?? dragRef.current[c.id];
            if (pos) dispatch({ type: "boardMove", id: c.id, x: pos.x, y: pos.y });
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
        } else if (c.type === "remove") {
          dispatch({ type: "boardRemove", id: c.id });
        }
      }
    },
    [dispatch],
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
        } else if (c.type === "remove") {
          dispatch({ type: "edgeRemove", id: c.id });
        }
      }
    },
    [dispatch],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return;
      const id = `e-${newId()}`;
      dispatch({ type: "edgeAdd", edge: { id, source: c.source, target: c.target, kind: "ASSOCIATED_WITH" } });
      setEditing(id);
    },
    [dispatch, newId],
  );

  const center = () => screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2.4 });
  const jitter = () => ({ x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 80 });

  const addNode = (kind: "note" | "unknown" | "suspect", ref?: string) => {
    const p = center();
    const j = jitter();
    dispatch({ type: "boardAdd", node: { id: `n-${newId()}`, kind, ref, x: p.x + j.x, y: p.y + j.y } });
  };

  const onDrop = (ev: React.DragEvent) => {
    const id = ev.dataTransfer.getData(EVIDENCE_DRAG_TYPE);
    if (!id) return;
    ev.preventDefault();
    const p = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
    dispatch({ type: "boardAdd", node: { id: `n-${newId()}`, kind: "evidence", ref: id, x: p.x - 80, y: p.y - 40 } });
  };

  const editingEdge = state.board.edges.find((e) => e.id === editing);

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
          deleteKeyCode={["Backspace", "Delete"]}
          minZoom={0.3}
          maxZoom={2}
          fitView={state.board.nodes.length > 0}
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          className="casefile-board"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#2c343d" />
          <Controls showInteractive={false} className="casefile-controls" position="bottom-right" />
          <Panel position="top-left" className="!m-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost btn-sm bg-ink-950/80" onClick={() => addNode("note")}>
              + Note
            </button>
            <button type="button" className="btn btn-ghost btn-sm bg-ink-950/80" onClick={() => addNode("unknown")}>
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
        </ReactFlow>

        {state.board.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-3xl italic text-bone-100/70 md:text-4xl">The board is quiet. Keep looking.</p>
            <p className="label mt-4 max-w-md normal-case tracking-[0.08em]">
              Drag records up from the tray, or open one and pin it. Pull a thread from any pinned item&apos;s edge to connect it.
            </p>
          </div>
        )}

        {editingEdge && (
          <div className="panel absolute right-3 top-3 z-20 w-64 p-3 shadow-2xl" role="dialog" aria-label="Connection type">
            <p className="label mb-2">How are they connected?</p>
            <ul className="space-y-1">
              {edgeKindOrder.map((k) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: "edgeKind", id: editingEdge.id, kind: k });
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
                  dispatch({ type: "edgeRemove", id: editingEdge.id });
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

export function Board(props: { evidence: Evidence[]; suspects: Suspect[]; onOpen: (id: string) => void }) {
  return (
    <ReactFlowProvider>
      <BoardInner {...props} />
    </ReactFlowProvider>
  );
}
