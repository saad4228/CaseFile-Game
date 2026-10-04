"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { SectionMark } from "@/components/ui/SectionMark";

const assumptions = [
  { text: "She could open the door to Room 314", tags: [] as string[] },
  { text: "She was on the third floor between 23:41 and 23:47", tags: ["E-011", "E-012"] },
  { text: "She had the means", tags: [] },
  { text: "Her account of the evening has a gap", tags: ["E-006", "E-012"] },
  { text: "She knew Daniel would be in the room", tags: ["E-004"] },
];

export function SectionProve() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25% 0px" });
  const reduce = useReducedMotion();

  return (
    <section className="relative py-28 md:py-40" aria-labelledby="prove-heading">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-4 md:px-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <SectionMark n="05" label="Prove" />
          <h2 id="prove-heading" className="font-display mt-8 text-5xl leading-[0.95] md:text-7xl">
            If it&apos;s true,
            <br />
            <em className="text-amber-300">what else must be?</em>
          </h2>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-bone-100/75">
            Every theory comes with a bill. Name a suspect and CASEFILE asks what would have to be
            true for you to be right — access, presence, means, a gap in the timeline. Then go and
            find out.
          </p>
        </div>

        <div ref={ref} className="paper torn relative mx-auto w-full max-w-xl -rotate-1 px-6 py-8 md:px-10 md:py-10">
          <p className="label-ink">Theory #01 — working</p>
          <p className="font-display mt-3 text-3xl leading-tight text-[#1d1a14] md:text-4xl">
            Sarah Vale was in Room 314 at 23:41.
          </p>
          <p className="mt-8 font-mono text-[11px] font-semibold tracking-[0.25em] text-crimson-600">
            IF THIS IS TRUE, WHAT ELSE WOULD HAVE TO BE TRUE?
          </p>
          <ul className="mt-5 space-y-4">
            {assumptions.map((a, i) => (
              <motion.li
                key={a.text}
                className="flex items-start gap-3 border-b border-[#1d1a14]/15 pb-3"
                initial={{ opacity: 0, x: reduce ? 0 : -12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.25, duration: 0.5 }}
              >
                <span className="mt-1 h-4 w-4 shrink-0 border-2 border-[#1d1a14]/70" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-[15px] leading-snug text-[#1d1a14]">{a.text}</p>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.15em] text-[#4f4636]">
                    {a.tags.length ? `ATTACHED · ${a.tags.join(" · ")}` : "NO EVIDENCE ATTACHED"}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
          <p className="font-hand mt-6 text-3xl leading-none text-[#22305a]/80">check the garage?</p>
        </div>
      </div>
    </section>
  );
}
