"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { PortraitImage } from "@/components/illustrations/SuspectPhoto";
import { SuspectCard } from "@/components/suspects/SuspectCard";
import { DeskProps } from "@/components/ui/DeskProps";
import { Typewriter } from "@/components/ui/Typewriter";
import type { CaseMeta, Suspect } from "@/lib/game-engine/types";
import { StartControls } from "./StartControls";
import type { StartOptions } from "./StartOptions";

// The case brief: who died, what is known, who was close to him, and how to begin.

export function Briefing({ meta, suspects, start }: { meta: CaseMeta; suspects: Suspect[]; start: StartOptions }) {
  const [typed, setTyped] = useState(0);
  return (
    <div className="desk-top relative min-h-[100svh] px-4 py-16 md:px-10 md:py-20">
      <DeskProps />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_10%,rgba(240,174,85,0.12),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1300px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="label">Case {meta.number} — Briefing</p>
            <h1 className="font-display mt-3 text-5xl md:text-7xl">{meta.title}</h1>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-steel-300">
            {meta.date} · {meta.setting}
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[320px_1fr]">
          {/* victim */}
          <motion.div
            className="paper relative self-start px-6 pb-7 pt-6"
            initial={{ opacity: 0, x: -40, rotate: -6 }}
            animate={{ opacity: 1, x: 0, rotate: -2 }}
            transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <svg className="absolute left-1/2 top-1 z-10 h-16 w-6 -translate-x-[70px] -rotate-6" viewBox="0 0 24 64" aria-hidden="true">
              <path d="M8 40V10a5 5 0 0 1 10 0v40a8 8 0 0 1-16 0V16" fill="none" stroke="#9aa3ab" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <div className="photo-print mx-auto w-40 rotate-2">
              <PortraitImage
                id="daniel_mercer"
                name={meta.victim.name}
                spec={{ hair: "short", collar: "coat" }}
                tone="warm"
                className="block w-full"
              />
            </div>
            <p className="label-ink mt-6">Victim</p>
            <p className="font-display text-3xl text-[#1d1a14]">{meta.victim.name}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-[#1d1a14]/80">
              {meta.victim.age} · {meta.victim.occupation}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#1d1a14]/90">{meta.victim.bio}</p>
          </motion.div>

          {/* brief */}
          <motion.div
            className="paper relative overflow-hidden pb-8"
            initial={{ opacity: 0, y: 40, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 0.6 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="flex items-center justify-between gap-4 bg-[#1d1a14] px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#e9e4d8] md:px-12">
              <span>Vesper City PD — Summary of facts</span>
              <span className="hidden text-[#e9e4d8]/70 sm:inline">Case {meta.number}</span>
            </div>
            {/* binder rings down the edge */}
            <div className="pointer-events-none absolute inset-y-0 left-1.5 hidden flex-col justify-around py-16 md:flex" aria-hidden="true">
              {[0, 1].map((k) => (
                <span key={k} className="h-6 w-6 rounded-full border-[3px] border-[#8d959c] bg-transparent shadow-[0_2px_3px_rgba(0,0,0,.5)]" />
              ))}
            </div>
            <ol className="mt-6 space-y-3 px-6 md:px-12 font-mono text-[13px] leading-relaxed text-[#1d1a14] md:text-sm">
              {meta.brief.map((line, i) => (
                <li key={line} className="grid grid-cols-[2rem_1fr]">
                  <span className="text-[#1d1a14]/50">{String(i + 1).padStart(2, "0")}</span>
                  {i <= typed ? (
                    <Typewriter text={line} speed={14} delay={i === 0 ? 700 : 120} onDone={() => setTyped((t) => Math.max(t, i + 1))} />
                  ) : (
                    <span className="invisible">{line}</span>
                  )}
                </li>
              ))}
            </ol>
            <div className="mx-6 mt-8 border-l-4 border-crimson-600 bg-[#1d1a14]/[0.06] px-5 py-4 md:mx-12">
              <p className="label-ink !text-crimson-600">Objective</p>
              <p className="font-display mt-2 text-2xl leading-snug text-[#1d1a14] md:text-3xl">{meta.objective}</p>
            </div>
          </motion.div>
        </div>

        {/* people */}
        <div className="mt-14">
          <p className="label">Persons of interest</p>
          <ul className="mt-6 flex snap-x gap-5 overflow-x-auto pb-4 scrollbar-thin md:grid md:grid-cols-5 md:overflow-visible">
            {suspects.map((s, i) => (
              <motion.li
                key={s.id}
                className="relative w-44 shrink-0 snap-start md:w-auto"
                initial={{ opacity: 0, y: -24, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: [-1.5, 1, -0.8, 1.4, -1][i] }}
                transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
              >
                <SuspectCard suspect={s} />
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="mt-12">
          <StartControls meta={meta} start={start} />
        </div>
      </div>
    </div>
  );
}

