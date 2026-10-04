"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas rain. Thin diagonal streaks with depth; a few catch the lamp light when they fall
 * through `glowX`. Off entirely under prefers-reduced-motion.
 */
export function Rain({
  className,
  density = 1,
  glowX,
  angle = 0.18,
}: {
  className?: string;
  density?: number;
  /** 0–1 horizontal position where drops catch warm light. */
  glowX?: number;
  angle?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Drop = { x: number; y: number; len: number; speed: number; depth: number };
    let drops: Drop[] = [];

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor(((w * h) / 9000) * density);
      drops = Array.from({ length: count }, () => spawn(true));
    };

    const spawn = (anywhere = false): Drop => {
      const depth = Math.random();
      return {
        x: Math.random() * (w + 200) - 100,
        y: anywhere ? Math.random() * h : -20 - Math.random() * 100,
        len: 10 + depth * 22,
        speed: 7 + depth * 13,
        depth,
      };
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (const d of drops) {
        const dx = d.len * angle;
        const lit = glowX !== undefined && Math.abs(d.x / w - glowX) < 0.09 && d.y < h * 0.75;
        ctx.strokeStyle = lit
          ? `rgba(240, 174, 85, ${0.25 + d.depth * 0.45})`
          : `rgba(170, 190, 205, ${0.06 + d.depth * 0.16})`;
        ctx.lineWidth = 0.6 + d.depth * 0.8;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - dx, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        d.x -= d.speed * angle;
        if (d.y > h + 20) Object.assign(d, spawn());
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    tick();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, glowX, angle]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
