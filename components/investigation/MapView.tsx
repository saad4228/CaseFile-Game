"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { evidenceCode, formatMinutes, minutesFrom22 } from "@/components/evidence/format";
import { BlackwoodHotel } from "@/components/illustrations/Blackwood";
import { useGame } from "@/components/game/GameContext";
import { mulberry32 } from "@/lib/random";
import { onFoot, spokenMinutes, travel } from "@/lib/game-engine/travel";
import type { Evidence, Location, Route } from "@/lib/game-engine/types";

/**
 * Vesper City, and the one question worth asking of it: could somebody have got from here to
 * there in the time they had? Pick two places and the map answers in the case's own terms —
 * the minutes, and the latest you could have left and still made the window.
 */

const W = 1000;
const H = 680;
/** Lakemoor is two hours north; it belongs on the road out, not on the street plan. */
const OFF_MAP = "lakemoor";

const pos = (l: Location) => ({ x: 90 + l.x * 9.2, y: 110 + l.y * 6.2 });

/** District names sit where nothing else does, so they never cross a pin or its label. */
const DISTRICTS: { name: string; x: number; y: number }[] = [
  { name: "SIGNAL HILL", x: 150, y: 196 },
  { name: "PRINTWORKS", x: 790, y: 160 },
  { name: "CIVIC CENTRE", x: 700, y: 268 },
  { name: "OLD QUARTER", x: 400, y: 432 },
  { name: "WESTBANK", x: 112, y: 556 },
];

