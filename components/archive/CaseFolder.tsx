"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { RingSymbol } from "@/components/ui/RingSymbol";
import { Stamp } from "@/components/ui/Stamp";
import type { CaseProgress } from "@/lib/archive-types";
import type { CaseMeta } from "@/lib/game-engine/types";

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export function CaseFolder({
  c,
  index,
  progress,
  teaser,
}: {
  c: CaseMeta;
  index: number;
  progress?: CaseProgress;
  teaser?: string;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const tilt = [-1.5, 1.2, -0.6, 1.8, -1.1][index % 5];
  const sealed = !c.playable;
  const status = progress?.state === "SOLVED" ? "SOLVED" : progress?.state === "CLOSED" ? "CLOSED" : progress?.state === "OPEN" ? "IN PROGRESS" : c.status;
  const href = progress?.state === "OPEN" && progress.code ? `/play/${progress.code}` : `/cases/${c.id}`;

  const folder = (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: reduce ? 0 : 40, rotate: tilt * 2 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={reduce ? {} : { y: -10, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.1 + index * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {/* a document peeking out of the folder; rises on hover */}
      <motion.div
        className="paper absolute right-6 top-0 z-0 h-24 w-[58%]"
        initial={false}
        animate={{ y: open && !reduce && !sealed ? -34 : -10, rotate: 2 }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        aria-hidden="true"
      >
        <div className="mx-4 mt-3 space-y-1.5">
          <div className="h-1 w-3/4 bg-[#1d1a14]/25" />
          <div className="h-1 w-1/2 bg-[#1d1a14]/20" />
        </div>
      </motion.div>
      {/* tab */}
      <div className="paper-aged absolute -top-6 left-6 z-10 px-4 pb-3 pt-1.5 font-mono text-[11px] tracking-[0.3em] text-paper-900">
        CASE {c.number}
      </div>
      <div className="paper-aged relative z-10 min-h-[300px] px-6 pb-6 pt-8">
        <p className="label-ink">Case {c.number}</p>
        <h2 className="font-display mt-2 text-3xl uppercase leading-[0.95] tracking-wide text-[#1d1a14] md:text-[2.1rem]">
          {c.title}
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#1d1a14]/20 pt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[#1d1a14]">
          <div>
            <dt className="label-ink !text-[9px]">Classification</dt>
            <dd className="mt-0.5">{c.classification}</dd>
          </div>
          <div>
            <dt className="label-ink !text-[9px]">Status</dt>
            <dd className="mt-0.5">{status}</dd>
          </div>
          <div>
            <dt className="label-ink !text-[9px]">Difficulty</dt>
            <dd className="mt-0.5 tracking-[0.2em]" aria-label={`${c.difficulty} of 5`}>
              {stars(c.difficulty)}
            </dd>
          </div>
          <div>
            <dt className="label-ink !text-[9px]">Players</dt>
            <dd className="mt-0.5">{c.players}</dd>
          </div>
          <div className="col-span-2">
            {progress?.rank ? (
              <>
                <dt className="label-ink !text-[9px]">Your best</dt>
                <dd className="mt-0.5">
                  Rank {progress.rank} · {progress.score}
                </dd>
              </>
            ) : (
              <>
                <dt className="label-ink !text-[9px]">Est. time</dt>
                <dd className="mt-0.5">{c.estTime}</dd>
              </>
            )}
          </div>
        </dl>
        <div className="absolute bottom-6 right-5">
          <Stamp tone={sealed ? "ink" : progress?.state === "SOLVED" ? "amber" : "crimson"} rotate={-8} size="sm">
            {status}
          </Stamp>
        </div>
        {sealed && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-ink-950/35" aria-hidden="true" />
            <div
              className="pointer-events-none absolute left-[-6%] top-[44%] w-[112%] -rotate-[9deg] bg-[#16181b] py-1.5 text-center font-mono text-[10px] tracking-[0.5em] text-paper-300 shadow-[0_4px_10px_rgba(0,0,0,.5)]"
              aria-hidden="true"
            >
              SEALED · SEALED · SEALED · SEALED
            </div>
            {teaser && (
              <RingSymbol className="absolute left-5 top-5 h-10 w-10 rotate-6 text-crimson-600/80" />
            )}
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {sealed ? (
        <div aria-disabled="true" tabIndex={0} className="block cursor-not-allowed rounded-none outline-offset-8">
          {folder}
        </div>
      ) : (
        <Link href={href} className="block outline-offset-8" aria-label={`${progress?.state === "OPEN" ? "Resume" : "Open"} case ${c.number}, ${c.title}`}>
          {folder}
        </Link>
      )}

      {/* dossier preview */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="panel pointer-events-none absolute inset-x-2 top-full z-20 mt-4 p-5 shadow-2xl"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="label">{sealed ? "Dossier — restricted" : "Dossier"}</p>
            <p className="mt-2 text-sm leading-relaxed text-bone-100/85">
              {sealed ? (teaser ?? "This file opens when an earlier case is closed.") : c.logline}
            </p>
            {sealed && teaser && <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-crimson-400">Coming in Season One</p>}
            {!sealed && (
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-300">
                {c.counts.suspects} suspects · {c.counts.evidence} records · open file →
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
