"use client";

import { useEffect, useRef } from "react";
import { useCalm } from "@/lib/client/settings";

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
  const calm = useCalm();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || calm) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Rain is soft by nature: draw at 1× and let the browser scale it. That alone cuts the
    // fill cost 4–9× on high-density screens.
    const LAYERS = 4;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let last = 0;

    type Drop = { x: number; y: number; len: number; speed: number; layer: number };
    let drops: Drop[] = [];

    const spawn = (anywhere = false): Drop => {
      const layer = Math.floor(Math.random() * LAYERS);
      const depth = (layer + Math.random()) / LAYERS;
      return {
        x: Math.random() * (w + 200) - 100,
        y: anywhere ? Math.random() * h : -20 - Math.random() * 100,
        len: 10 + depth * 22,
        speed: 7 + depth * 13,
        layer,
      };
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w;
      canvas.height = h;
      // Fewer drops on small screens; the eye reads density, not count.
      const perPixel = w < 768 ? 14000 : 9000;
      const count = Math.min(260, Math.floor(((w * h) / perPixel) * density));
      drops = Array.from({ length: count }, () => spawn(true));
    };

    const colour = (layer: number, lit: boolean) => {
      const d = (layer + 0.5) / LAYERS;
      return lit ? `rgba(240, 174, 85, ${0.25 + d * 0.45})` : `rgba(170, 190, 205, ${0.06 + d * 0.16})`;
    };
    const styles = Array.from({ length: LAYERS }, (_, l) => [colour(l, false), colour(l, true)] as const);

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      // Movement is scaled by elapsed time, so a slow device drops frames, not speed.
      const step = last ? Math.min(3, (t - last) / 16.7) : 1;
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      // One path per depth layer (and one for lamp-lit drops) instead of one per drop.
      for (let layer = 0; layer < LAYERS; layer++) {
        for (const lit of glowX === undefined ? [false] : [false, true]) {
          ctx.beginPath();
          for (const d of drops) {
            if (d.layer !== layer) continue;
            const isLit = glowX !== undefined && Math.abs(d.x / w - glowX) < 0.09 && d.y < h * 0.75;
            if (isLit !== lit) continue;
            const dx = d.len * angle;
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - dx, d.y + d.len);
          }
          ctx.strokeStyle = styles[layer][lit ? 1 : 0];
          ctx.lineWidth = 0.6 + ((layer + 0.5) / LAYERS) * 0.8;
          ctx.stroke();
        }
      }
      for (const d of drops) {
        d.y += d.speed * step;
        d.x -= d.speed * angle * step;
        if (d.y > h + 20) Object.assign(d, spawn());
      }
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = 0;
      if (visible && !document.hidden) raf = requestAnimationFrame(draw);
    };

    resize();
    start();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    // Stop drawing when the canvas is scrolled away or the tab is in the background.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", start);
    };
  }, [density, glowX, angle, calm]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
