"use client";

import {
  BaseEdge,
  ConnectionMode,
  Controls,
  EdgeLabelRenderer,
  Handle,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
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
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { useGame } from "@/components/game/GameContext";
import { SuspectPhoto } from "@/components/illustrations/SuspectPhoto";
import type { BoardNode } from "@/lib/game-engine/state";
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
  return <span className="pin absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full" aria-hidden="true" />;
}

/**
 * Take an item off the board. Selecting a node and pressing Delete has always worked, but
 * nothing on screen said so, and a touch screen has no Delete key — so the pin gets pulled here.
 */
function Unpin({ id }: { id: string }) {
  const { dispatch } = useGame();
  const { readOnly } = useBoard();
  if (readOnly) return null;
  return (
    <button
      type="button"
      aria-label="Take off the board"
      title="Take off the board"
      className="board-unpin nodrag nopan absolute -right-2.5 -top-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-ink-600 bg-ink-950 text-[11px] leading-none text-steel-300 shadow-[0_2px_4px_rgba(0,0,0,.6)] hover:border-crimson-600 hover:text-crimson-400"
      onClick={(ev) => {
        ev.stopPropagation();
        dispatch({ t: "board.remove", id });
      }}
    >
      ✕
    </button>
  );
}

const selectedCls = (selected: boolean) => (selected ? "outline outline-2 outline-offset-4 outline-amber-500" : "");

function EvidenceNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const { evidence, unseen, onOpen } = useBoard();
  const e = data.ref ? evidence.get(data.ref) : undefined;
  if (!e) {
    return (
      <div className="group relative w-40 border border-dashed border-steel-400/50 px-3 py-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-steel-400">
        Record withdrawn
        <Unpin id={id} />
        <Handles />
      </div>
    );
  }
  return (
    <div
      className={`group relative ${selectedCls(selected)}`}
      style={{ rotate: `${tilt(e.id)}deg` }}
      onDoubleClick={() => onOpen(e.id)}
      title="Double-click to open the record"
    >
      <Pin />
      <EvidenceCard e={e} compact unseen={unseen.has(e.id)} />
      <Unpin id={id} />
      <Handles />
    </div>
  );
}

function SuspectNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const { suspects } = useBoard();
  const s = data.ref ? suspects.get(data.ref) : undefined;
  if (!s) return null;
  return (
    <div className={`group relative ${selectedCls(selected)}`} style={{ rotate: `${tilt(s.id)}deg` }}>
      <Pin />
      <div className="photo-print w-28">
        <SuspectPhoto suspect={s} className="block w-full" />
        <p className="mt-1 text-center font-hand text-xl leading-none text-[#1d1a14]">{s.name}</p>
        <p className="text-center font-mono text-[8px] uppercase tracking-[0.18em] text-[#1d1a14]/60">{s.code}</p>
      </div>
      <Unpin id={id} />
      <Handles />
    </div>
  );
}

function NoteNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const { dispatch } = useGame();
  const { readOnly } = useBoard();
  return (
    <div className={`group relative ${selectedCls(selected)}`} style={{ rotate: `${tilt(id) * 1.4}deg` }}>
      <Pin />
      <div className="sticky-note w-48 px-3 pb-2 pt-3">
        <textarea
          aria-label="Note"
          readOnly={readOnly}
          maxLength={600}
          className="font-hand nodrag h-28 w-full resize-none bg-transparent text-2xl leading-6 text-[#1f2c55] outline-none placeholder:text-[#1f2c55]/45"
          placeholder="write it down…"
          value={data.text ?? ""}
          onChange={(ev) => dispatch({ t: "board.text", id, text: ev.target.value })}
        />
      </div>
      <Unpin id={id} />
      <Handles />
    </div>
  );
}

function UnknownNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const { dispatch } = useGame();
  const { readOnly } = useBoard();
  return (
    <div className={`group relative ${selectedCls(selected)}`}>
      <Pin />
      <div className="w-44 border-2 border-dashed border-[#1d1a14]/50 bg-[#e9e4d8] px-3 py-3 text-center shadow-[0_12px_18px_-10px_rgba(0,0,0,.7)]">
        <p className="font-hand text-4xl leading-none text-crimson-600">?</p>
        <input
          aria-label="Unknown event"
          readOnly={readOnly}
          maxLength={160}
          className="nodrag mt-1 w-full bg-transparent text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#1d1a14] outline-none placeholder:text-[#1d1a14]/45"
          placeholder="what happened here?"
          value={data.text ?? ""}
          onChange={(ev) => dispatch({ t: "board.text", id, text: ev.target.value })}
        />
      </div>
      <Unpin id={id} />
      <Handles />
    </div>
  );
}

