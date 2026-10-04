"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Detective } from "@/components/illustrations/Detective";
import { SuspectPortrait } from "@/components/illustrations/SuspectPortrait";
import { SectionMark } from "@/components/ui/SectionMark";

type Beat = { q: string; a: string; withEvidence?: string };

const beats: Beat[] = [
  {
    q: "Did you speak to Daniel on the night he died?",
    a: "No. It was a Thursday. I don't call my writers on Thursdays.",
    withEvidence:
      "Four minutes, Detective. That isn't a conversation. That's a courtesy. I told him to get some sleep.",
  },
  {
    q: "Where were you at eleven?",
    a: "The Mercury Bar, with a client. Ask the bartender — I tip well enough to be remembered.",
  },
  {
    q: "Was Daniel's story a problem for you?",
    a: "Daniel's stories were the only reason anyone read us. Next question.",
  },
];

export function SectionQuestion() {
  const [active, setActive] = useState(0);
  const [presented, setPresented] = useState(false);
  const beat = beats[active];
  const answer = presented && beat.withEvidence ? beat.withEvidence : beat.a;

  return (
    <section className="relative overflow-hidden py-28 md:py-40" aria-labelledby="question-heading">
      <div className="mx-auto max-w-[1400px] px-4 md:px-10">
        <SectionMark n="04" label="Question" />
        <h2 id="question-heading" className="font-display mt-8 max-w-3xl text-5xl leading-[0.95] md:text-7xl">
          Nobody confesses.
          <br />
          <em className="text-amber-300">They adjust.</em>
        </h2>

        <div className="relative mt-16 grid min-h-[520px] overflow-hidden border border-ink-700 bg-ink-900 md:grid-cols-[1fr_1.3fr_1fr]">
          {/* single overhead lamp */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[60%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_70%_at_50%_0%,rgba(240,174,85,0.16),transparent_70%)]" />

          <div className="relative hidden items-end justify-center md:flex">
            <Detective className="h-[380px] -scale-x-100 opacity-95" fill="#040506" rim="#f0ae55" />
          </div>

          <div className="relative z-10 flex flex-col justify-between gap-8 p-6 md:p-10">
            <div>
              <p className="label">Interview — Marcus Reed — 10:05, Nov 15</p>
              <p className="mt-6 font-mono text-sm uppercase tracking-[0.15em] text-steel-300">You</p>
              <p className="font-display mt-2 text-2xl leading-snug md:text-3xl">{beat.q}</p>
              <p className="mt-8 font-mono text-sm uppercase tracking-[0.15em] text-steel-300">Reed</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={answer}
                  className="mt-2 text-lg leading-relaxed text-bone-100/90 md:text-xl"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}
                >
                  “{answer}”
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="space-y-3">
              {beat.withEvidence && (
                <button
                  type="button"
                  onClick={() => setPresented(true)}
                  disabled={presented}
                  className="btn btn-sm w-full !justify-between border-crimson-600/70 text-left text-[#e0a59e] hover:bg-crimson-600/15 disabled:cursor-default disabled:opacity-60"
                >
                  <span>{presented ? "Presented" : "Present"} evidence #004</span>
                  <span className="tracking-[0.1em] text-[#e0a59e]/70">Call log · 22:53</span>
                </button>
              )}
              <ul className="space-y-2" aria-label="Questions">
                {beats.map((b, i) => (
                  <li key={b.q}>
                    <button
                      type="button"
                      onClick={() => {
                        setActive(i);
                        setPresented(false);
                      }}
                      aria-pressed={i === active}
                      className={`w-full border-l-2 px-4 py-2 text-left text-sm transition-colors ${
                        i === active
                          ? "border-amber-500 bg-amber-500/10 text-bone-100"
                          : "border-ink-600 text-bone-100/60 hover:border-bone-100/40 hover:text-bone-100"
                      }`}
                    >
                      {b.q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative hidden items-end justify-center pb-0 md:flex">
            <div className="relative w-[78%]">
              <SuspectPortrait spec={{ hair: "swept", collar: "suit", glasses: true }} label="Marcus Reed" tone="warm" className="block w-full opacity-90 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
