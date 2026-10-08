"use client";

import { useEffect, useRef } from "react";
import { useCalm } from "@/lib/client/settings";

/** Canvas rain: thin diagonal streaks with depth, brighter where the lamp catches them. */
export function Rain({
  className,
  density = 1,
  glowX,
  angle = 0.18,
  coneTop = 0.2,
  ground = 0.9,
  anchor,
}: {
  className?: string;
  density?: number;
  /** 0–1 horizontal position where drops catch warm light. */
  glowX?: number;
  angle?: number;
  /** Where the lamp hangs (fraction of height); its cone widens below it. */
  coneTop?: number;
  /** Street level (fraction of height): lit drops splash here. */
  ground?: number;
  /** Lamp position and street level in the backdrop SVG's own coordinates. Overrides glowX/coneTop/ground. */
  anchor?: { x: number; y: number; ground: number; vw: number; vh: number; alignX: "min" | "mid" | "max" };
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const calm = useCalm();
  const ax = anchor?.x;
  const ay = anchor?.y;
  const ag = anchor?.ground;
  const avw = anchor?.vw;
  const avh = anchor?.vh;
  const aalign = anchor?.alignX;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || calm) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Rain is soft, so draw at 1x and let the browser scale it.
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

    let lampX = glowX;
    let lampTop = coneTop;
    let street = ground;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (ax !== undefined && ay !== undefined && ag !== undefined && avw && avh) {
        const scale = Math.max(w / avw, h / avh);
        const x0 = aalign === "min" ? 0 : aalign === "max" ? w - avw * scale : (w - avw * scale) / 2;
        const y0 = h - avh * scale; // yMax
        lampX = (x0 + ax * scale) / w;
        lampTop = (y0 + ay * scale) / h;
        street = (y0 + ag * scale) / h;
      }
      canvas.width = w;
      canvas.height = h;
      // Fewer drops on small screens; the eye reads density, not count.
      const perPixel = w < 768 ? 14000 : 9000;
      const count = Math.min(260, Math.floor(((w * h) / perPixel) * density));
      drops = Array.from({ length: count }, () => spawn(true));
    };

    // Nearly invisible in the dark, bright inside the lamp cone.
    const colour = (layer: number, lit: boolean) => {
      const d = (layer + 0.5) / LAYERS;
      return lit ? `rgba(255, 214, 160, ${0.35 + d * 0.5})` : `rgba(170, 190, 205, ${0.035 + d * 0.11})`;
    };
    const styles = Array.from({ length: LAYERS }, (_, l) => [colour(l, false), colour(l, true)] as const);
    type Splash = { x: number; y: number; age: number };
    let splashes: Splash[] = [];

    const inCone = (x: number, y: number) => {
      if (lampX === undefined) return false;
      const fy = y / h;
      if (fy < lampTop || fy > street + 0.02) return false;
      // The cone widens about 0.54px per px below the lamp, matching NoirCity.
      const half = 12 + (y - lampTop * h) * 0.54;
      return Math.abs(x - lampX * w) < half;
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      // Movement is scaled by elapsed time, so a slow device drops frames, not speed.
      const step = last ? Math.min(3, (t - last) / 16.7) : 1;
      last = t;
      // Wind: a slow sway plus a gust every ten seconds or so.
      const gust = Math.pow(Math.max(0, Math.sin((t / 10000) * Math.PI * 2)), 8) * 0.16;
      const slant = angle + Math.sin(t / 3700) * 0.035 + gust;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      // One path per depth layer and light state instead of one per drop.
      for (let layer = 0; layer < LAYERS; layer++) {
        for (const lit of lampX === undefined ? [false] : [false, true]) {
          ctx.beginPath();
          for (const d of drops) {
            if (d.layer !== layer) continue;
            if (inCone(d.x, d.y) !== lit) continue;
            const len = lit ? d.len * 1.25 : d.len;
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - len * slant, d.y + len);
          }
          ctx.strokeStyle = styles[layer][lit ? 1 : 0];
          ctx.lineWidth = (lit ? 0.9 : 0.6) + ((layer + 0.5) / LAYERS) * 0.8;
          ctx.stroke();
        }
      }
      // Splashes where lit drops hit the street.
      if (splashes.length) {
        ctx.beginPath();
        for (const sp of splashes) {
          const r = 1.5 + sp.age * 0.7;
          ctx.moveTo(sp.x - r, sp.y);
          ctx.quadraticCurveTo(sp.x - r * 0.6, sp.y - r * 0.9, sp.x - r * 0.2, sp.y);
          ctx.moveTo(sp.x + r * 0.2, sp.y);
          ctx.quadraticCurveTo(sp.x + r * 0.6, sp.y - r * 0.9, sp.x + r, sp.y);
        }
        ctx.strokeStyle = "rgba(255, 214, 160, 0.45)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        splashes = splashes.filter((sp) => (sp.age += step) < 9);
      }
      const groundY = street * h;
      for (const d of drops) {
        const wasAbove = d.y < groundY;
        d.y += d.speed * step;
        d.x -= d.speed * slant * step;
        if (lampX !== undefined && wasAbove && d.y >= groundY && splashes.length < 60 && inCone(d.x, groundY - 1)) {
          splashes.push({ x: d.x, y: groundY + (d.layer - 1.5) * 4, age: 0 });
        }
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
  }, [density, glowX, angle, calm, coneTop, ground, ax, ay, ag, avw, avh, aalign]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