export function MapView({
  locations,
  routes,
  evidence,
  onOpen,
}: {
  locations: Location[];
  routes: Route[];
  evidence: Evidence[];
  onOpen: (id: string) => void;
}) {
  const { meta, suspects } = useGame();
  const [selected, setSelected] = useState<string>("blackwood_hotel");
  const [from, setFrom] = useState<string | null>(null);
  const [hoverRoute, setHoverRoute] = useState<string | null>(null);

  // The plan is bigger than most screens once you lean in, so it can be dragged and zoomed.
  // "slice" cropped it with no way to reach what fell outside; it fits by default now.
  const [view, setView] = useState({ x: 0, y: 0, w: W, h: H });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);
  const [panning, setPanning] = useState(false);

  const byId = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);
  const sel = byId.get(selected) ?? locations[0];
  const trip = from && from !== selected ? travel(routes, from, selected) : null;
  const linked = evidence.filter((e) => e.locations.includes(selected));

  const focus = meta.night?.focus;
  const focusFrom = focus ? minutesFrom22(focus.from) : null;


  /** Zoom about a point, or about the middle when none is given. */
  const zoomBy = (factor: number, at?: { x: number; y: number }) =>
    setView((v) => {
      const w = Math.min(W, Math.max(W / 4, v.w / factor));
      const h = w * (H / W);
      const fx = at ? (at.x - v.x) / v.w : 0.5;
      const fy = at ? (at.y - v.y) / v.h : 0.5;
      // Keep whatever was under the cursor under the cursor, then stay inside the plan.
      const x = Math.min(W - w, Math.max(0, v.x + (v.w - w) * fx));
      const y = Math.min(H - h, Math.max(0, v.y + (v.h - h) * fy));
      return { x, y, w, h };
    });

  const toPlan = (clientX: number, clientY: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: view.x + ((clientX - r.left) / r.width) * view.w, y: view.y + ((clientY - r.top) / r.height) * view.h };
  };

  /**
   * Panning listens on the window rather than capturing the pointer: capturing retargets the
   * click that follows to the <svg>, which stopped the pins underneath from being selected.
   * A press that never travels more than a few pixels is left alone to become a click.
   */
  const onPointerDown = (ev: React.PointerEvent<SVGSVGElement>) => {
    if (ev.button !== 0) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const from = { px: ev.clientX, py: ev.clientY, vx: view.x, vy: view.y };
    drag.current = from;

    const move = (e: PointerEvent) => {
      const dx = e.clientX - from.px;
      const dy = e.clientY - from.py;
      if (!panning && Math.hypot(dx, dy) < 4) return;
      setPanning(true);
      setView((v) => ({
        ...v,
        x: Math.min(W - v.w, Math.max(0, from.vx - (dx / rect.width) * v.w)),
        y: Math.min(H - v.h, Math.max(0, from.vy - (dy / rect.height) * v.h)),
      }));
    };
    const up = () => {
      drag.current = null;
      setPanning(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const P = (id: string) => {
    const l = byId.get(id);
    return l ? pos(l) : { x: W / 2, y: H / 2 };
  };

  // The street plan. Seeded, so the city is the same city every time it is drawn.
  const blocks = useMemo(() => {
    const rand = mulberry32(47);
    const out: { x: number; y: number; w: number; h: number; tone: number }[] = [];
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 17; col++) {
        if (rand() < 0.1) continue; // a yard, a lot, a gap in the terrace
        const w = 36 + rand() * 20;
        const h = 30 + rand() * 16;
        out.push({
          x: 24 + col * 58 + rand() * 7,
          y: 84 + row * 50 + rand() * 6,
          w,
          h,
          tone: rand(),
        });
      }
    }
    return out;
  }, []);

  const onRoute = (r: Route) =>
    !!trip?.path.some((p, i) => i > 0 && ((trip.path[i - 1] === r.from && p === r.to) || (trip.path[i - 1] === r.to && p === r.from)));

  const pick = (id: string) => {
    if (id === selected) {
      setFrom(null);
      return;
    }
    // The place you were looking at becomes the place you are measuring from.
    setFrom(selected);
    setSelected(id);
  };

  const whoWasHere = suspects.filter((s) => evidence.some((e) => e.locations.includes(selected) && e.suspects.includes(s.id)));

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <div className="relative min-h-[320px] flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className={`h-full w-full touch-none ${panning ? "cursor-grabbing" : "cursor-grab"}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Street plan of Vesper City"
          onPointerDown={onPointerDown}
          onWheel={(ev) => {
            const at = toPlan(ev.clientX, ev.clientY);
            zoomBy(ev.deltaY < 0 ? 1.2 : 1 / 1.2, at ?? undefined);
          }}
        >
          <defs>
            <radialGradient id="map-glow" cx="50%" cy="55%" r="65%">
              <stop offset="0%" stopColor="#16202b" />
              <stop offset="100%" stopColor="#090c10" />
            </radialGradient>
            <pattern id="map-tooth" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.45" fill="#2b3845" opacity="0.5" />
            </pattern>
            <marker id="map-head" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0 0 L7 3.5 L0 7 z" fill="#f0ae55" />
            </marker>
          </defs>

          <rect width={W} height={H} fill="url(#map-glow)" />
          <rect width={W} height={H} fill="url(#map-tooth)" />

          {/* the blocks, and the streets that are the gaps between them */}
          {blocks.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx="1.5"
              fill={b.tone > 0.86 ? "#1b242d" : "#141c24"}
              stroke="#1e2831"
              strokeWidth="1"
            />
          ))}

          {/* two avenues cut across the grid */}
          <path d="M-20 300 L1020 232" stroke="#0c1015" strokeWidth="13" fill="none" />
          <path d="M300 -20 L470 700" stroke="#0c1015" strokeWidth="13" fill="none" />

          {/* the Vesper */}
          <path d="M-20 596 C180 556 340 638 520 600 C690 564 800 650 1020 628 L1020 700 L-20 700 Z" fill="#0d1a24" />
          <path d="M-20 596 C180 556 340 638 520 600 C690 564 800 650 1020 628" fill="none" stroke="#28404f" strokeWidth="2" />
          <path d="M452 566 L470 650" stroke="#2c3842" strokeWidth="7" />
          <text x="446" y="676" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="2" fill="#4a6273">
            CALDER BRIDGE
          </text>
          <text x="120" y="652" fontFamily="var(--font-display)" fontStyle="italic" fontSize="21" fill="#3d5a70">
            River Vesper
          </text>

          {DISTRICTS.map((d) => (
            <text
              key={d.name}
              x={d.x}
              y={d.y}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="10"
              letterSpacing="4.5"
              fill="#36434f"
            >
              {d.name}
            </text>
          ))}

          {/* the road out of town */}
          <path d={`M${P("blackwood_hotel").x} ${P("blackwood_hotel").y} L520 54 L520 18`} stroke="#1a222a" strokeWidth="7" fill="none" />
          <text x="534" y="34" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.5" fill="#56656f">
            ↑ HWY 9 · LAKEMOOR, 2 H
          </text>

          {/* every road the case knows about */}
          {routes
            .filter((r) => r.to !== OFF_MAP && r.from !== OFF_MAP)
            .map((r) => {
              const a = P(r.from);
              const b = P(r.to);
              const live = onRoute(r);
              const key = `${r.from}-${r.to}`;
              const lit = live || hoverRoute === key;
              return (
                <g key={key} onMouseEnter={() => setHoverRoute(key)} onMouseLeave={() => setHoverRoute(null)}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="18" />
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={live ? "#f0ae55" : lit ? "#56656f" : "#222c35"}
                    strokeWidth={live ? 3.5 : 2}
                    strokeDasharray={r.mode === "walk" ? "4 6" : undefined}
                    markerEnd={live ? "url(#map-head)" : undefined}
                  />
                  {lit && (
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2 - 8}
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                      fontSize="11"
                      fill={live ? "#f0ae55" : "#8b9aa6"}
                    >
                      {r.minutes} min{r.mode === "walk" ? " on foot" : ""}
                    </text>
                  )}
                </g>
              );
            })}

          {/* the places themselves */}
          {locations
            .filter((l) => l.id !== OFF_MAP)
            .map((l) => {
              const p = pos(l);
              const isSel = l.id === selected;
              const isFrom = l.id === from;
              const count = evidence.filter((e) => e.locations.includes(l.id)).length;
              return (
                <g
                  key={l.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${l.name}${count ? `, ${count} records` : ""}`}
                  aria-pressed={isSel}
                  className="cursor-pointer outline-none"
                  onClick={() => pick(l.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pick(l.id)}
                >
                  {isSel && <circle cx={p.x} cy={p.y} r="26" fill="#f0ae55" opacity="0.12" />}
                  {isFrom && <circle cx={p.x} cy={p.y} r="20" fill="#c24a3f" opacity="0.18" />}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSel || isFrom ? 9 : 7}
                    fill={isSel ? "#f0ae55" : isFrom ? "#c24a3f" : count ? "#e7e2d8" : "#6c7a86"}
                    stroke="#080a0d"
                    strokeWidth="3"
                  />
                  <text
                    x={p.x + 15}
                    y={p.y + 5}
                    fontFamily="var(--font-display)"
                    fontSize="17"
                    fill={isSel ? "#f0ae55" : isFrom ? "#e0a59e" : "#e7e2d8"}
                  >
                    {l.name}
                  </text>
                  {count > 0 && (
                    <text x={p.x + 15} y={p.y + 20} fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1.4" fill="#6c7a86">
                      {count} ON FILE
                    </text>
                  )}
                </g>
              );
            })}
        </svg>

        {/* zoom, for touch and for anyone who doesn't think to scroll on a map */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
          <button
            type="button"
            className="btn btn-ghost btn-sm !px-2.5 bg-ink-950/85"
            onClick={() => zoomBy(1.4)}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm !px-2.5 bg-ink-950/85"
            onClick={() => zoomBy(1 / 1.4)}
            aria-label="Zoom out"
          >
            −
          </button>
          {(view.w < W || view.x > 0 || view.y > 0) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm !px-2 bg-ink-950/85 font-mono !text-[9px]"
              onClick={() => setView({ x: 0, y: 0, w: W, h: H })}
            >
              FIT
            </button>
          )}
        </div>

        {/* how the map is worked, and what it just told you */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
          <AnimatePresence mode="wait">
            {trip ? (
              <motion.div
                key="trip"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="panel pointer-events-auto max-w-[92%] px-4 py-2.5"
              >
                <p className="font-mono text-[13px] text-amber-300">
                  {byId.get(from!)?.name} → {sel.name} ·{" "}
                  <span className="text-bone-100">
                    {spokenMinutes(trip.minutes)}
                    {onFoot(trip.mode)}
                  </span>
                </p>
                {focus && focusFrom !== null && (
                  <p className="mt-1 text-[12px] text-bone-100/75">
                    To be at {sel.name} by {focus.from}, you leave {byId.get(from!)?.name} by{" "}
                    <span className="text-bone-100">{formatMinutes(focusFrom - trip.minutes)}</span>.
                  </p>
                )}
                {trip.path.length > 2 && (
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-steel-400">
                    via {trip.path.slice(1, -1).map((p) => byId.get(p)?.name ?? p).join(" · ")}
                  </p>
                )}
                <button type="button" className="label mt-1.5 hover:text-bone-100" onClick={() => setFrom(null)}>
                  Clear ✕
                </button>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="panel px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-steel-300"
              >
                {view.w < W ? "Drag to move the map" : "Scroll or + to zoom in"} · pick a second place to measure the journey
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <aside className="scrollbar-thin w-full shrink-0 overflow-auto border-t border-ink-700 bg-ink-900 p-6 lg:w-[340px] lg:border-l lg:border-t-0">
        {selected === "blackwood_hotel" && (
          <div className="photo-print mb-5 w-full max-w-[200px] -rotate-1">
            <BlackwoodHotel className="block w-full" />
          </div>
        )}
        <p className="label">{sel.district}</p>
        <h3 className="font-display mt-1 text-3xl">{sel.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-bone-100/80">{sel.description}</p>

        {whoWasHere.length > 0 && (
          <div className="mt-5 border-t border-ink-700 pt-4">
            <p className="label">Placed here by the records</p>
            <p className="mt-2 text-sm text-bone-100/85">{whoWasHere.map((s) => s.name).join(", ")}</p>
          </div>
        )}

        <div className="mt-5 border-t border-ink-700 pt-4">
          <p className="label">Records tied to this place · {linked.length}</p>
          {linked.length ? (
            <ul className="mt-3 space-y-1.5">
              {linked.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="w-full py-1.5 text-left text-sm text-bone-100/80 hover:text-amber-300 md:py-0"
                    onClick={() => onOpen(e.id)}
                  >
                    <span className="font-mono text-[11px] text-steel-400">
                      {evidenceCode(e.number)}
                      {e.time ? ` · ${e.time}` : ""}
                    </span>{" "}
                    {e.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-bone-100/50">Nothing on file here yet.</p>
          )}
        </div>

        <div className="mt-5 border-t border-ink-700 pt-4">
          <p className="label">Measure from</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {locations
              .filter((l) => l.id !== selected)
              .map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={from === l.id}
                  onClick={() => setFrom((f) => (f === l.id ? null : l.id))}
                  className={`border px-2 py-1.5 text-[11px] ${
                    from === l.id ? "border-crimson-400 text-[#e0a59e]" : "border-ink-600 text-steel-300 hover:border-amber-500 hover:text-bone-100"
                  }`}
                >
                  {l.name}
                </button>
              ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
