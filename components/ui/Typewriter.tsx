"use client";

import { useEffect, useState } from "react";
import { useCalm } from "@/lib/client/settings";
import { play } from "@/lib/client/sound";

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
  const reduce = useCalm();
  const [n, setN] = useState(0);
  const shown = reduce ? text.length : n;

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
      if (text[i - 1] && text[i - 1] !== " ") play("type");
      if (i < text.length) timer = setTimeout(step, speed);
      else onDone?.();
    };
    timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, delay, reduce]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      <span aria-hidden="true" className="invisible">
        {text.slice(shown)}
      </span>
    </span>
  );
}
