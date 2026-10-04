"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { evidenceCode, formatMinutes, minutesFrom22 } from "@/components/evidence/format";
import { useInvestigation, type CustomEvent } from "@/components/investigation/store";
import type { Evidence } from "@/lib/game-engine/types";

const SPAN = 180; // 22:00 → 01:00
const CARD_W = 168;

type Item =
  | { type: "evidence"; id: string; at: number; e: Evidence }
  | { type: "custom"; id: string; at: number; c: CustomEvent };

export function TimelineView({ evidence, onOpen }: { evidence: Evidence[]; onOpen: (id: string) => void }) {
  const { state, dispatch, newId } = useInvestigation();
  const [scale, setScale] = useState(9); // px per minute
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; at: number } | null>(null);

  const timed = evidence.filter((e) => e.time && minutesFrom22(e.time) !== null);
  const unplaced = timed.filter((e) => !state.timeline.placed.includes(e.id));

  const placed: Item[] = timed
    .filter((e) => state.timeline.placed.includes(e.id))
    .map((e) => ({ type: "evidence", id: e.id, at: minutesFrom22(e.time!)!, e }));
  const custom: Item[] = state.timeline.custom.map((c) => ({
    type: "custom",
    id: c.id,
    at: dragging?.id === c.id ? dragging.at : (minutesFrom22(c.time) ?? 90),
    c,
  }));
  const items = [...placed, ...custom].sort((a, b) => a.at - b.at);

  // Greedy lane assignment so cards don't overlap.
  const lanes = (() => {
    const ends: number[] = [];
    const out = new Map<string, number>();
    for (const it of items) {
      const x = it.at * scale;
      let lane = ends.findIndex((end) => end < x - 8);
      if (lane === -1) {
        lane = ends.length;
        ends.push(0);
      }
      ends[lane] = x + CARD_W;
      out.set(it.id, lane);
    }
    return { map: out, count: Math.max(1, ends.length) };
  })();

  // Gaps between consecutive placed moments (player's own reconstruction).
  const gaps = (() => {
    const times = Array.from(new Set(items.map((i) => i.at))).sort((a, b) => a - b);
    const out: { from: number; to: number }[] = [];
    for (let i = 1; i < times.length; i++) if (times[i] - times[i - 1] >= 12) out.push({ from: times[i - 1], to: times[i] });
    return out;
  })();

  const width = SPAN * scale + 200;
  const laneH = 92;
  const trackTop = lanes.count * laneH + 40;

  const addUnknown = () =>
    dispatch({ type: "customAdd", event: { id: `c-${newId()}`, time: "23:30", label: "" } });

  const startDrag = (ev: React.PointerEvent, c: CustomEvent) => {
    const track = trackRef.current;
    if (!track) return;
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const rect = track.getBoundingClientRect();
    const toMin = (clientX: number) => Math.max(0, Math.min(SPAN, Math.round((clientX - rect.left + track.scrollLeft - 100) / scale)));
    const move = (e: PointerEvent) => setDragging({ id: c.id, at: toMin(e.clientX) });
    const up = (e: PointerEvent) => {
      dispatch({ type: "customUpdate", event: { ...c, time: formatMinutes(toMin(e.clientX)) } });
      setDragging(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="flex h-full flex-col">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-700 px-4 py-3 md:px-6">
        <p className="label mr-2">Timeline · Nov 14, 22:00 – 01:00</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addUnknown}>
          + ????? event
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="label">Scale</span>
          {[5, 9, 15].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scale === s}
              onClick={() => setScale(s)}
              className={`border px-2 py-1 font-mono text-[10px] ${scale === s ? "border-amber-500 text-amber-300" : "border-ink-600 text-steel-300"}`}
            >
              {s === 5 ? "3h" : s === 9 ? "90m" : "45m"}
            </button>
          ))}
        </div>
      </div>

      {/* unplaced */}
      <div className="border-b border-ink-700 px-4 py-3 md:px-6">
        <p className="label">Timestamped records not yet placed · {unplaced.length}</p>
        {unplaced.length ? (
          <div className="scrollbar-thin mt-2 flex gap-2 overflow-x-auto pb-1">
            {unplaced.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => dispatch({ type: "timelinePlace", id: e.id })}
                className="shrink-0 border border-ink-600 px-3 py-1.5 text-left font-mono text-[11px] text-bone-100/80 hover:border-amber-500 hover:text-bone-100"
                title={`Place ${e.title} on the timeline`}
              >
                <span className="text-amber-300">{e.time}</span> {evidenceCode(e.number)} {e.title} <span aria-hidden="true">＋</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-bone-100/50">Every timestamped record you hold is on the line.</p>
        )}
      </div>

      {/* desktop track */}
      <div ref={trackRef} className="scrollbar-thin relative hidden min-h-0 flex-1 overflow-auto md:block">
        <div className="relative" style={{ width, height: trackTop + 120 }}>
          {/* gaps */}
          {gaps.map((g) => (
            <div
              key={`${g.from}-${g.to}`}
              className="absolute border-x border-dashed border-steel-400/30"
              style={{
                left: 100 + g.from * scale,
                width: (g.to - g.from) * scale,
                top: 0,
                height: trackTop + 60,
                background: "repeating-linear-gradient(135deg, rgba(113,132,147,.07) 0 6px, transparent 6px 12px)",
              }}
            >
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-[0.2em] text-steel-400">
                GAP · {g.to - g.from} MIN
              </span>
            </div>
          ))}

          {/* axis */}
          <div className="absolute h-px bg-bone-100/30" style={{ left: 100, width: SPAN * scale, top: trackTop }} />
          {Array.from({ length: SPAN / 5 + 1 }).map((_, i) => {
            const m = i * 5;
            const major = m % 15 === 0;
            return (
              <div key={m} className="absolute" style={{ left: 100 + m * scale, top: trackTop }}>
                <div className={`w-px ${major ? "h-3 bg-bone-100/50" : "h-1.5 bg-bone-100/25"}`} />
                {major && (
                  <span className="absolute left-0 top-4 -translate-x-1/2 font-mono text-[10px] text-steel-300">{formatMinutes(m)}</span>
                )}
              </div>
            );
          })}

          {/* items */}
          {items.map((it) => {
            const lane = lanes.map.get(it.id) ?? 0;
            const left = 100 + it.at * scale;
            const top = trackTop - (lane + 1) * laneH;
            return (
              <div key={it.id}>
                <div className="absolute w-px bg-crimson-600/50" style={{ left, top: top + 70, height: trackTop - top - 70 }} />
                <div className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson-600" style={{ left, top: trackTop }} />
                {it.type === "evidence" ? (
                  <motion.div
                    className="paper absolute px-3 py-2"
                    style={{ left, top, width: CARD_W }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <button type="button" className="block w-full text-left" onClick={() => onOpen(it.e.id)}>
                      <p className="font-mono text-[11px] font-semibold text-[#1d1a14]">
                        {it.e.time} · {evidenceCode(it.e.number)}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#1d1a14]">{it.e.title}</p>
                    </button>
                    <button
                      type="button"
                      className="absolute right-1 top-1 px-1 text-[11px] text-[#1d1a14]/50 hover:text-crimson-600"
                      onClick={() => dispatch({ type: "timelineRemove", id: it.e.id })}
                      aria-label={`Remove ${it.e.title} from timeline`}
                    >
                      ✕
                    </button>
                  </motion.div>
                ) : (
                  <div
                    className="absolute border border-dashed border-crimson-400/80 bg-ink-950 px-3 py-2"
                    style={{ left, top, width: CARD_W }}
                  >
                    <div
                      className="cursor-ew-resize touch-none select-none font-mono text-[11px] font-semibold text-crimson-400"
                      onPointerDown={(ev) => startDrag(ev, it.c)}
                      title="Drag to move in time"
                    >
                      ⇔ {formatMinutes(it.at)} · ?????
                    </div>
                    <input
                      aria-label="What happened?"
                      className="mt-1 w-full bg-transparent text-[12px] text-bone-100 outline-none placeholder:text-steel-400"
                      placeholder="what happened?"
                      value={it.c.label}
                      onChange={(ev) => dispatch({ type: "customUpdate", event: { ...it.c, label: ev.target.value } })}
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 px-1 text-[11px] text-steel-400 hover:text-crimson-400"
                      onClick={() => dispatch({ type: "customRemove", id: it.c.id })}
                      aria-label="Remove event"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <p className="font-display absolute left-1/2 -translate-x-1/2 text-3xl italic text-bone-100/60" style={{ top: trackTop - 80 }}>
              Nothing placed yet. Start with what you&apos;re sure of.
            </p>
          )}
        </div>
      </div>

      {/* mobile: vertical */}
      <ol className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4 md:hidden">
        {items.map((it) => (
          <li key={it.id} className="grid grid-cols-[56px_1fr] gap-3">
            <span className="pt-2 font-mono text-xs text-amber-300">{formatMinutes(it.at)}</span>
            {it.type === "evidence" ? (
              <button type="button" className="paper px-3 py-2 text-left" onClick={() => onOpen(it.e.id)}>
                <p className="font-mono text-[10px] text-[#1d1a14]/70">{evidenceCode(it.e.number)}</p>
                <p className="text-sm text-[#1d1a14]">{it.e.title}</p>
              </button>
            ) : (
              <div className="border border-dashed border-crimson-400/80 px-3 py-2">
                <input
                  aria-label="Time"
                  className="w-20 bg-transparent font-mono text-xs text-crimson-400 outline-none"
                  value={it.c.time}
                  onChange={(ev) => dispatch({ type: "customUpdate", event: { ...it.c, time: ev.target.value } })}
                />
                <input
                  aria-label="What happened?"
                  className="mt-1 w-full bg-transparent text-sm text-bone-100 outline-none placeholder:text-steel-400"
                  placeholder="what happened?"
                  value={it.c.label}
                  onChange={(ev) => dispatch({ type: "customUpdate", event: { ...it.c, label: ev.target.value } })}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
