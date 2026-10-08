"use client";

import { motion } from "framer-motion";
import { Stamp } from "@/components/ui/Stamp";
import type { CaseMeta } from "@/lib/game-engine/types";
import { useCalm } from "@/lib/client/settings";

// The unopened folder on the desk, and the papers that slide out of it when you open it.

export function ClosedFile({ meta, opening }: { meta: CaseMeta; opening: boolean }) {
  const reduce = useCalm();
  const docs = [
    { x: -260, y: -40, r: -14, label: "Incident report" },
    { x: 240, y: -70, r: 11, label: "Call log" },
    { x: -180, y: 150, r: 7, label: "Statements ×4" },
    { x: 220, y: 140, r: -9, label: "Scene photographs" },
  ];
  return (
    <div className="relative h-[340px] w-[min(88vw,460px)] [perspective:1400px]">
      {/* documents sliding out */}
      {docs.map((d, i) => (
        <motion.div
          key={d.label}
          className="paper absolute inset-6 flex items-start p-5"
          initial={false}
          animate={
            opening && !reduce
              ? { x: d.x, y: d.y, rotate: d.r, opacity: 1 }
              : { x: 0, y: 0, rotate: 0, opacity: 0 }
          }
          transition={{ duration: 0.9, delay: 0.55 + i * 0.12, ease: [0.22, 0.61, 0.36, 1] }}
          aria-hidden="true"
        >
          <p className="label-ink">{d.label}</p>
        </motion.div>
      ))}
      {/* folder back */}
      <div className="paper-aged absolute inset-0" />
      {/* folder cover */}
      <motion.div
        className="paper-aged absolute inset-0 origin-left p-8 [backface-visibility:hidden] md:p-10"
        initial={false}
        animate={{ rotateY: opening ? -165 : 0 }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <p className="label-ink">Vesper City PD — Case file</p>
        <p className="font-display mt-6 text-6xl leading-none text-[#1d1a14]">{meta.number}</p>
        <p className="font-display mt-3 text-3xl uppercase tracking-wide text-[#1d1a14]">{meta.title}</p>
        <div className="mt-6 h-px bg-[#1d1a14]/25" />
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-[#1d1a14]/80">
          {meta.date} · {meta.time} · {meta.setting}
        </p>
        <div className="absolute bottom-8 right-8">
          <Stamp tone="crimson" rotate={-10} size="md">
            {meta.classification}
          </Stamp>
        </div>
      </motion.div>
    </div>
  );
}
