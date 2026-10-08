import type { Route } from "./types";

export interface Trip {
  /** Door to door, in minutes. */
  minutes: number;
  /** Every stop on the way, starting at `from` and ending at `to`. */
  path: string[];
  /** How you'd make it: on foot the whole way, driving, or a bit of both. */
  mode: "walk" | "drive" | "mixed";
}

/**
 * The quickest way between two places on the case map.
 *
 * The map and the timeline both ask the same question — could this person have been there by
 * then? — so the answer is worked out in one place and read by both.
 */
export function travel(routes: Route[], from: string, to: string): Trip | null {
  if (from === to) return { minutes: 0, path: [from], mode: "walk" };

  const adj = new Map<string, { to: string; minutes: number; mode: Route["mode"] }[]>();
  const link = (a: string, b: string, minutes: number, mode: Route["mode"]) =>
    adj.set(a, [...(adj.get(a) ?? []), { to: b, minutes, mode }]);
  for (const r of routes) {
    link(r.from, r.to, r.minutes, r.mode);
    link(r.to, r.from, r.minutes, r.mode);
  }

  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, { at: string; mode: Route["mode"] }>();
  const todo = new Set(adj.keys());
  todo.add(from);

  while (todo.size) {
    let near: string | null = null;
    for (const n of todo) if (dist.has(n) && (near === null || dist.get(n)! < dist.get(near)!)) near = n;
    if (near === null) break;
    todo.delete(near);
    if (near === to) break;
    for (const hop of adj.get(near) ?? []) {
      const d = dist.get(near)! + hop.minutes;
      if (d < (dist.get(hop.to) ?? Infinity)) {
        dist.set(hop.to, d);
        prev.set(hop.to, { at: near, mode: hop.mode });
      }
    }
  }

  if (!dist.has(to)) return null;

  const path = [to];
  const modes: Route["mode"][] = [];
  while (path[0] !== from) {
    const step = prev.get(path[0]);
    if (!step) return null;
    modes.push(step.mode);
    path.unshift(step.at);
  }

  const walked = modes.every((m) => m === "walk");
  const drove = modes.every((m) => m === "drive");
  return { minutes: dist.get(to)!, path, mode: walked ? "walk" : drove ? "drive" : "mixed" };
}

/** "15 min", "1 h 20 min" — travel times are read aloud more often than they're compared. */
export const spokenMinutes = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim() : `${m} min`;

export const onFoot = (mode: Trip["mode"]) => (mode === "walk" ? " on foot" : "");
