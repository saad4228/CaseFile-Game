"use client";

import { useMemo, useState } from "react";
import { evidenceCode } from "@/components/evidence/format";
import type { Evidence, Location, Route } from "@/lib/game-engine/types";

function shortestPath(routes: Route[], from: string, to: string) {
  const adj = new Map<string, { to: string; m: number; mode: Route["mode"] }[]>();
  for (const r of routes) {
    adj.set(r.from, [...(adj.get(r.from) ?? []), { to: r.to, m: r.minutes, mode: r.mode }]);
    adj.set(r.to, [...(adj.get(r.to) ?? []), { to: r.from, m: r.minutes, mode: r.mode }]);
  }
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const todo = new Set(adj.keys());
  while (todo.size) {
    let u: string | null = null;
    for (const n of todo) if (dist.has(n) && (u === null || dist.get(n)! < dist.get(u)!)) u = n;
    if (u === null) break;
    todo.delete(u);
    if (u === to) break;
    for (const e of adj.get(u) ?? []) {
      const d = dist.get(u)! + e.m;
      if (d < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, d);
        prev.set(e.to, u);
      }
    }
  }
  if (!dist.has(to)) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0])!);
  return { minutes: dist.get(to)!, path };
}

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
  const [selected, setSelected] = useState<string>("blackwood_hotel");
  const [measure, setMeasure] = useState<string | null>(null);
  const byId = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);
  const sel = byId.get(selected)!;
  const route = measure && measure !== selected ? shortestPath(routes, measure, selected) : null;
  const linked = evidence.filter((e) => e.locations.includes(selected));

  const P = (id: string) => {
    const l = byId.get(id)!;
    return { x: l.x * 10, y: 40 + l.y * 6 };
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="relative min-h-[360px] flex-1 overflow-hidden">
        <svg viewBox="0 0 1000 680" className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Illustrated map of Vesper City">
          <rect width="1000" height="680" fill="#0e1216" />
          {/* city blocks */}
          {Array.from({ length: 14 }).map((_, r) =>
            Array.from({ length: 22 }).map((__, c) => (
              <rect key={`${r}-${c}`} x={20 + c * 45} y={70 + r * 44} width="38" height="36" fill="#141a20" />
            )),
          )}
          {/* river Vesper */}
          <path d="M-20 560 C200 520 360 600 520 560 C680 520 760 620 1020 600 L1020 680 L-20 680 Z" fill="#101c26" />
          <path d="M-20 560 C200 520 360 600 520 560 C680 520 760 620 1020 600" fill="none" stroke="#2d4558" strokeWidth="2" />
          <text x="560" y="620" fontFamily="var(--font-display)" fontStyle="italic" fontSize="22" fill="#3d5a70">
            River Vesper
          </text>
          {/* districts */}
          {[
            ["OLD QUARTER", 420, 300],
            ["SIGNAL HILL", 170, 190],
            ["PRINTWORKS", 700, 120],
            ["CIVIC CENTRE", 560, 230],
            ["WESTBANK", 70, 470],
            ["RIVER DISTRICT", 700, 500],
          ].map(([t, x, y]) => (
            <text key={t as string} x={x as number} y={y as number} fontFamily="var(--font-mono)" fontSize="11" letterSpacing="4" fill="#3a4651">
              {t}
            </text>
          ))}
          {/* Highway 9 north */}
          <path d={`M${P("blackwood_hotel").x} ${P("blackwood_hotel").y} L520 60 L520 20`} stroke="#2c343d" strokeWidth="6" fill="none" />
          <text x="532" y="34" fontFamily="var(--font-mono)" fontSize="11" fill="#718493">
            ↑ HWY 9 · LAKEMOOR 2 H
          </text>
          {/* routes */}
          {routes
            .filter((r) => r.to !== "lakemoor" && r.from !== "lakemoor")
            .map((r) => {
              const a = P(r.from);
              const b = P(r.to);
              const onPath = route?.path.some((p, i) => i > 0 && ((route.path[i - 1] === r.from && p === r.to) || (route.path[i - 1] === r.to && p === r.from)));
              return (
                <g key={`${r.from}-${r.to}`}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={onPath ? "#d98a3a" : "#2c343d"} strokeWidth={onPath ? 3 : 2} strokeDasharray={r.mode === "walk" ? "3 5" : undefined} />
                  <text x={(a.x + b.x) / 2 + 6} y={(a.y + b.y) / 2 - 6} fontFamily="var(--font-mono)" fontSize="11" fill={onPath ? "#f0ae55" : "#56656f"}>
                    {r.minutes} min{r.mode === "walk" ? " on foot" : ""}
                  </text>
                </g>
              );
            })}
          {/* locations */}
          {locations
            .filter((l) => l.id !== "lakemoor")
            .map((l) => {
              const p = P(l.id);
              const isSel = l.id === selected;
              const isFrom = l.id === measure;
              return (
                <g
                  key={l.id}
                  role="button"
                  tabIndex={0}
                  aria-label={l.name}
                  aria-pressed={isSel}
                  className="cursor-pointer outline-none"
                  onClick={() => setSelected(l.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(l.id)}
                >
                  <circle cx={p.x} cy={p.y} r={isSel ? 30 : 0} fill="#d98a3a" opacity="0.12" />
                  <circle cx={p.x} cy={p.y} r="8" fill={isSel ? "#f0ae55" : isFrom ? "#9c2929" : "#e7e2d8"} stroke="#080a0d" strokeWidth="3" />
                  <text x={p.x + 14} y={p.y + 4} fontFamily="var(--font-display)" fontSize="17" fill={isSel ? "#f0ae55" : "#e7e2d8"}>
                    {l.name}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      <aside className="scrollbar-thin w-full shrink-0 overflow-auto border-t border-ink-700 bg-ink-900 p-6 lg:w-[360px] lg:border-l lg:border-t-0">
        <p className="label">{sel.district}</p>
        <h3 className="font-display mt-1 text-3xl">{sel.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-bone-100/80">{sel.description}</p>

        <div className="mt-6 border-t border-ink-700 pt-5">
          <p className="label">Measure travel time</p>
          <div className="mt-2 flex items-center gap-2">
            <select
              aria-label="From"
              className="flex-1 border border-ink-600 bg-ink-950 px-2 py-2 text-sm"
              value={measure ?? ""}
              onChange={(e) => setMeasure(e.target.value || null)}
            >
              <option value="">From…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <span className="font-mono text-xs text-steel-400">→ {sel.name}</span>
          </div>
          {route && (
            <p className="mt-3 font-mono text-sm text-amber-300">
              {route.minutes >= 60 ? `${Math.floor(route.minutes / 60)} h ${route.minutes % 60} min` : `${route.minutes} min`}
              <span className="ml-2 text-steel-300">via {route.path.map((p) => byId.get(p)!.name).join(" → ")}</span>
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-ink-700 pt-5">
          <p className="label">Records tied to this place · {linked.length}</p>
          {linked.length ? (
            <ul className="mt-3 space-y-1.5">
              {linked.map((e) => (
                <li key={e.id}>
                  <button type="button" className="w-full text-left text-sm text-bone-100/80 hover:text-amber-300" onClick={() => onOpen(e.id)}>
                    <span className="font-mono text-[11px] text-steel-400">{evidenceCode(e.number)}</span> {e.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-bone-100/50">Nothing on file here yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
