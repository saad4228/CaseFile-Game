"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { PhotoScene } from "@/components/illustrations/PhotoScene";
import { SuspectPortrait } from "@/components/illustrations/SuspectPortrait";
import { SectionMark } from "@/components/ui/SectionMark";
import { useCalm } from "@/lib/client/settings";

// Positions in a 1000×560 board, as percentages for the HTML cards.
const nodes = {
  sarah: { x: 14, y: 22 },
  statement: { x: 50, y: 12 },
  exitlog: { x: 82, y: 30 },
  lobby: { x: 30, y: 74 },
  garage: { x: 70, y: 78 },
};

const threads: { from: keyof typeof nodes; to: keyof typeof nodes; kind: string; dash?: string }[] = [
  { from: "sarah", to: "statement", kind: "ASSOCIATED WITH" },
  { from: "statement", to: "exitlog", kind: "CONTRADICTS", dash: "10 6" },
  { from: "sarah", to: "lobby", kind: "SUPPORTS" },
  { from: "lobby", to: "exitlog", kind: "OCCURRED BEFORE", dash: "2 6" },
  { from: "exitlog", to: "garage", kind: "?", dash: "1 8" },
];

function sag(a: { x: number; y: number }, b: { x: number; y: number }) {
  const ax = a.x * 10, ay = a.y * 5.6, bx = b.x * 10, by = b.y * 5.6;
  const mx = (ax + bx) / 2, my = (ay + by) / 2 + Math.abs(bx - ax) * 0.12 + 20;
  return { d: `M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`, lx: (ax + 2 * mx + bx) / 4, ly: (ay + 2 * my + by) / 4 };
}

export function SectionConnect() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useCalm();

  return (
    <section className="relative py-28 md:py-40" aria-labelledby="connect-heading">
      <div className="mx-auto max-w-[1400px] px-4 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <SectionMark n="03" label="Connect" />
            <h2 id="connect-heading" className="font-display mt-8 text-5xl leading-[0.95] md:text-7xl">
              Thread means
              <br />
              <em className="text-crimson-400">something.</em>
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-bone-100/75">
            Pin what you find to the board and say how it connects. Supports. Contradicts. Occurred
            before. Disproves. The board is your reasoning, out loud — and it&apos;s what the case is
            scored on.
          </p>
        </div>

        <div
          ref={ref}
          className="relative mt-16 aspect-[1000/860] w-full overflow-hidden border border-ink-700 bg-ink-900 sm:aspect-[1000/560]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 30%, rgba(217,138,58,0.10), transparent 60%), radial-gradient(rgba(231,226,216,0.06) 1px, transparent 1px)",
            backgroundSize: "auto, 22px 22px",
          }}
        >
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
            {threads.map((t, i) => {
              const { d } = sag(nodes[t.from], nodes[t.to]);
              return (
                <motion.path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={t.kind === "?" ? "#718493" : "#9c2929"}
                  strokeWidth={2}
                  strokeDasharray={t.dash}
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
                  animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1.1, delay: 0.4 + i * 0.35, ease: "easeInOut" }}
                />
              );
            })}
          </svg>
          {threads.map((t, i) => {
            const { lx, ly } = sag(nodes[t.from], nodes[t.to]);
            return (
              <motion.span
                key={i}
                className={`absolute -translate-x-1/2 -translate-y-1/2 border px-2 py-1 font-mono text-[9px] tracking-[0.2em] md:text-[10px] ${
                  t.kind === "?" ? "border-steel-400/50 bg-ink-950 text-steel-300" : "border-crimson-600/60 bg-ink-950 text-[#e0a59e]"
                }`}
                style={{ left: `${lx / 10}%`, top: `${ly / 5.6}%` }}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 1.2 + i * 0.35 }}
              >
                {t.kind}
              </motion.span>
            );
          })}

          <BoardCard at={nodes.sarah} rotate={-4} delay={0} show={inView}>
            <div className="photo-print w-20 md:w-28">
              <SuspectPortrait spec={{ hair: "long", collar: "coat", backdrop: "newsroom" }} label="Sarah Vale" className="block w-full" />
              <p className="mt-1 text-center font-mono text-[8px] tracking-[0.15em] text-[#3a3428] md:text-[9px]">S. VALE</p>
            </div>
          </BoardCard>
          <BoardCard at={nodes.statement} rotate={2} delay={0.1} show={inView}>
            <div className="paper w-36 px-3 py-2 md:w-52 md:px-4 md:py-3">
              <p className="label-ink !text-[8px] md:!text-[10px]">Statement — S. Vale</p>
              <p className="mt-1 font-mono text-[10px] leading-snug text-[#1d1a14] md:text-xs">“I left the hotel at about 11:20.”</p>
            </div>
          </BoardCard>
          <BoardCard at={nodes.exitlog} rotate={5} delay={0.2} show={inView}>
            <div className="paper w-32 px-3 py-2 md:w-44 md:px-4 md:py-3">
              <p className="label-ink !text-[8px] md:!text-[10px]">Exit log #012</p>
              <p className="mt-1 font-mono text-[10px] text-[#1d1a14] md:text-xs">23:43 · P2 door</p>
            </div>
          </BoardCard>
          <BoardCard at={nodes.lobby} rotate={-3} delay={0.3} show={inView}>
            <div className="photo-print w-28 md:w-40">
              <div className="scanlines">
                <PhotoScene scene="lobby" cctv={{ cam: "CAM L-1", time: "22:47:31" }} className="block w-full" />
              </div>
            </div>
          </BoardCard>
          <BoardCard at={nodes.garage} rotate={3} delay={0.4} show={inView}>
            <div className="w-32 border border-dashed border-steel-400/60 px-3 py-4 text-center md:w-44">
              <p className="font-mono text-lg tracking-[0.3em] text-steel-300">?????</p>
              <p className="label mt-1 !text-[9px]">Level P2</p>
            </div>
          </BoardCard>
        </div>
      </div>
    </section>
  );
}

function BoardCard({
  at,
  rotate,
  delay,
  show,
  children,
}: {
  at: { x: number; y: number };
  rotate: number;
  delay: number;
  show: boolean;
  children: React.ReactNode;
}) {
  const reduce = useCalm();
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${at.x}%`, top: `${at.y}%` }}
      initial={{ opacity: 0, y: reduce ? 0 : -30, rotate: rotate - 8 }}
      animate={show ? { opacity: 1, y: 0, rotate } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <span className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-crimson-600 shadow-[0_2px_3px_rgba(0,0,0,.6),inset_-2px_-2px_3px_rgba(0,0,0,.35)]" aria-hidden="true" />
      {children}
    </motion.div>
  );
}
