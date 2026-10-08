"use client";

import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from "@xyflow/react";
import type { EdgeKind } from "@/lib/game-engine/types";
import { useBoard } from "./context";
import { edgeKindOrder, edgeKinds } from "./edgeKinds";

// A thread between two pinned records, and the arrowheads each kind of thread uses.

/** Thread drawn as a sagging rope with a shadow. */
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

export const edgeTypes = { thread: ThreadEdge };

export function ArrowDefs() {
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
