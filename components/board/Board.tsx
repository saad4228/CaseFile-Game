"use client";

import {
  ConnectionMode,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/components/game/GameContext";
import type { BoardNode } from "@/lib/game-engine/state";
import type { EdgeKind } from "@/lib/game-engine/types";
import { play } from "@/lib/client/sound";
import { EVIDENCE_DRAG_TYPE } from "./constants";
import { BoardContext, type BoardCtx, type NodeData } from "./context";
import { edgeKindOrder, edgeKinds } from "./edgeKinds";
import { ArrowDefs, edgeTypes } from "./edges";
import { nodeTypes } from "./nodes";
import { keyBy } from "@/lib/collections";

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
      evidence: keyBy(evidence),
      suspects: keyBy(suspects),
      unseen: new Set(evidence.filter((e) => !personal.seen.includes(e.id)).map((e) => e.id)),
      readOnly,
      judged,
      onOpen,
      editEdge: setEditing,
    }),
    [evidence, suspects, personal.seen, onOpen, readOnly, judged],
  );

  /**
   * React Flow stores each node's measured size and handle positions on the node object.
   * Rebuilding nodes from the case file every frame discarded that, and an edge whose
   * endpoint has no handles is not drawn — so threads vanished mid-drag. React Flow owns
   * the list instead; unchanged nodes keep their identity.
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
      const live = keyBy(current);
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
      // React Flow handles the move; the case file only needs the result.
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

  // Pins are placed on a fixed grid by callers that don't know the current viewport, so a
  // new node can land off-screen. Scroll to it only when it would otherwise be out of sight.
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

/** Banker's lamp over the wall. The light pool itself is in `.casefile-board`. */
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