const nodeTypes = { evidence: EvidenceNode, suspect: SuspectNode, note: NoteNode, unknown: UnknownNode, location: NoteNode };

/** A small stable tilt per item so the board looks hand-pinned (−2.5° … 2.5°). */
function tilt(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 50) - 25) / 10;
}

/** Thread as a rope pinned at both ends: sags under its own weight, casts a shadow, shows a twist. */
function ThreadEdge({ id, sourceX, sourceY, targetX, targetY, data, selected }: EdgeProps<Edge<{ kind: EdgeKind }>>) {
  const { editEdge, readOnly, judged } = useBoard();
  const kind = data?.kind ?? "ASSOCIATED_WITH";
  const style = edgeKinds[kind];
  const dist = Math.hypot(targetX - sourceX, targetY - sourceY);
  const sag = Math.min(90, dist * 0.14);
  const cx = (sourceX + targetX) / 2;
  const cy = (sourceY + targetY) / 2 + sag;
  const path = `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`;
  const shadow = `M ${sourceX + 2} ${sourceY + 5} Q ${cx + 3} ${cy + 9} ${targetX + 2} ${targetY + 5}`;
  const lx = (sourceX + 2 * cx + targetX) / 4;
  const ly = (sourceY + 2 * cy + targetY) / 4;
  const width = selected ? style.width + 1.2 : style.width;
  const verdict = judged?.[id];
  const plain = kind === "ASSOCIATED_WITH";
  return (
    <>
      <path d={shadow} fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth={width + 1.5} strokeDasharray={style.dash} strokeLinecap="round" />
      <BaseEdge
        id={id}
        path={path}
        style={{ stroke: style.color, strokeWidth: width, strokeDasharray: style.dash, strokeLinecap: "round" }}
        markerEnd={style.arrow === "end" ? `url(#arrow-${kind})` : undefined}
        markerStart={style.arrow === "start" ? `url(#arrow-${kind})` : undefined}
      />
      {!style.dash && (
        <path d={path} fill="none" stroke="rgba(255,235,210,0.35)" strokeWidth={Math.max(0.8, width / 3)} strokeDasharray="2 4" pointerEvents="none" />
      )}
      <EdgeLabelRenderer>
        <button
          type="button"
          className={`nodrag nopan absolute font-mono text-[9px] uppercase tracking-[0.18em] ${
            plain && !selected && !verdict ? "h-4 w-4 rounded-full" : "border bg-[#e9e4d8] px-2 py-0.5 text-[#1d1a14] shadow-[0_4px_8px_rgba(0,0,0,.45)]"
          }`}
          style={{
            transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`,
            pointerEvents: readOnly ? "none" : "all",
            borderColor: style.color,
            background: plain && !selected && !verdict ? style.color : undefined,
            boxShadow: plain && !selected && !verdict ? "0 2px 3px rgba(0,0,0,.5), inset 0 1px 1px rgba(255,255,255,.25)" : undefined,
          }}
          onClick={() => editEdge(id)}
          aria-label={`${style.label} — change connection`}
          title={style.label}
        >
          {!(plain && !selected && !verdict) && (
            <>
              <span style={{ color: kind === "CONTRADICTS" ? "#1d1a14" : style.color === "#e7e2d8" ? "#1d1a14" : undefined }}>{style.label}</span>
              {verdict && verdict !== "neutral" && (
                <span className={`ml-1.5 ${verdict === "correct" ? "text-[#3d7a38]" : "text-crimson-600"}`}>{verdict === "correct" ? "✓" : "✗"}</span>
              )}
            </>
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
  const { screenToFlowPosition, getViewport, setCenter, getNode } = useReactFlow();
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<Node<NodeData>>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
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

  /**
   * React Flow keeps bookkeeping of its own on each node — the size it measured from the DOM
   * and where that node's handles sit. Rebuilding the nodes from the case file on every drag
   * frame threw all of that away, and an edge whose endpoint has lost its handles is simply
   * not drawn: pulling a pinned record around made its threads blink in and out, and took the
   * record with them.
   *
   * So React Flow owns the node list now, and the case file is reconciled into it: records
   * that are unchanged keep the very same object, which is what lets a drag stay smooth and
   * the threads stay attached.
   */
  const toNode = useCallback(
    (n: BoardNode): Node<NodeData> => ({
      id: n.id,
      type: n.kind,
      position: { x: n.x, y: n.y },
      data: { ref: n.ref, text: n.text },
      draggable: !readOnly,
    }),
    [readOnly],
  );

  useEffect(() => {
    setNodes((current) => {
      const live = new Map(current.map((n) => [n.id, n]));
      return shared.board.nodes.map((n) => {
        const prev = live.get(n.id);
        if (!prev) return toNode(n);
        const moved = prev.position.x !== n.x || prev.position.y !== n.y;
        const changed =
          prev.type !== n.kind || prev.data.ref !== n.ref || prev.data.text !== n.text || prev.draggable !== !readOnly;
        if (!moved && !changed) return prev;
        return { ...prev, ...toNode(n), selected: prev.selected };
      });
    });
  }, [shared.board.nodes, readOnly, toNode, setNodes]);

  const edges: Edge<{ kind: EdgeKind }>[] = useMemo(
    () =>
      shared.board.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "thread",
        data: { kind: e.kind },
        selected: selectedEdges.has(e.id),
      })),
    [shared.board.edges, selectedEdges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<NodeData>>[]) => {
      // React Flow moves and selects the nodes; the case file only needs to hear the result.
      onNodesChangeInternal(changes);
      for (const c of changes) {
        if (c.type === "position" && c.dragging === false) {
          const pos = c.position ?? getNode(c.id)?.position;
          if (pos) dispatch({ t: "board.move", id: c.id, x: Math.round(pos.x), y: Math.round(pos.y) });
        } else if (c.type === "remove" && !readOnly) {
          dispatch({ t: "board.remove", id: c.id });
        }
      }
    },
    [dispatch, readOnly, onNodesChangeInternal, getNode],
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

  // "Pin to board" places by a fixed grid, because it is dispatched from the evidence viewer
  // and the suspect file, neither of which knows where the board is scrolled to. So a pin
  // made while the board is panned elsewhere lands off-screen and looks like nothing
  // happened. Follow anything newly pinned, but only when it would otherwise be out of sight.
  const known = useRef(new Set(shared.board.nodes.map((n) => n.id)));
  useEffect(() => {
    const ids = shared.board.nodes.map((n) => n.id);
    const added = ids.filter((id) => !known.current.has(id));
    known.current = new Set(ids);
    const node = added.length ? shared.board.nodes.find((n) => n.id === added.at(-1)) : undefined;
    const box = wrapRef.current?.getBoundingClientRect();
    if (!node || !box) return;
    const { x, y, zoom } = getViewport();
    const left = node.x * zoom + x;
    const top = node.y * zoom + y;
    const onScreen = left > -40 && left < box.width - 60 && top > -40 && top < box.height - 60;
    if (!onScreen) setCenter(node.x + 90, node.y + 70, { zoom, duration: 420 });
  }, [shared.board.nodes, getViewport, setCenter]);

  return (
    <BoardContext.Provider value={ctx}>
      <div
        ref={wrapRef}
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
                + Unknown
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm bg-ink-950/80"
                  aria-expanded={personMenu}
                  onClick={() => setPersonMenu((v) => !v)}
                >
                  + Person <span aria-hidden="true">▾</span>
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
        <div className="board-cone" aria-hidden="true" />
        <div className="board-frame" aria-hidden="true" />
        <BoardLamp />
        <p
          className="pointer-events-none absolute right-8 top-5 z-[5] hidden -rotate-3 font-hand text-5xl leading-none text-[#e9e4d8]/70 md:block"
          aria-hidden="true"
        >
          Evidence
        </p>
        <div
          className="sticky-note pointer-events-none absolute right-10 top-20 z-[5] hidden h-20 w-20 rotate-6 items-center justify-center lg:flex"
          aria-hidden="true"
        >
          <span className="pin absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full" />
          <span className="font-hand text-3xl text-[#1f2c55]">who?</span>
        </div>

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
