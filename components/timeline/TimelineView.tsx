"use client";

import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { evidenceCode, formatMinutes, minutesFrom22 } from "@/components/evidence/format";
import { useGame } from "@/components/game/GameContext";
import { SuspectPhoto } from "@/components/illustrations/SuspectPhoto";
import { onFoot, travel } from "@/lib/game-engine/travel";
import type { CustomEvent } from "@/lib/game-engine/state";
import type { Evidence, Suspect } from "@/lib/game-engine/types";

/**
 * The night, as one screen.
 *
 * Every timestamped record the team holds is laid out against the clock in the lane of the
 * person it concerns, so the view answers the only question the case really asks: who can be
 * accounted for while Daniel was dying, and who cannot. Nothing scrolls sideways and nothing
 * has to be placed by hand — the chart is the case file, read back.
 */

const PIP_MIN = 52; // just the time, when records are stacked up against each other
const PIP_MAX = 184; // the time and what the record is
const ROW_H = 24;
const LANE_PAD = 14;
const NOMINAL_W = 980; // rows are assigned against a representative track width

type Pip = { id: string; at: number; row: number; room: number; e?: Evidence; custom?: CustomEvent };
type Lane = { id: string; name: string; suspect?: Suspect; pips: Pip[]; rows: number };
type Leg = { from: number; to: number; label: string; impossible: boolean; still: boolean };

