"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createRoomAction, startSoloAction } from "@/app/actions/session";
import { BlackwoodHotel } from "@/components/illustrations/Blackwood";
import { Rain } from "@/components/illustrations/Rain";
import { SuspectPortrait } from "@/components/illustrations/SuspectPortrait";
import { Stamp } from "@/components/ui/Stamp";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Typewriter } from "@/components/ui/Typewriter";
import { SuspectCard } from "@/components/suspects/SuspectCard";
import { DeskProps } from "@/components/ui/DeskProps";
import type { CaseMeta, Suspect } from "@/lib/game-engine/types";
import { useCalm } from "@/lib/client/settings";
import { play } from "@/lib/client/sound";

type Stage = "file" | "opening" | "intro" | "brief";

/** How this deployment can run the case: on a server (accounts, rooms) or on this device only. */
export interface StartOptions {
  online: boolean;
  error?: string;
  /** An unfinished investigation of this case to return to. */
  resume?: { code: string; mode: "SOLO" | "TEAM" } | null;
}

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

function ClosedFile({ meta, opening }: { meta: CaseMeta; opening: boolean }) {
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

function StartControls({ meta, start }: { meta: CaseMeta; start: StartOptions }) {
  if (!start.online) {
    return (
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Link href={`/investigation/${meta.id}`} className="btn btn-primary">
          Begin investigation
        </Link>
        <p className="label normal-case tracking-[0.08em]">Estimated {meta.estTime.toLowerCase()} · progress saves on this device</p>
      </div>
    );
  }
  return (
    <div>
      {start.error && (
        <p role="alert" className="mb-5 max-w-xl border-l-4 border-crimson-600 bg-crimson-600/10 px-4 py-3 text-sm">
          {start.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {start.resume ? (
          <Link href={`/play/${start.resume.code}`} className="btn btn-primary">
            Resume investigation
          </Link>
        ) : (
          <form action={startSoloAction}>
            <input type="hidden" name="caseId" value={meta.id} />
            <SubmitButton className="btn btn-primary" pendingText="Opening the file…">
              Begin investigation
            </SubmitButton>
          </form>
        )}
        <form action={createRoomAction}>
          <input type="hidden" name="caseId" value={meta.id} />
          <SubmitButton className="btn btn-ghost" pendingText="Opening a room…">
            Investigate as a team
          </SubmitButton>
        </form>
        {start.resume && (
          <form action={startSoloAction}>
            <input type="hidden" name="caseId" value={meta.id} />
            <SubmitButton className="label hover:text-bone-100" pendingText="Opening…">
              Start over in a new file
            </SubmitButton>
          </form>
        )}
      </div>
      <p className="label mt-4 normal-case tracking-[0.08em]">
        Estimated {meta.estTime.toLowerCase()} · solo, or 2–4 investigators with an invite link · progress saves to your detective file
      </p>
    </div>
  );
}

function Briefing({ meta, suspects, start }: { meta: CaseMeta; suspects: Suspect[]; start: StartOptions }) {
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
              <SuspectPortrait spec={{ hair: "short", collar: "coat" }} label={meta.victim.name} tone="warm" className="block w-full" />
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
