"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/components/game/GameContext";
import { EvidenceBody } from "./EvidenceBody";
import { categoryLabel, evidenceCode, reliabilityStyle } from "./format";
import { play } from "@/lib/client/sound";

export function EvidenceViewer({
  openId,
  onOpen,
  onClose,
  onPinToBoard,
  compareWith,
}: {
  openId: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
  onPinToBoard: (id: string) => void;
  /** Open side by side with this record (from a conflict). */
  compareWith?: string | null;
}) {
  const { evidence: list, suspects, locations, shared, personal, dispatch, dispatchPersonal, holders, share, mode, phase } = useGame();
  const readOnly = phase === "RESOLVED";
  const [sharing, setSharing] = useState(false);
  const index = list.findIndex((e) => e.id === openId);
  const e = index >= 0 ? list[index] : null;
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [compareId, setCompareId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const compare = useMemo(() => list.find((x) => x.id === compareId) ?? null, [list, compareId]);

  // Reset view controls when the record changes.
  const [lastId, setLastId] = useState(openId);
  if (openId !== lastId) {
    setLastId(openId);
    setZoom(1);
    setRotate(0);
    setCompareId(compareWith && compareWith !== openId ? compareWith : openId === compareId ? null : compareId);
  }

  useEffect(() => {
    if (!e) return;
    play(e.category === "PHOTO" || e.category === "CCTV" ? "shutter" : "paper");
    if (!personal.seen.includes(e.id)) dispatchPersonal({ t: "seen", id: e.id });
    closeRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e?.id]);

  useEffect(() => {
    if (!e) return;
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement)?.tagName === "TEXTAREA" || (ev.target as HTMLElement)?.tagName === "SELECT") return;
      if (ev.key === "Escape") onClose();
      if (ev.key === "ArrowRight" && index < list.length - 1) onOpen(list[index + 1].id);
      if (ev.key === "ArrowLeft" && index > 0) onOpen(list[index - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [e, index, list, onOpen, onClose]);

  const nameOf = (id: string) => suspects.find((s) => s.id === id)?.name ?? id;
  const placeOf = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const discovered = new Set(list.map((x) => x.id));

  return (
    <AnimatePresence>
      {e && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-ink-950/[0.97]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="viewer-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* header */}
          <div className="flex items-center justify-between gap-4 border-b border-ink-700 px-4 py-3 md:px-8">
            <div className="min-w-0">
              <p className="label truncate">
                Evidence {evidenceCode(e.number)} · {categoryLabel[e.category]}
              </p>
              <h2 id="viewer-title" className="font-display truncate text-2xl md:text-3xl">
                {e.title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm !px-3"
                disabled={index <= 0}
                onClick={() => onOpen(list[index - 1].id)}
                aria-label="Previous record"
              >
                ←
              </button>
              <span className="hidden font-mono text-xs text-steel-400 sm:inline">
                {index + 1}/{list.length}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm !px-3"
                disabled={index >= list.length - 1}
                onClick={() => onOpen(list[index + 1].id)}
                aria-label="Next record"
              >
                →
              </button>
              <button ref={closeRef} type="button" className="btn btn-ghost btn-sm ml-2" onClick={onClose} aria-label="Close">
                <span className="hidden sm:inline">Close</span> ✕
              </button>
            </div>
          </div>

          <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-auto lg:flex-row lg:overflow-hidden">
            {/* body */}
            <div className="desk-top scrollbar-thin relative px-4 py-10 md:px-12 lg:min-h-0 lg:flex-1 lg:overflow-auto">
              <div className="pointer-events-none absolute left-1/2 top-0 h-[60%] w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(240,174,85,0.10),transparent_70%)]" />
              {e.body.kind === "photo" && (
                <div className="relative z-10 mb-4 flex justify-center gap-2">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setZoom((z) => Math.min(3, z + 0.5))}>
                    Zoom +
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setZoom((z) => Math.max(1, z - 0.5))}>
                    Zoom −
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRotate((r) => (r + 90) % 360)}>
                    Rotate ⟳
                  </button>
                </div>
              )}
              <div className={`relative grid gap-8 ${compare ? "xl:grid-cols-2" : ""}`}>
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 24, rotate: -1.5 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <EvidenceBody e={e} zoom={zoom} rotate={rotate} compact={!!compare} />
                </motion.div>
                {compare && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="label">
                        Comparing · {evidenceCode(compare.number)} {compare.title}
                      </p>
                      <button type="button" className="label hover:text-bone-100" onClick={() => setCompareId(null)}>
                        Close compare ✕
                      </button>
                    </div>
                    <EvidenceBody e={compare} compact />
                  </div>
                )}
              </div>
            </div>

            {/* metadata + actions */}
            <aside className="scrollbar-thin w-full shrink-0 border-t border-ink-700 bg-ink-900 px-6 py-6 lg:w-[340px] lg:overflow-auto lg:border-l lg:border-t-0">
              <dl className="space-y-4">
                <Meta k="Source" v={e.source} />
                <Meta k="Time" v={e.time ?? "—"} />
                <Meta k="Location" v={e.location ? placeOf(e.location) : "—"} />
                <div>
                  <dt className="label">Reliability (as filed)</dt>
                  <dd className="mt-1.5">
                    <span className={`inline-block border-2 bg-paper-100 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[0.18em] ${reliabilityStyle[e.reliability]}`}>
                      {e.reliability}
                    </span>
                  </dd>
                </div>
                {e.suspects.length > 0 && <Meta k="People named" v={e.suspects.map(nameOf).join(", ")} />}
                {e.related.filter((r) => discovered.has(r)).length > 0 && (
                  <div>
                    <dt className="label">Cross-referenced</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1.5">
                      {e.related
                        .filter((r) => discovered.has(r))
                        .map((r) => {
                          const rel = list.find((x) => x.id === r)!;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => onOpen(r)}
                              className="border border-ink-600 px-2 py-1 font-mono text-[11px] text-bone-100/80 hover:border-amber-500 hover:text-bone-100"
                            >
                              {evidenceCode(rel.number)}
                            </button>
                          );
                        })}
                    </dd>
                  </div>
                )}
              </dl>

              {holders[e.id] === "me" && mode === "TEAM" && (
                <div className="mt-6 border border-amber-500/50 bg-amber-500/5 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300">🔒 Private record</p>
                  <p className="mt-1 text-sm text-bone-100/75">Only you can see this. Your team can&apos;t pin, cite or use it until you share it.</p>
                  {!readOnly && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm mt-3 w-full"
                      disabled={sharing}
                      onClick={async () => {
                        setSharing(true);
                        await share([e.id]);
                        setSharing(false);
                      }}
                    >
                      {sharing ? "Sharing…" : "Share with team"}
                    </button>
                  )}
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={readOnly || holders[e.id] === "me"}
                  onClick={() => onPinToBoard(e.id)}
                >
                  {shared.board.nodes.some((n) => n.kind === "evidence" && n.ref === e.id) ? "On board ✓" : "Pin to board"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={!e.time || readOnly || holders[e.id] === "me"}
                  onClick={() =>
                    shared.timeline.placed.includes(e.id)
                      ? dispatch({ t: "timeline.remove", id: e.id })
                      : dispatch({ t: "timeline.place", id: e.id })
                  }
                >
                  {shared.timeline.placed.includes(e.id) ? "On timeline ✓" : "Add to timeline"}
                </button>
                <label className="col-span-2">
                  <span className="sr-only">Compare with</span>
                  <select
                    className="w-full border border-ink-600 bg-ink-950 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-bone-100"
                    value={compareId ?? ""}
                    onChange={(ev) => setCompareId(ev.target.value || null)}
                  >
                    <option value="">Compare with…</option>
                    {list
                      .filter((x) => x.id !== e.id)
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {evidenceCode(x.number)} {x.title}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <div className="mt-6">
                <label htmlFor={`obs-${e.id}`} className="label">
                  Observations
                </label>
                <textarea
                  id={`obs-${e.id}`}
                  className="font-hand mt-2 h-40 w-full resize-y border border-ink-600 bg-paper-100 px-4 py-3 text-2xl leading-7 text-[#1f2c55] placeholder:text-[#1f2c55]/40"
                  placeholder="What do you notice?"
                  value={personal.notes[e.id] ?? ""}
                  maxLength={2000}
                  onChange={(ev) => dispatchPersonal({ t: "note", id: e.id, text: ev.target.value })}
                />
              </div>
            </aside>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="label">{k}</dt>
      <dd className="mt-1 text-sm leading-snug text-bone-100/90">{v}</dd>
    </div>
  );
}
