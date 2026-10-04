"use client";

import { motion } from "framer-motion";
import { PortraitShape } from "@/components/illustrations/SuspectPortrait";
import type { Suspect } from "@/lib/game-engine/types";
import { useCalm } from "@/lib/client/settings";

// The line-up (reference 8): every person of interest as a silhouette against the height
// chart, only their eyes showing. One by one the innocent close their eyes; the one who
// did it keeps looking at you.

const CLOSE_START = 0.6;
const CLOSE_STEP = 0.75;
const WORDS = ["None", "One", "Two", "Three", "Four", "Five", "Six"];

function Eyes({ closeAt, stays, calm }: { closeAt: number; stays: boolean; calm: boolean }) {
  const lid = stays
    ? {}
    : calm
      ? { initial: { scaleY: 0.08 }, animate: { scaleY: 0.08 } }
      : {
          initial: { scaleY: 1 },
          whileInView: { scaleY: 0.08 },
          viewport: { once: true, margin: "-20% 0px" },
          transition: { delay: closeAt, duration: 0.18, ease: "easeIn" as const },
        };
  return (
    <motion.g style={{ transformOrigin: "60px 60px", transformBox: "view-box" }} {...lid}>
      {[51.5, 68.5].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="60" rx="4.6" ry="2.3" fill="#f3efe6" />
          <circle cx={cx} cy="60" r="1.7" fill={stays ? "#c3262a" : "#3a3a3a"} />
        </g>
      ))}
    </motion.g>
  );
}

export function LineUp({ suspects, culpritId }: { suspects: Suspect[]; culpritId: string }) {
  const calm = useCalm();
  const others = suspects.filter((s) => s.id !== culpritId);
  const order = new Map(others.map((s, i) => [s.id, CLOSE_START + i * CLOSE_STEP]));
  const reveal = CLOSE_START + others.length * CLOSE_STEP;

  return (
    <figure className="relative mx-auto max-w-3xl overflow-hidden border-2 border-black bg-[linear-gradient(180deg,#d9d6cf,#a9a59c)]">
      {/* height chart */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="absolute inset-x-0 border-t border-black/25" style={{ top: `${12 + i * 14}%` }}>
            <span className="absolute left-2 -translate-y-1/2 bg-[#cfccc4] px-1 font-mono text-[10px] text-black/60">
              {7 - i * 0.5}′
            </span>
          </div>
        ))}
      </div>
      <div className="relative grid grid-cols-5 items-end gap-0 px-2 pt-10 sm:px-8">
        {suspects.map((s, i) => {
          const stays = s.id === culpritId;
          return (
            <div key={s.id} className="flex flex-col items-center">
              <svg viewBox="0 0 120 150" className="block w-full" role="img" aria-label={stays ? `${s.name}, eyes open` : `${s.name}, eyes closed`}>
                <PortraitShape spec={s.portrait} fill="#0b0c0e" />
                {/* the body runs off the bottom of the frame */}
                <rect x="14" y="146" width="92" height="4" fill="#0b0c0e" />
                <Eyes closeAt={order.get(s.id) ?? 0} stays={stays} calm={calm} />
              </svg>
              <span className="mb-2 bg-black px-1.5 py-0.5 font-mono text-[10px] text-bone-100/80 sm:text-xs">{i + 1}</span>
            </div>
          );
        })}
      </div>
      <motion.figcaption
        className="relative bg-black px-4 py-3 text-center font-mono text-[12px] uppercase tracking-[0.2em] text-bone-100/80"
        initial={{ opacity: calm ? 1 : 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-20% 0px" }}
        transition={{ delay: calm ? 0 : reveal, duration: 0.6 }}
      >
        {WORDS[others.length] ?? others.length} of them looked away. <span className="text-crimson-400">One</span> never did.
      </motion.figcaption>
    </figure>
  );
}
