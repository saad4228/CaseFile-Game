"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useCalm } from "@/lib/client/settings";

/** Fade up out of the dark when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useCalm();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}
