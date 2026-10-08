"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BlackwoodHotel } from "@/components/illustrations/Blackwood";
import { Rain } from "@/components/illustrations/Rain";
import type { CaseMeta, Suspect } from "@/lib/game-engine/types";
import { useCalm } from "@/lib/client/settings";
import { play } from "@/lib/client/sound";
import { Briefing } from "./Briefing";
import { ClosedFile } from "./ClosedFile";
export type { StartOptions } from "./StartOptions";
import type { StartOptions } from "./StartOptions";

// Opening a case: the closed folder, the title cards, and then the brief.

type Stage = "file" | "opening" | "intro" | "brief";

export function CaseIntro({ meta, suspects, start }: { meta: CaseMeta; suspects: Suspect[]; start: StartOptions }) {
  const [stage, setStage] = useState<Stage>(start.error ? "brief" : "file");
  const [beat, setBeat] = useState(0);
  const reduce = useCalm();

  // file → opening → intro
  useEffect(() => {
    if (stage !== "opening") return;
    const t = setTimeout(() => setStage("intro"), reduce ? 200 : 2300);
    return () => clearTimeout(t);
  }, [stage, reduce]);

  // auto-advance intro beats
  useEffect(() => {
    if (stage !== "intro") return;
    const hold = meta.intro[beat]?.hold ?? 2400;
    const t = setTimeout(() => {
      if (beat < meta.intro.length - 1) setBeat((b) => b + 1);
      else setStage("brief");
    }, hold + 900);
    return () => clearTimeout(t);
  }, [stage, beat, meta.intro]);

  // keyboard: Enter/Space advances, Escape skips the intro
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("button, a")) return;
      if (e.key === "Escape" && stage === "intro") setStage("brief");
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (stage === "file") setStage("opening");
        else if (stage === "intro") {
          if (beat < meta.intro.length - 1) setBeat((b) => b + 1);
          else setStage("brief");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, beat, meta.intro.length]);

  return (
    <main id="main" className="relative min-h-[100svh] overflow-hidden">
      <AnimatePresence mode="wait">
        {(stage === "file" || stage === "opening") && (
          <motion.section
            key="file"
            className="relative flex min-h-[100svh] flex-col items-center justify-center px-4"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="pointer-events-none absolute left-1/2 top-0 h-[80vh] w-[80vw] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(240,174,85,0.18),transparent_70%)]" />
            <ClosedFile meta={meta} opening={stage === "opening"} />
            <AnimatePresence>
              {stage === "file" && (
                <motion.div className="mt-14 flex flex-col items-center gap-4" exit={{ opacity: 0 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      play("paper");
                      setStage("opening");
                    }}
                    autoFocus
                  >
                    Open file
                  </button>
                  <Link href="/archive" className="label hover:text-bone-100">
                    ← Back to the archive
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {stage === "intro" && (
          <motion.section
            key="intro"
            className="relative flex min-h-[100svh] items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            onClick={() => (beat < meta.intro.length - 1 ? setBeat(beat + 1) : setStage("brief"))}
          >
            <BlackwoodHotel bare className="pointer-events-none absolute bottom-0 right-[4%] hidden h-[88%] opacity-45 [mask-image:linear-gradient(to_top,transparent,#000_25%)] md:block" />
            <Rain className="absolute inset-0 h-full w-full opacity-60" density={0.6} />
            <div className="vignette absolute inset-0" />
            <AnimatePresence mode="wait">
              <motion.div
                key={beat}
                className="relative text-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.9 }}
                aria-live="polite"
              >
                {meta.intro[beat].lines.map((line, i) => (
                  <IntroLine key={line} line={line} index={i} emphasis={meta.intro[beat].emphasis} />
                ))}
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-8 flex items-center justify-between px-6 md:px-10">
              <div className="flex gap-1.5" aria-hidden="true">
                {meta.intro.map((_, i) => (
                  <span key={i} className={`h-px w-8 ${i <= beat ? "bg-amber-500" : "bg-ink-600"}`} />
                ))}
              </div>
              <button
                type="button"
                className="label hover:text-bone-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setStage("brief");
                }}
              >
                Skip ▸
              </button>
            </div>
          </motion.section>
        )}

        {stage === "brief" && (
          <motion.section
            key="brief"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Briefing meta={meta} suspects={suspects} start={start} />
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

function IntroLine({ line, index, emphasis }: { line: string; index: number; emphasis?: string }) {
  const cls =
    emphasis === "title"
      ? index === 0
        ? "font-display text-5xl md:text-8xl"
        : "font-mono text-base tracking-[0.4em] text-bone-100/80 md:text-xl"
      : emphasis === "alarm"
        ? "font-display text-6xl italic text-crimson-400 md:text-9xl"
        : "font-mono text-lg tracking-[0.35em] text-bone-100/85 md:text-2xl";
  return (
    <motion.p
      className={`${cls} ${index > 0 ? "mt-4 md:mt-6" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.35 + index * 0.55 }}
    >
      {line}
    </motion.p>
  );
}
