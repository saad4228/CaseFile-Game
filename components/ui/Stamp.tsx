"use client";

import { motion, useReducedMotion } from "framer-motion";

const tones = {
  crimson: "text-crimson-600",
  ink: "text-[#2b2b33]",
  amber: "text-amber-500",
  bone: "text-bone-100",
} as const;

/** A rubber stamp. With `animate`, it lands: scales down from 1.4 with a small rotation. */
export function Stamp({
  children,
  tone = "crimson",
  rotate = -8,
  animate = false,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  rotate?: number;
  animate?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const reduce = useReducedMotion();
  const sizes = { sm: "text-[10px]", md: "text-xs", lg: "text-xl md:text-2xl" };
  const cls = `stamp ${tones[tone]} ${sizes[size]} ${className}`;
  if (!animate) {
    return (
      <span className={cls} style={{ transform: `rotate(${rotate}deg)` }}>
        {children}
      </span>
    );
  }
  return (
    <motion.span
      className={cls}
      initial={{ opacity: 0, scale: reduce ? 1 : 1.5, rotate: rotate - 6 }}
      whileInView={{ opacity: 0.92, scale: 1, rotate }}
      viewport={{ once: true, margin: "-20% 0px" }}
      transition={{ duration: 0.35, ease: [0.5, 0, 0.75, 0] }}
    >
      {children}
    </motion.span>
  );
}
