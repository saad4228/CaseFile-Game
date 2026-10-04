"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/** Types text out character by character. Instant under reduced motion. */
export function Typewriter({
  text,
  speed = 28,
  delay = 0,
  className,
  onDone,
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onDone?: () => void;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);

  useEffect(() => {
    if (reduce) {
      onDone?.();
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i++;
      setN(i);
      if (i < text.length) timer = setTimeout(step, speed);
      else onDone?.();
    };
    timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, delay, reduce]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, n)}</span>
      <span aria-hidden="true" className="invisible">
        {text.slice(n)}
      </span>
    </span>
  );
}
