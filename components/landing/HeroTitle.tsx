"use client";

import { motion } from "framer-motion";
import { useCalm } from "@/lib/client/settings";

const letters = "CASEFILE".split("");

/** The wordmark, letters surfacing out of the dark one by one. */
export function HeroTitle() {
  const reduce = useCalm();
  return (
    <h1
      className="font-display -ml-[0.05em] text-[19vw] leading-[0.8] tracking-[-0.02em] text-bone-100 md:text-[15.5vw] 2xl:text-[15rem]"
      aria-label="CASEFILE"
    >
      {letters.map((l, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block"
          initial={{ opacity: 0, y: reduce ? 0 : "0.12em" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.25 + i * 0.09, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {l}
        </motion.span>
      ))}
    </h1>
  );
}
