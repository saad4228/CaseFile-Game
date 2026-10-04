"use client";

import { motion } from "framer-motion";
import { BlackwoodHotel } from "@/components/illustrations/Blackwood";
import { PhotoScene } from "@/components/illustrations/PhotoScene";
import { useCalm } from "@/lib/client/settings";
import type { ResultView } from "@/lib/sessions/types";
import { InkDetail } from "./InkDetail";

type Beat = ResultView["truth"]["sequence"][number];
type Row = "wide" | "pair" | "strip" | "tri" | "slash";

// Panel rhythm (reference 8): establish wide, cut between details, a tense triptych, a
// diagonal slash for the turn, close on a wide shot. Repeats for longer sequences.
const RHYTHM: [Row, number][] = [
  ["wide", 1],
  ["pair", 2],
  ["strip", 1],
  ["tri", 3],
  ["slash", 2],
  ["pair", 2],
  ["wide", 1],
];

function rows(seq: Beat[]) {
  const out: { kind: Row; beats: Beat[] }[] = [];
  let i = 0;
  let r = 0;
  while (i < seq.length) {
    const [kind, n] = RHYTHM[r % RHYTHM.length];
    out.push({ kind, beats: seq.slice(i, i + n) });
    i += n;
    r++;
  }
  return out;
}

/** "What happened": a scroll-paced ink comic. */
export function ComicStrip({ sequence }: { sequence: Beat[] }) {
  const calm = useCalm();
  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: calm ? 0 : 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-15% 0px" },
    transition: { duration: 0.9, delay, ease: [0.22, 0.61, 0.36, 1] as const },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-3 bg-black p-2 md:space-y-4 md:p-4">
      {rows(sequence).map((row, ri) => {
        if (row.kind === "slash") {
          return (
            <div key={ri} className="pt-4 md:pt-8">
              <div className="relative overflow-hidden">
                <motion.div {...reveal()} className="relative aspect-[16/10] overflow-hidden [clip-path:polygon(0_0,100%_0,100%_74%,0_100%)]">
                  <Panel beat={row.beats[0]} captionTop />
                </motion.div>
                {row.beats[1] && (
                  <motion.div {...reveal(0.35)} className="relative -mt-[16%] aspect-[16/10] overflow-hidden [clip-path:polygon(0_26%,100%_0,100%_100%,0_100%)]">
                    <Panel beat={row.beats[1]} />
                  </motion.div>
                )}
                {/* the gutter follows the seam: 16% of the width over the full width, about 9.2° */}
                <div className="pointer-events-none absolute -inset-x-4 top-1/2 h-3 -translate-y-1/2 -rotate-[9.2deg] bg-black md:h-4" aria-hidden="true" />
              </div>
            </div>
          );
        }
        const grid =
          row.kind === "pair" ? "grid gap-3 sm:grid-cols-2 md:gap-4" : row.kind === "tri" ? "grid gap-3 sm:grid-cols-3 sm:gap-2 md:gap-4" : "";
        const aspect =
          row.kind === "wide" ? "aspect-[16/9]" : row.kind === "strip" ? "aspect-[16/5]" : row.kind === "tri" ? "aspect-[16/10] sm:aspect-[3/5]" : "aspect-[16/10] sm:aspect-[4/3]";
        return (
          <div key={ri} className={`${grid} ${row.kind === "wide" && ri > 0 ? "pt-10 md:pt-16" : ""}`}>
            {row.beats.map((b, bi) => (
              <motion.div key={bi} {...reveal(bi * 0.18)} className={`relative overflow-hidden ${aspect}`}>
                <Panel beat={b} compact={row.kind === "tri"} />
              </motion.div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Panel({ beat, compact, captionTop }: { beat: Beat; compact?: boolean; captionTop?: boolean }) {
  return (
    <figure className="absolute inset-0 bg-[#f1ede4]">
      {beat.detail === "window" ? (
        <WindowGoesDark />
      ) : beat.detail ? (
        <InkDetail kind={beat.detail} slice className="absolute inset-0 h-full w-full" />
      ) : (
        <div className="ink-panel absolute inset-0">
          <PhotoScene scene={beat.scene} slice className="absolute inset-0 h-full w-full" />
        </div>
      )}
      <span className="absolute left-0 top-0 z-10 bg-black px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.15em] text-[#f1ede4] md:text-[11px]">
        {beat.time}
      </span>
      <figcaption
        className={`absolute z-10 border-2 border-black bg-[#f1ede4] font-mono leading-snug text-black ${
          compact
            ? "bottom-2 left-2 max-w-[78%] px-2.5 py-1.5 text-[10.5px] sm:inset-x-1 sm:bottom-1 sm:max-w-none sm:px-1.5 sm:py-1 sm:text-[9px] md:text-[10.5px]"
            : `${captionTop ? "left-2 top-8 md:top-9" : "bottom-2 left-2"} max-w-[78%] px-2.5 py-1.5 text-[10.5px] md:text-[12px]`
        }`}
      >
        {beat.caption}
      </figcaption>
    </figure>
  );
}

/** The Blackwood from the street; the light in Room 314 goes out as the panel comes into view. */
function WindowGoesDark() {
  const calm = useCalm();
  return (
    <div className="absolute inset-0 bg-[#0a1416]">
      <BlackwoodHotel lit314={false} slice className="absolute inset-0 h-full w-full" />
      <motion.div
        className="absolute left-[50%] top-[43%] h-[7%] w-[6%] -translate-x-1/2 bg-[#ffcf7e] shadow-[0_0_30px_10px_rgba(255,207,126,.35)]"
        initial={{ opacity: 1 }}
        whileInView={{ opacity: [1, 1, 0.3, 1, 0] }}
        viewport={{ once: true, margin: "-25% 0px" }}
        transition={{ duration: calm ? 0.1 : 2.4, delay: calm ? 0 : 0.8, times: [0, 0.5, 0.6, 0.7, 1] }}
        aria-hidden="true"
      />
    </div>
  );
}
