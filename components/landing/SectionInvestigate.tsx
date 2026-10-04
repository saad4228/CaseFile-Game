"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { PhotoScene } from "@/components/illustrations/PhotoScene";
import { SectionMark } from "@/components/ui/SectionMark";
import { useCalm } from "@/lib/client/settings";

function Floating({
  progress,
  speed,
  rotate,
  className,
  children,
}: {
  progress: MotionValue<number>;
  speed: number;
  rotate: number;
  className: string;
  children: React.ReactNode;
}) {
  const reduce = useCalm();
  const y = useTransform(progress, [0, 1], reduce ? [0, 0] : [speed, -speed]);
  const r = useTransform(progress, [0, 1], reduce ? [rotate, rotate] : [rotate - 4, rotate + 4]);
  return (
    <motion.div style={{ y, rotate: r }} className={`absolute ${className}`}>
      {children}
    </motion.div>
  );
}

export function SectionInvestigate() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <section ref={ref} className="relative h-[150vh] min-h-[900px] overflow-hidden" aria-labelledby="investigate-heading">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <Floating progress={scrollYProgress} speed={180} rotate={-7} className="left-[4%] top-[8%] w-56 md:left-[8%] md:w-72">
        <div className="paper torn px-5 py-4">
          <p className="label-ink">Evidence #012 — Hotel exit log</p>
          <table className="mt-3 w-full font-mono text-[11px] text-[#1d1a14]">
            <tbody>
              <tr><td className="py-0.5 pr-3">23:24</td><td>Kitchen service door</td></tr>
              <tr><td className="py-0.5 pr-3">23:43</td><td>P2 pedestrian door</td></tr>
              <tr><td className="py-0.5 pr-3">00:05</td><td>Main doors</td></tr>
            </tbody>
          </table>
        </div>
      </Floating>

      <Floating progress={scrollYProgress} speed={260} rotate={6} className="right-[3%] top-[6%] w-52 md:right-[10%] md:w-80">
        <div className="photo-print">
          <div className="scanlines">
            <PhotoScene scene="lobby" cctv={{ cam: "CAM L-1", time: "23:20:04" }} className="block w-full" />
          </div>
          <p className="mt-2 text-center font-mono text-[10px] tracking-[0.2em] text-[#3a3428]">LOBBY — 23:20</p>
        </div>
      </Floating>

      <Floating progress={scrollYProgress} speed={120} rotate={3} className="bottom-[10%] left-[6%] w-60 md:bottom-[14%] md:left-[16%] md:w-72">
        <div className="paper px-5 py-4">
          <p className="label-ink">Call log — D. Mercer</p>
          <p className="mt-3 font-mono text-xs leading-relaxed text-[#1d1a14]">
            NOV 14 · 23:46:13
            <br />
            OUT · +1 555 0143
            <br />
            LENGTH 0m 07s
          </p>
        </div>
      </Floating>

      <Floating progress={scrollYProgress} speed={220} rotate={-4} className="bottom-[6%] right-[4%] w-56 md:bottom-[12%] md:right-[14%] md:w-64">
        <div className="paper-aged px-6 py-5">
          <p className="font-hand text-4xl leading-none text-[#22305a]">J knows.</p>
          <p className="font-hand mt-3 text-2xl leading-none text-[#22305a]/70">don&apos;t use the room phone</p>
        </div>
      </Floating>

      <Floating progress={scrollYProgress} speed={80} rotate={-2} className="left-[38%] top-[2%] hidden w-64 lg:block">
        <div className="paper px-5 py-4">
          <p className="label-ink">Sentinel — ticket #88214</p>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-[#1d1a14]">
            CAMERA 3F-EAST
            <br />
            OFFLINE 23:31 – 23:52
          </p>
        </div>
      </Floating>

      <div className="sticky top-0 flex h-screen items-center justify-center px-4">
        <div className="relative z-10 max-w-2xl text-center">
          <SectionMark n="02" label="Investigate" className="justify-center" />
          <h2 id="investigate-heading" className="font-display mt-8 text-6xl leading-[0.92] md:text-8xl">
            Every record
            <br />
            is a <em className="text-amber-300">witness.</em>
          </h2>
          <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-bone-100/75">
            Statements, door logs, phone records, photographs, a voicemail. Thirty of them. Some are
            telling the truth.
          </p>
        </div>
      </div>
    </section>
  );
}
