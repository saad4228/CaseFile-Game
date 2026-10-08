"use client";

import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { clock, minutesFrom22 } from "@/lib/time";
import { useGame } from "@/components/game/GameContext";
import { SuspectPhoto } from "@/components/illustrations/SuspectPhoto";
import { TimelineList } from "./TimelineList";
import { onFoot, travel } from "@/lib/game-engine/travel";
import type { CustomEvent } from "@/lib/game-engine/state";
import type { Evidence, Suspect } from "@/lib/game-engine/types";
import { play } from "@/lib/client/sound";

/**
 * The night on one sheet: every timestamped record placed against the clock in the row of
 * the person it names, so you can see who is accounted for while the victim died.
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
  const { meta, evidence, suspects, locations, routes, shared, interviews, dispatch, newId, phase } = useGame();
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

  // Split into the night itself and what came after the body was found.
  const { timed, after } = useMemo(() => {
    const all = evidence
      .map((e) => ({ e, at: e.time ? minutesFrom22(e.time) : null }))
      .filter((r): r is { e: Evidence; at: number } => r.at !== null)
      .sort((a, b) => a.at - b.at);
    return { timed: all.filter((r) => r.at <= end), after: all.filter((r) => r.at > end) };
  }, [evidence, end]);

  // Narrow screens read one column, so records and your own notes interleave.
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
    // Records three minutes apart would overlap, so each row stacks its own sub-rows.
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
      // Show the title when there's room for it, otherwise just the time.
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

  /** Each person's standing during the window, in words, so the chart needn't be read. */
  const standing = useMemo(() => {
    const out = new Map<string, { text: string; cls: string; blind: boolean }>();
    if (focusFrom === null || focusTo === null) return out;
    for (const lane of lanes) {
      if (!lane.suspect) continue;
      // Someone the case never identified cannot be placed anywhere, so they are not a gap
      // in the night — they are the case. Saying so keeps the count honest.
      if (!interviews[lane.id]) {
        out.set(lane.id, { text: "Never identified", cls: "text-steel-400", blind: false });
        continue;
      }
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
  }, [lanes, legsOf, focusFrom, focusTo, interviews]);

  const blindCount = useMemo(() => [...standing.values()].filter((v) => v.blind).length, [standing]);

  const addMoment = () => {
    play("pin");
    dispatch({ t: "custom.add", event: { id: newId(), time: clock(focusFrom ?? start + span / 2), label: "" } });
  };

  const startDrag = (ev: React.PointerEvent, c: CustomEvent) => {
    const track = trackRef.current;
    if (!track) return;
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const rect = track.getBoundingClientRect();
    const toMin = (clientX: number) =>
      Math.max(start, Math.min(end, Math.round(start + ((clientX - rect.left) / rect.width) * span)));
    const move = (e: PointerEvent) => setDragging({ id: c.id, at: toMin(e.clientX) });
    const up = (e: PointerEvent) => {
      dispatch({ t: "custom.update", event: { ...c, time: clock(toMin(e.clientX)) } });
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
    <div className="desk-surface flex h-full min-h-0 flex-col">
      {/* ── the sheet ─────────────────────────────────────────────────────────────────── */}
      <div className="scrollbar-thin hidden min-h-0 flex-1 overflow-y-auto p-4 md:block md:p-6">
        <div className="paper relative mx-auto flex min-h-full max-w-[1500px] flex-col px-6 pb-6 pt-5 md:px-9">
          {/* letterhead */}
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-[#1d1a14]/60 pb-3">
            <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.1em] text-[#1d1a14]">
              The night · {night.from} – {night.to}
            </p>
            <p className="ml-auto text-[12.5px] text-[#4f4636]">
              One row per person. Every slip is a record that names them, pinned at the time it happened.
            </p>
          </div>

          {/* the finding, written in the margin before anyone reads the chart */}
          {focus && blindCount > 0 && (
            <p className="mt-3 font-hand text-[26px] leading-none text-crimson-600">
              {blindCount} of them {blindCount === 1 ? "has" : "have"} nothing on file while he died.
            </p>
          )}

          <div ref={trackRef} className="relative mt-4 flex min-h-0 flex-1 flex-col pl-[244px]">
            {/* the window that decides the case, struck across the whole sheet */}
            {focus && focusFrom !== null && focusTo !== null && (
              <div
                className="pointer-events-none absolute inset-y-0 z-0 border-x-2 border-crimson-600/55 bg-crimson-600/[0.09]"
                style={{ left: `${pct(focusFrom)}%`, width: `${pct(focusTo) - pct(focusFrom)}%` }}
              >
                <p className="absolute -top-1 left-1/2 w-max -translate-x-1/2 bg-crimson-600 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f3e9dc]">
                  {focus.from} – {focus.to} · he died here
                </p>
              </div>
            )}

            {/* the hours, printed on the sheet */}
            <div className="relative h-6">
              {ticks.map((m) => (
                <div
                  key={m}
                  className={`absolute top-2 ${m === ticks.at(-1) ? "-translate-x-full" : "-translate-x-1/2"}`}
                  style={{ left: `${pct(m)}%` }}
                >
                  <span className="font-mono text-[11px] font-semibold text-[#1d1a14]/70">{clock(m)}</span>
                </div>
              ))}
            </div>

            {/* one ruled row per person */}
            <div className="relative flex min-h-0 flex-1 flex-col border-t-2 border-[#1d1a14]/40">
              {lanes.map((lane) => {
                const blank = lane.pips.length === 0;
                const says = standing.get(lane.id);
                return (
                  <div
                    key={lane.id}
                    className="relative flex-1 border-b border-[#1d1a14]/15"
                    style={{ minHeight: lane.rows * ROW_H + LANE_PAD * 2 + 20 }}
                  >
                    {/* who the row belongs to, pinned up beside it */}
                    <div className="absolute -left-[244px] top-0 flex h-full w-[232px] items-center gap-3 pr-4">
                      {lane.suspect ? (
                        <span className="relative shrink-0">
                          <span className="pin absolute -top-1 left-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full" />
                          <span className="photo-print block w-12 !p-1 !pb-1.5">
                            <SuspectPhoto suspect={lane.suspect} tight className="block w-full" />
                          </span>
                        </span>
                      ) : (
                        <span
                          aria-hidden="true"
                          className="h-11 w-12 shrink-0 border border-dashed border-[#1d1a14]/30 bg-[#1d1a14]/[0.03]"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[17px] leading-tight text-[#1d1a14]">{lane.name}</span>
                        {says && (
                          <span
                            className={`block truncate text-[11px] leading-tight ${says.blind ? "font-semibold text-crimson-600" : "text-[#4f4636]"}`}
                          >
                            {says.text}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* the ruled line the slips are pinned along */}
                    <div className="absolute inset-x-0 top-1/2 h-px bg-[#1d1a14]/12" />

                    {/* where they stayed, pencilled along the line */}
                    {(legsOf.get(lane.id) ?? []).map((leg) => (
                      <div
                        key={`${leg.from}-${leg.to}`}
                        className="absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center"
                        style={{ left: `${pct(leg.from)}%`, width: `${pct(leg.to) - pct(leg.from)}%` }}
                        title={leg.label}
                      >
                        <span className={`absolute inset-x-0 h-[2px] ${leg.impossible ? "bg-crimson-600" : "bg-[#1d1a14]/35"}`} />
                        <span
                          className={`relative z-30 whitespace-nowrap bg-[#cfc0a0] px-1.5 font-hand text-[19px] leading-none ${
                            leg.impossible ? "text-crimson-600" : "text-[#1f2c55]"
                          }`}
                        >
                          {leg.impossible ? "couldn’t have made it" : leg.label}
                        </span>
                      </div>
                    ))}

                    {/* the records themselves, each a slip with a pin through it */}
                    {lane.pips.map((p) =>
                      p.e ? (
                        <motion.button
                          key={p.id}
                          type="button"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => onOpen(p.e!.id)}
                          onMouseEnter={() => setHover(p.id)}
                          onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
                          title={`${p.e.time} · ${p.e.title}${p.e.location ? ` · ${placeName.get(p.e.location)}` : ""}`}
                          aria-label={`${p.e.time}, ${p.e.title}. Open the record.`}
                          className={`slip absolute z-20 flex -translate-y-1/2 items-baseline gap-1.5 overflow-hidden py-1 pl-2 pr-2 text-left leading-none ${
                            hover === p.id ? "z-30 scale-[1.06]" : ""
                          }`}
                          style={{
                            left: `${pct(p.at)}%`,
                            top: `calc(50% + ${stackOffset(p.row, lane.rows)}px)`,
                            width: p.room,
                            rotate: `${slipTilt(p.id)}deg`,
                          }}
                        >
                          <span className="pin absolute -top-1 left-2 h-2 w-2 rounded-full" aria-hidden="true" />
                          <span className="shrink-0 pl-2.5 font-mono text-[10px] font-semibold text-crimson-600">
                            {p.e.time?.slice(0, 5)}
                          </span>
                          {p.room >= 104 && <span className="truncate text-[11px] text-[#1d1a14]">{p.e.title}</span>}
                        </motion.button>
                      ) : (
                        <div
                          key={p.id}
                          className="sticky-note absolute z-20 flex -translate-y-1/2 items-center gap-1 px-2 py-1"
                          style={{
                            left: `${pct(p.at)}%`,
                            top: `calc(50% + ${stackOffset(p.row, lane.rows)}px)`,
                            width: 248,
                            rotate: `${slipTilt(p.id)}deg`,
                          }}
                        >
                          <span
                            className="shrink-0 cursor-ew-resize touch-none select-none font-mono text-[10px] font-semibold leading-none text-[#2a2410]"
                            onPointerDown={(ev) => startDrag(ev, p.custom!)}
                            title="Drag to move it in time"
                          >
                            ⇔ {clock(p.at)}
                          </span>
                          <input
                            aria-label="What happened?"
                            className="w-full min-w-0 bg-transparent font-hand text-[19px] leading-none text-[#2a2410] outline-none placeholder:text-[#2a2410]/45"
                            placeholder="what happened?"
                            value={p.custom!.label}
                            onChange={(ev) => dispatch({ t: "custom.update", event: { ...p.custom!, label: ev.target.value } })}
                          />
                          <button
                            type="button"
                            className="shrink-0 px-0.5 text-[10px] text-[#2a2410]/50 hover:text-crimson-600"
                            onClick={() => dispatch({ t: "custom.remove", id: p.custom!.id })}
                            aria-label="Remove this moment"
                          >
                            ✕
                          </button>
                        </div>
                      ),
                    )}

                    {blank && !says && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 font-hand text-[20px] text-[#4f4636]">
                        {lane.id === "__mine" ? "add what you think happened, and drag it to a time" : "nothing on file"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* the margin note, and the records that fall outside the night */}
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-[#1d1a14]/20 pt-2.5">
            {!readOnly ? (
              <button
                type="button"
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4f4636] underline-offset-4 hover:text-[#1d1a14] hover:underline"
                onClick={addMoment}
              >
                + Add what you think happened
              </button>
            ) : (
              <span />
            )}
            {after.length > 0 && (
              <p className="text-[11.5px] text-[#4f4636]">
                Also on file, after {night.to}:{" "}
                {after.map((r, i) => (
                  <button
                    key={r.e.id}
                    type="button"
                    className="underline-offset-2 hover:text-crimson-600 hover:underline"
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
        </div>
      </div>

      <TimelineList
        rows={downward}
        placeName={placeName}
        focus={Boolean(focus)}
        focusFrom={focusFrom}
        focusTo={focusTo}
        blindCount={blindCount}
        readOnly={readOnly}
        onOpen={onOpen}
        onAdd={addMoment}
      />
    </div>
  );
}

/** Offset of a slip from its row's line, so stacks straddle it evenly. */
const stackOffset = (row: number, rows: number) => (row - (rows - 1) / 2) * ROW_H;

/** Steady tilt per slip, so slips look pinned rather than typeset. */
function slipTilt(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 100) / 100) * 2.4 - 1.2;
}
