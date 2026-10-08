"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { useGame } from "@/components/game/GameContext";
import { SuspectPhoto } from "@/components/illustrations/SuspectPhoto";
import { useBoard, type NodeData } from "./context";

// The five things that can be pinned to the board, and the pin and tack that hold them.

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

/** Visible way to remove a node. Delete also works, but touch screens have no Delete key. */
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

export const nodeTypes = { evidence: EvidenceNode, suspect: SuspectNode, note: NoteNode, unknown: UnknownNode, location: NoteNode };

/** A small stable tilt per item so the board looks hand-pinned (−2.5° … 2.5°). */
export function tilt(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 50) - 25) / 10;
}