export function TimelineView({ onOpen }: { onOpen: (id: string) => void }) {
  const { meta, evidence, suspects, locations, routes, shared, dispatch, newId, phase } = useGame();
  const readOnly = phase === "RESOLVED";
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; at: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const night = meta.night ?? { from: "22:00", to: "00:30", focus: undefined };
  const start = minutesFrom22(night.from) ?? 0;
  const end = minutesFrom22(night.to) ?? 150;
  const span = Math.max(30, end - start);
  const focus = night.focus;
  const focusFrom = focus ? minutesFrom22(focus.from) : null;
  const focusTo = focus ? minutesFrom22(focus.to) : null;

  const placeName = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);

  // Timestamped records, split into the night itself and what came after the body was found.
  const { timed, after } = useMemo(() => {
    const all = evidence
      .map((e) => ({ e, at: e.time ? minutesFrom22(e.time) : null }))
      .filter((r): r is { e: Evidence; at: number } => r.at !== null)
      .sort((a, b) => a.at - b.at);
    return { timed: all.filter((r) => r.at <= end), after: all.filter((r) => r.at > end) };
  }, [evidence, end]);

  // Narrow screens read the night as one column, so records and your own moments interleave.
  const downward = useMemo(() => {
    const rows: { id: string; at: number; e?: Evidence; custom?: CustomEvent }[] = timed.map((r) => ({
      id: r.e.id,
      at: r.at,
      e: r.e,
    }));
    for (const c of shared.timeline.custom) rows.push({ id: c.id, at: minutesFrom22(c.time) ?? start, custom: c });
    return rows.sort((a, b) => a.at - b.at);
  }, [timed, shared.timeline.custom, start]);

  const pct = (m: number) => ((m - start) / span) * 100;

  const lanes: Lane[] = useMemo(() => {
    // Pips crowd — 23:43 and 23:46 are three minutes and twenty-six pixels apart — so each
    // lane stacks its own rows rather than letting them collide.
    const layout = (items: { id: string; at: number; e?: Evidence; custom?: CustomEvent }[]) => {
      const ends: number[] = [];
      const placed = items
        .slice()
        .sort((a, b) => a.at - b.at)
        .map((it) => {
          const x = ((it.at - start) / span) * NOMINAL_W;
          let row = ends.findIndex((e) => e <= x);
          if (row === -1) {
            row = ends.length;
            ends.push(0);
          }
          ends[row] = x + PIP_MIN + 6;
          return { ...it, row, x };
        });
      // A record spells out what it is when the next one in its row leaves room, and shrinks
      // back to the bare time when it doesn't. Nobody should have to hover to read a chart.
      const pips: Pip[] = placed.map((it, i) => {
        const next = placed.slice(i + 1).find((o) => o.row === it.row);
        const room = Math.min(PIP_MAX, next ? Math.max(PIP_MIN, next.x - it.x - 6) : PIP_MAX);
        return { id: it.id, at: it.at, row: it.row, room, e: it.e, custom: it.custom };
      });
      return { pips, rows: Math.max(1, ends.length) };
    };

    const out: Lane[] = suspects.map((s) => {
      const mine = timed.filter((r) => r.e.suspects.includes(s.id)).map((r) => ({ id: r.e.id, at: r.at, e: r.e }));
      return { id: s.id, name: s.name, suspect: s, ...layout(mine) };
    });
    const loose = timed.filter((r) => r.e.suspects.length === 0).map((r) => ({ id: r.e.id, at: r.at, e: r.e }));
    if (loose.length) out.push({ id: "__scene", name: "The room itself", ...layout(loose) });
    const custom = shared.timeline.custom.map((c) => ({
      id: c.id,
      at: dragging?.id === c.id ? dragging.at : (minutesFrom22(c.time) ?? start + span / 2),
      custom: c,
    }));
    out.push({ id: "__mine", name: "What you think", ...layout(custom) });
    return out;
  }, [suspects, timed, shared.timeline.custom, dragging, start, span]);

  /** What a person's own records say they were doing between one of them and the next. */
  const legsOf = useMemo(() => {
    const out = new Map<string, Leg[]>();
    for (const lane of lanes) {
      const known = lane.pips.filter((p) => p.e?.location);
      const legs: Leg[] = [];
      for (let i = 1; i < known.length; i++) {
        const a = known[i - 1];
        const b = known[i];
        const al = a.e!.location!;
        const bl = b.e!.location!;
        const spare = b.at - a.at;
        if (al === bl) {
          legs.push({ from: a.at, to: b.at, label: `at ${placeName.get(al) ?? al}`, impossible: false, still: true });
          continue;
        }
        const trip = travel(routes, al, bl);
        if (!trip || trip.minutes <= spare) continue;
        legs.push({
          from: a.at,
          to: b.at,
          label: `couldn't have made it — ${placeName.get(al) ?? al} to ${placeName.get(bl) ?? bl} takes ${trip.minutes} min${onFoot(trip.mode)}, and they had ${spare}`,
          impossible: true,
          still: false,
        });
      }
      out.set(lane.id, legs);
    }
    return out;
  }, [lanes, routes, placeName]);

  /**
   * Nobody can be ruled in or out of a window they left no trace in — so say which it is, in
   * words, beside their name. Reading a chart is a skill; reading four words is not.
   */
  const standing = useMemo(() => {
    const out = new Map<string, { text: string; cls: string; blind: boolean }>();
    if (focusFrom === null || focusTo === null) return out;
    for (const lane of lanes) {
      if (!lane.suspect) continue;
      if (lane.pips.length === 0) {
        out.set(lane.id, { text: "Nothing on file at all", cls: "text-steel-400", blind: true });
        continue;
      }
      const inWindow = lane.pips.some((p) => p.e && p.at >= focusFrom - 1 && p.at <= focusTo + 1);
      const covered = (legsOf.get(lane.id) ?? []).some((l) => l.still && l.from <= focusFrom && l.to >= focusTo);
      out.set(
        lane.id,
        inWindow || covered
          ? { text: "On record while he died", cls: "text-bone-100/55", blind: false }
          : { text: "Nothing while he died", cls: "text-crimson-400", blind: true },
      );
    }
    return out;
  }, [lanes, legsOf, focusFrom, focusTo]);

  const blindCount = useMemo(() => [...standing.values()].filter((v) => v.blind).length, [standing]);

  const addMoment = () =>
    dispatch({ t: "custom.add", event: { id: newId(), time: formatMinutes(focusFrom ?? start + span / 2), label: "" } });

  const startDrag = (ev: React.PointerEvent, c: CustomEvent) => {
    const track = trackRef.current;
    if (!track) return;
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const rect = track.getBoundingClientRect();
    const toMin = (clientX: number) =>
      Math.max(start, Math.min(end, Math.round(start + ((clientX - rect.left) / rect.width) * span)));
    const move = (e: PointerEvent) => setDragging({ id: c.id, at: toMin(e.clientX) });
    const up = (e: PointerEvent) => {
      dispatch({ t: "custom.update", event: { ...c, time: formatMinutes(toMin(e.clientX)) } });
      setDragging(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const ticks = useMemo(() => {
    const step = span > 180 ? 60 : 30;
    const out: number[] = [];
    for (let m = Math.ceil(start / step) * step; m <= end; m += step) out.push(m);
    return out;
  }, [start, end, span]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* what the chart is for, said once */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-ink-700 px-4 py-3 md:px-6">
        <p className="label">
          The night · {night.from}–{night.to}
        </p>
        {/* The two layouts need two explanations: a narrow screen reads a list, not rows. */}
        <p className="hidden text-sm text-bone-100/65 md:block">
          One row per person. Each tag is a record that mentions them, at the time it happened.
          {focus ? " The red band is when Daniel died." : ""}
        </p>
        <p className="text-sm text-bone-100/65 md:hidden">
          Every record with a time on it, in order.{focus ? " The red ones happened while Daniel died." : ""}
        </p>
        {focus && blindCount > 0 && (
          <p className="text-sm text-crimson-400">
            {blindCount} {blindCount === 1 ? "person has" : "people have"} nothing on file while he died.
          </p>
        )}
        {!readOnly && (
          <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={addMoment}>
            + Add your own
          </button>
        )}
      </div>

      {/* the chart */}
      <div className="scrollbar-thin relative hidden min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-5 pt-3 md:flex md:px-6">
        <div ref={trackRef} className="relative ml-[176px] flex min-h-0 flex-1 flex-col">
          {/* the window that decides the case, drawn once and running the full height */}
          {focus && focusFrom !== null && focusTo !== null && (
            <div
              className="pointer-events-none absolute inset-y-0 z-0 border-x border-crimson-600/45 bg-crimson-600/[.07]"
              style={{ left: `${pct(focusFrom)}%`, width: `${pct(focusTo) - pct(focusFrom)}%` }}
            >
              <p className="absolute -top-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] text-crimson-400">
                {focus.label}
              </p>
            </div>
          )}

          {/* ruler */}
          <div className="relative h-7">
            {ticks.map((m) => (
              <div
                key={m}
                className={`absolute top-3 ${m === ticks.at(-1) ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: `${pct(m)}%` }}
              >
                <span className="font-mono text-[10px] text-steel-400">{formatMinutes(m)}</span>
              </div>
            ))}
          </div>

          {/* one lane per person, then the room, then whatever you make of it */}
          <div className="relative flex min-h-0 flex-1 flex-col border-t border-ink-700">
            {lanes.map((lane) => {
              const blank = lane.pips.length === 0;
              const says = standing.get(lane.id);
              return (
                <div
                  key={lane.id}
                  className="relative flex-1 border-b border-ink-800"
                  style={{ minHeight: lane.rows * ROW_H + LANE_PAD * 2 }}
                >
                  {/* name plate, hung outside the track */}
                  <div className="absolute -left-[176px] top-0 flex h-full w-[168px] items-center gap-2 pr-3">
                    {lane.suspect ? (
                      <SuspectPhoto suspect={lane.suspect} tight className="h-7 w-7 shrink-0 grayscale" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`h-7 w-7 shrink-0 border ${lane.id === "__mine" ? "border-dashed border-crimson-400/60" : "border-ink-600"}`}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12px] leading-tight ${blank ? "text-bone-100/45" : "text-bone-100/90"}`}>
                        {lane.name}
                      </span>
                      {says && <span className={`block truncate text-[10.5px] leading-tight ${says.cls}`}>{says.text}</span>}
                    </span>
                  </div>

                  <div className="absolute inset-x-0 top-1/2 h-px bg-ink-700" />

                  {/* where they stayed, said on the bar itself rather than in a key */}
                  {(legsOf.get(lane.id) ?? []).map((leg) => (
                    <div
                      key={`${leg.from}-${leg.to}`}
                      className="absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center"
                      style={{ left: `${pct(leg.from)}%`, width: `${pct(leg.to) - pct(leg.from)}%` }}
                      title={leg.label}
                    >
                      <span className={`absolute inset-x-0 h-[3px] ${leg.impossible ? "bg-crimson-400" : "bg-amber-500/55"}`} />
                      <span
                        className={`relative px-1.5 text-[10px] leading-none ${
                          leg.impossible ? "bg-ink-950 text-crimson-400" : "bg-ink-950 text-amber-300/80"
                        }`}
                      >
                        {leg.impossible ? "couldn't have made it" : leg.label}
                      </span>
                    </div>
                  ))}


                  {/* the records themselves */}
                  {lane.pips.map((p) =>
                    p.e ? (
                      <motion.button
                        key={p.id}
                        type="button"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => onOpen(p.e!.id)}
                        onMouseEnter={() => setHover(p.id)}
                        onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
                        title={`${p.e.time} · ${p.e.title}${p.e.location ? ` · ${placeName.get(p.e.location)}` : ""}`}
                        aria-label={`${p.e.time}, ${p.e.title}. Open the record.`}
                        className={`absolute z-20 flex -translate-y-1/2 items-center gap-1.5 overflow-hidden border px-1.5 py-[3px] text-left leading-none transition-colors ${
                          hover === p.id
                            ? "border-amber-400 bg-amber-500/20 text-bone-100"
                            : "border-ink-600 bg-ink-900 text-bone-100/80 hover:border-amber-500"
                        }`}
                        style={{ left: `${pct(p.at)}%`, top: `calc(50% + ${stackOffset(p.row, lane.rows)}px)`, width: p.room }}
                      >
                        <span className="shrink-0 font-mono text-[10px] text-amber-300">{p.e.time?.slice(0, 5)}</span>
                        {p.room >= 96 && <span className="truncate text-[11px]">{p.e.title}</span>}
                      </motion.button>
                    ) : (
                      <div
                        key={p.id}
                        className="absolute z-20 flex -translate-y-1/2 items-center gap-1 border border-dashed border-crimson-400/80 bg-ink-950 px-1.5 py-[3px]"
                        style={{ left: `${pct(p.at)}%`, top: `calc(50% + ${stackOffset(p.row, lane.rows)}px)`, width: 200 }}
                      >
                        <span
                          className="shrink-0 cursor-ew-resize touch-none select-none font-mono text-[10px] leading-none text-crimson-400"
                          onPointerDown={(ev) => startDrag(ev, p.custom!)}
                          title="Drag to move it in time"
                        >
                          ⇔ {formatMinutes(p.at)}
                        </span>
                        <input
                          aria-label="What happened?"
                          className="w-full min-w-0 bg-transparent text-[11px] leading-none text-bone-100 outline-none placeholder:text-steel-400"
                          placeholder="what happened?"
                          value={p.custom!.label}
                          onChange={(ev) => dispatch({ t: "custom.update", event: { ...p.custom!, label: ev.target.value } })}
                        />
                        <button
                          type="button"
                          className="shrink-0 px-0.5 text-[10px] text-steel-400 hover:text-crimson-400"
                          onClick={() => dispatch({ t: "custom.remove", id: p.custom!.id })}
                          aria-label="Remove this moment"
                        >
                          ✕
                        </button>
                      </div>
                    ),
                  )}

                  {blank && !says && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-ink-950 px-2 text-[11px] italic text-steel-400">
                      {lane.id === "__mine" ? "Nothing yet — add your own guess and drag it to a time." : "Nothing on file."}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {after.length > 0 && (
          <p className="mt-3 text-right text-[12px] text-steel-400">
            Also on file, after {night.to}:{" "}
            {after.map((r, i) => (
              <button
                key={r.e.id}
                type="button"
                className="text-steel-300 hover:text-amber-300"
                onClick={() => onOpen(r.e.id)}
                title={r.e.title}
              >
                {i > 0 && ", "}
                {r.e.time?.slice(0, 5)}
              </button>
            ))}
          </p>
        )}
      </div>

      {/* narrow screens: the same night, read downward — records and your own moments together */}
      <ol className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-auto px-4 py-4 md:hidden">
        {downward.map((item) => {
          const inside = focusFrom !== null && focusTo !== null && item.at >= focusFrom && item.at <= focusTo;
          if (item.custom) {
            return (
              <li key={item.id} className="grid grid-cols-[52px_1fr] gap-3">
                <input
                  aria-label="Time"
                  type="time"
                  className="w-full bg-transparent pt-2 font-mono text-xs text-crimson-400 outline-none [color-scheme:dark]"
                  value={item.custom.time}
                  onChange={(ev) =>
                    /^\d{2}:\d{2}$/.test(ev.target.value) &&
                    dispatch({ t: "custom.update", event: { ...item.custom!, time: ev.target.value } })
                  }
                />
                <div className="flex items-start gap-2 border-l-2 border-dashed border-crimson-400/80 px-3 py-2">
                  <input
                    aria-label="What happened?"
                    className="w-full min-w-0 bg-transparent text-sm text-bone-100 outline-none placeholder:text-steel-400"
                    placeholder="what happened?"
                    value={item.custom.label}
                    onChange={(ev) => dispatch({ t: "custom.update", event: { ...item.custom!, label: ev.target.value } })}
                  />
                  <button
                    type="button"
                    className="shrink-0 px-1 text-steel-400 hover:text-crimson-400"
                    onClick={() => dispatch({ t: "custom.remove", id: item.custom!.id })}
                    aria-label="Remove this moment"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          }
          const e = item.e!;
          return (
            <li key={item.id} className="grid grid-cols-[52px_1fr] gap-3">
              <span className={`pt-2 font-mono text-xs ${inside ? "text-crimson-400" : "text-amber-300"}`}>
                {e.time?.slice(0, 5)}
              </span>
              <button
                type="button"
                className={`border-l-2 px-3 py-2 text-left ${inside ? "border-crimson-600 bg-crimson-600/10" : "border-ink-600"}`}
                onClick={() => onOpen(e.id)}
              >
                <p className="font-mono text-[10px] text-steel-400">
                  {evidenceCode(e.number)}
                  {e.location ? ` · ${placeName.get(e.location)}` : ""}
                </p>
                <p className="text-sm text-bone-100/90">{e.title}</p>
                {e.suspects.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-steel-300">
                    {e.suspects.map((id) => suspects.find((s) => s.id === id)?.name ?? id).join(", ")}
                  </p>
                )}
              </button>
            </li>
          );
        })}
        {downward.length === 0 && <li className="py-8 text-center text-sm text-bone-100/50">No timestamped records yet.</li>}
      </ol>
    </div>
  );
}


/** Where a pip sits relative to its lane's rule, so a stack of them straddles the line evenly. */
const stackOffset = (row: number, rows: number) => (row - (rows - 1) / 2) * ROW_H;

