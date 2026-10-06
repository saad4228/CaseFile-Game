"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { useGame } from "@/components/game/GameContext";
import { RingSymbol } from "@/components/ui/RingSymbol";
import { play } from "@/lib/client/sound";
import { ComicStrip } from "./ComicStrip";
import { LineUp } from "./LineUp";
import { Stamp } from "@/components/ui/Stamp";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { PROOF_SLOTS, VERDICT_FIELDS } from "@/lib/game-engine/types";
import { WEIGHTS } from "@/lib/scoring/types";
import { useCalm } from "@/lib/client/settings";

const QUESTION = { who: "Who", how: "How", when: "When", where: "Where", why: "Why" } as const;
const DIMENSIONS: { key: keyof typeof WEIGHTS; label: string }[] = [
  { key: "deduction", label: "Deduction" },
  { key: "evidence", label: "Evidence" },
  { key: "logic", label: "Logic" },
  { key: "contradictions", label: "Contradictions" },
  { key: "efficiency", label: "Efficiency" },
  { key: "proof", label: "Proof" },
  { key: "time", label: "Time" },
];
const code = (n: number) => `#${String(n).padStart(3, "0")}`;
const fmt = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;

export function ResolutionView({ onReview, onPlayAgain }: { onReview: () => void; onPlayAgain?: () => void }) {
  const { result, mode, suspects } = useGame();
  useEffect(() => {
    const t = setTimeout(() => play("stamp"), 1650);
    return () => clearTimeout(t);
  }, []);
  const reduce = useCalm();
  if (!result) return null;
  const { score, truth } = result;
  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-10% 0px" },
    transition: { duration: 0.8, delay, ease: [0.22, 0.61, 0.36, 1] as const },
  });

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      {/* Case closed */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[80%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_55%_at_50%_0%,rgba(240,174,85,0.16),transparent_70%)]" />
        <motion.p className="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          Case {result.number} — {result.title}
        </motion.p>
        <motion.h1
          className="font-display mt-6 text-6xl leading-[0.9] md:text-9xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4 }}
        >
          Case resolution
        </motion.h1>
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, scale: reduce ? 1 : 1.6, rotate: -18 }}
          animate={{ opacity: 1, scale: 1, rotate: -9 }}
          transition={{ delay: 1.6, duration: 0.35, ease: [0.5, 0, 0.75, 0] }}
        >
          <span className={`stamp text-3xl md:text-5xl ${score.solved ? "text-crimson-400" : "text-steel-300"}`} style={{ transform: "none" }}>
            {score.solved ? "Solved" : "Unsolved"}
          </span>
        </motion.div>
        <motion.p
          className="mt-10 max-w-xl text-lg text-bone-100/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
        >
          {score.solved
            ? `You solved Case ${result.number}.`
            : score.details.answers.who.correct
              ? "You named the right person. Your proof didn't hold."
              : "The file closes on the wrong name."}{" "}
          Filed by {result.filedBy} after {fmt(score.details.durationSec)}.
        </motion.p>
      </section>

      <div className="mx-auto max-w-6xl space-y-28 px-4 pb-28 md:px-10">
        {/* Verdict vs truth */}
        <motion.section {...fade()} aria-labelledby="r-verdict">
          <h2 id="r-verdict" className="label">Your verdict · the truth</h2>
          <div className="mt-6 divide-y divide-ink-700 border-y border-ink-700">
            {VERDICT_FIELDS.map((f) => {
              const a = score.details.answers[f];
              return (
                <div key={f} className="grid gap-2 py-5 md:grid-cols-[120px_1fr_1fr] md:items-baseline">
                  <p className="font-display text-3xl uppercase">{QUESTION[f]}</p>
                  <p className={`text-lg ${a.correct ? "text-bone-100" : "text-bone-100/50 line-through decoration-crimson-600/70"}`}>
                    <span className="mr-2 font-mono text-sm">{a.correct ? "✓" : a.credit > 0 ? "~" : "✗"}</span>
                    {result.given[f]?.label ?? "No answer"}
                  </p>
                  <div>
                    <p className="text-lg text-amber-300">{truth.answers[f].label}</p>
                    <p className="mt-1 text-sm text-bone-100/60">{truth.summary[f]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* The line-up */}
        <section aria-labelledby="r-lineup">
          <motion.h2 {...fade()} id="r-lineup" className="label">
            The line-up
          </motion.h2>
          <div className="mt-6">
            <LineUp suspects={suspects} culpritId={truth.answers.who.id} />
          </div>
        </section>

        {/* What happened — comic panels */}
        <section aria-labelledby="r-sequence">
          <motion.h2 {...fade()} id="r-sequence" className="font-display text-5xl md:text-6xl">
            What happened
          </motion.h2>
          <div className="mt-10">
            <ComicStrip sequence={truth.sequence} />
          </div>
        </section>

        {/* Score */}
        <motion.section {...fade()} aria-labelledby="r-score" className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="paper relative px-6 py-8 md:px-10">
            <h2 id="r-score" className="label-ink">Investigation score</h2>
            <table className="mt-6 w-full font-mono text-sm text-[#1d1a14]">
              <tbody>
                {DIMENSIONS.map((d) => (
                  <tr key={d.key} className="border-b border-[#1d1a14]/15">
                    <td className="py-2.5 uppercase tracking-[0.15em]">{d.label}</td>
                    <td className="w-1/2 py-2.5">
                      <div className="h-1.5 bg-[#1d1a14]/10">
                        <motion.div
                          className="h-full bg-[#1d1a14]/70"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${score.scores[d.key]}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: 0.2 }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 text-right tabular-nums">{score.scores[d.key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="label-ink">Final</p>
                <p className="font-display text-7xl leading-none text-[#1d1a14]">
                  {score.final}
                  <span className="text-2xl text-[#4f4636]"> / 100</span>
                </p>
              </div>
              <div className="text-right">
                <p className="label-ink">Rank</p>
                <p className="font-display text-7xl leading-none text-crimson-600">{score.rank}</p>
              </div>
            </div>
            <div className="absolute right-6 top-6">
              <Stamp tone={score.solved ? "crimson" : "ink"} rotate={-11} size="md" animate>
                {score.solved ? "Closed" : "Open"}
              </Stamp>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="label">Your proof</p>
              <ul className="mt-3 space-y-3">
                {PROOF_SLOTS.map((slot) => {
                  const p = score.details.proof[slot];
                  return (
                    <li key={slot} className="border border-ink-700 p-3">
                      <p className="flex justify-between font-mono text-[11px] uppercase tracking-[0.2em]">
                        <span>{slot}</span>
                        <span className={p.proven ? "text-amber-300" : "text-steel-400"}>{p.proven ? "Proven" : "Not proven"}</span>
                      </p>
                      <p className="mt-1.5 text-sm text-bone-100/70">
                        {p.attached.length
                          ? p.attached.map((a) => `${a.accepted ? "✓" : "✗"} ${a.id.replace("E-", "#")}`).join("  ·  ")
                          : "Nothing attached."}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="text-sm text-bone-100/60">
              Board: {score.details.logic.correct} sound connections, {score.details.logic.wrong} that don&apos;t hold. Conflicts
              classified as contradictions: {score.details.contradictions.contradiction}/{score.details.contradictions.total}. Leads that
              mattered: {score.details.efficiency.relevant}/{score.details.efficiency.followed}.
            </p>
          </div>
        </motion.section>

        {score.achievements.length > 0 && (
          <motion.section {...fade()} aria-labelledby="r-ach">
            <h2 id="r-ach" className="label">Commendations</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {score.achievements.map((k) => (
                <li key={k} className="paper-aged px-5 py-4">
                  <p className="font-display text-xl text-[#1d1a14]">{ACHIEVEMENTS[k].title}</p>
                  <p className="mt-1 text-sm text-[#1d1a14]/75">{ACHIEVEMENTS[k].description}</p>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* Explanations */}
        <motion.section {...fade()} aria-labelledby="r-lies" className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 id="r-lies" className="font-display text-4xl">Every lie, explained</h2>
            <ul className="mt-6 space-y-4">
              {truth.conflicts.map((c) => (
                <li key={c.id} className="border-l-2 border-crimson-600/70 pl-4">
                  <p className="font-mono text-[11px] tracking-[0.2em] text-crimson-400">CONFLICT #{String(c.number).padStart(2, "0")} · {c.implicates}</p>
                  <p className="mt-1 text-sm text-bone-100/85">{c.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-4xl">The wrong roads</h2>
              <ul className="mt-6 space-y-5">
                {truth.redHerrings.map((r) => (
                  <li key={r.suspect}>
                    <p className="font-display text-2xl">{r.name}</p>
                    <p className="mt-1 text-sm text-bone-100/55">Looked like: {r.looksLike}</p>
                    <p className="mt-1 text-sm text-bone-100/85">Actually: {r.actually}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-3xl">Records that lied</h2>
              <ul className="mt-4 space-y-2 font-mono text-[12px]">
                {truth.falsified.map((f) => (
                  <li key={f.id} className="flex justify-between gap-3 border-b border-ink-700 pb-2">
                    <span>
                      {code(f.number)} {f.title}
                    </span>
                    <span className="shrink-0 text-steel-300">
                      filed {f.filed} → <span className="text-crimson-400">{f.actual}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {truth.missedKey.length > 0 && (
              <div>
                <h2 className="font-display text-3xl">What you never found</h2>
                <ul className="mt-4 space-y-1 font-mono text-[12px] text-bone-100/70">
                  {truth.missedKey.map((m) => (
                    <li key={m.id}>
                      {code(m.number)} {m.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.section>

        {/* What everyone was holding back — the payoff for four interrogations */}
        {truth.hiding.length > 0 && (
          <motion.section {...fade()} aria-labelledby="r-hiding">
            <h2 id="r-hiding" className="font-display text-4xl md:text-6xl">
              Everyone was hiding something
            </h2>
            <p className="mt-4 max-w-2xl text-bone-100/60">
              Only one of them killed him. The rest had their own reasons to lie to you.
            </p>
            <ul className="mt-10 grid gap-5 md:grid-cols-2">
              {truth.hiding.map((h) => (
                <li key={h.suspect} className="paper-aged px-6 py-5">
                  <p className="font-display text-2xl text-[#1d1a14]">{h.name}</p>
                  <p className="label-ink mt-0.5 !text-[9px]">{h.role}</p>
                  <ul className="mt-4 space-y-1.5">
                    {h.secrets.map((s) => (
                      <li key={s} className="flex gap-2 text-sm leading-snug text-[#1d1a14]/85">
                        <span aria-hidden="true" className="text-crimson-600">
                          —
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                  {h.whyTheyLie && (
                    <p className="font-display mt-4 border-l-2 border-crimson-600 pl-3 text-lg leading-snug text-[#1d1a14]">
                      {h.whyTheyLie}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* Meta mystery */}
        <motion.section {...fade()} className="relative overflow-hidden border border-ink-700 px-6 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(156,41,41,0.12),transparent_65%)]" />
          <RingSymbol className="relative mx-auto h-16 w-16 text-paper-300" />
          <p className="font-display relative mt-8 text-4xl italic md:text-6xl">Who is J?</p>
          <p className="relative mx-auto mt-6 max-w-xl text-bone-100/70">
            The man across from Marcus Reed wore a ring: {truth.metaClue.symbol}. It turns up again.
          </p>
          <div className="paper-aged relative mx-auto mt-10 max-w-md px-6 py-5 text-left">
            <p className="label-ink">New file in the archive</p>
            <p className="font-display mt-1 text-2xl text-[#1d1a14]">{truth.metaClue.teaser}</p>
          </div>
        </motion.section>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button type="button" className="btn btn-ghost" onClick={onReview}>
            Review the board
          </button>
          {onPlayAgain && (
            <button type="button" className="btn btn-ghost" onClick={onPlayAgain}>
              Investigate again
            </button>
          )}
          <Link href={mode === "LOCAL" ? "/archive" : "/profile"} className="btn btn-primary">
            {mode === "LOCAL" ? "Back to the archive" : "Your detective file"}
          </Link>
        </div>
        <p className="text-center text-xs text-bone-100/35">
          {suspects.length} people. {result.truth.conflicts.length} contradictions. One truth.
        </p>
      </div>
    </div>
  );
}
