"use client";

import { PhotoScene } from "@/components/illustrations/PhotoScene";
import type { Evidence } from "@/lib/game-engine/types";

/** Renders an evidence item's typed body as the physical record it is. */
export function EvidenceBody({ e, zoom = 1, rotate = 0, compact = false }: { e: Evidence; zoom?: number; rotate?: number; compact?: boolean }) {
  const b = e.body;
  switch (b.kind) {
    case "statement":
      return (
        <div className="paper torn mx-auto max-w-2xl px-6 py-8 md:px-10">
          <p className="label-ink">Witness statement</p>
          <p className="font-display mt-2 text-3xl text-[#1d1a14]">{b.speaker}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-[#1d1a14]/70">{b.takenAt}</p>
          <div className="mt-6 space-y-4 border-t border-[#1d1a14]/20 pt-6">
            {b.quotes.map((q, i) => (
              <p key={i} className="font-mono text-[13px] leading-relaxed text-[#1d1a14] md:text-sm">
                <span className="mr-3 text-[#1d1a14]/45">Q{i + 1}</span>“{q}”
              </p>
            ))}
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1d1a14]/55">{e.source}</p>
        </div>
      );
    case "document":
      return (
        <div className="paper mx-auto max-w-2xl px-6 py-8 md:px-10">
          {b.heading && <p className="font-mono text-xs font-semibold tracking-[0.12em] text-[#1d1a14]">{b.heading}</p>}
          <div className="mt-5 space-y-3">
            {b.lines.map((l, i) => (
              <p key={i} className="font-mono text-[13px] leading-relaxed text-[#1d1a14]">
                {l}
              </p>
            ))}
          </div>
          {b.footer && (
            <p className="mt-6 border-t border-[#1d1a14]/20 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1d1a14]/60">
              {b.footer}
            </p>
          )}
        </div>
      );
    case "handwritten":
      return (
        <div className="paper-aged mx-auto max-w-xl px-8 py-10" style={{ backgroundImage: "var(--fibre), repeating-linear-gradient(to bottom, transparent 0 37px, rgba(40,60,110,.25) 37px 38px)" }}>
          <div className="space-y-2">
            {b.lines.map((l, i) => (
              <p key={i} className="font-hand text-[30px] leading-[38px] text-[#1f2c55]" style={{ transform: `rotate(${((i % 3) - 1) * 0.4}deg)` }}>
                {l}
              </p>
            ))}
          </div>
        </div>
      );
    case "log":
      return (
        <div className="paper mx-auto max-w-3xl overflow-x-auto px-4 py-6 md:px-8">
          <table className={`w-full font-mono text-[#1d1a14] ${compact ? "text-[11px]" : "min-w-[520px] text-[12px]"}`}>
            <thead>
              <tr className="border-b-2 border-[#1d1a14]/40 text-left">
                {b.columns.map((c) => (
                  <th key={c} scope="col" className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.15em]">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="border-b border-[#1d1a14]/15 align-top">
                  {r.cells.map((c, j) => (
                    <td key={j} className="px-2 py-2 tabular-nums">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {b.note && <p className="mt-4 font-mono text-[11px] leading-relaxed text-[#1d1a14]/80">{b.note}</p>}
        </div>
      );
    case "photo":
      return (
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden">
            <div
              className="photo-print mx-auto max-w-2xl transition-transform duration-300"
              style={{ transform: `scale(${zoom}) rotate(${rotate}deg)`, transformOrigin: "center" }}
            >
              <div className={e.category === "CCTV" ? "scanlines" : ""}>
                <PhotoScene
                  scene={b.scene}
                  className="block w-full"
                  cctv={e.category === "CCTV" && e.time ? { cam: `CAM ${e.source.match(/camera ([A-Z0-9][A-Z0-9-]*)/)?.[1] ?? "BOOTH"}`, time: `${e.time}:00` } : undefined}
                  stamp={e.category !== "CCTV" ? `${e.source.toUpperCase()}` : undefined}
                />
              </div>
              <p className="mt-2 text-center font-mono text-[11px] text-[#3a3428]">{b.caption}</p>
            </div>
          </div>
          <div className="paper mx-auto mt-6 max-w-2xl px-6 py-5">
            <p className="label-ink">In frame</p>
            <ul className="mt-3 space-y-2">
              {b.inFrame.map((l, i) => (
                <li key={i} className="font-mono text-[12.5px] leading-relaxed text-[#1d1a14]">
                  — {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    case "audio":
      return (
        <div className="mx-auto max-w-2xl">
          <div className="panel px-6 py-6">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-amber-500 text-amber-300" aria-hidden="true">
                ▶
              </span>
              <Waveform />
              <span className="font-mono text-sm text-steel-300">{b.duration}</span>
            </div>
            <p className="label mt-4">Audio unavailable in this build — transcript and analyst note below</p>
          </div>
          <div className="paper mt-6 px-6 py-6">
            <p className="label-ink">Transcript</p>
            <ul className="mt-3 space-y-2">
              {b.transcript.map((l, i) => (
                <li key={i} className="font-mono text-[13px] leading-relaxed text-[#1d1a14]">
                  {l}
                </li>
              ))}
            </ul>
            {b.note && <p className="mt-5 border-t border-[#1d1a14]/20 pt-3 font-mono text-[11px] text-[#1d1a14]/75">{b.note}</p>}
          </div>
        </div>
      );
    case "messages":
      return (
        <div className="panel mx-auto max-w-md space-y-3 p-6">
          {b.thread.map((m, i) => (
            <div key={i}>
              <p className="label">
                {m.from} · {m.time}
              </p>
              <p className="mt-1 bg-ink-800 px-4 py-3 text-sm">{m.text}</p>
            </div>
          ))}
        </div>
      );
  }
}

function Waveform() {
  const bars = [3, 6, 4, 9, 14, 8, 5, 11, 16, 12, 7, 4, 10, 18, 9, 6, 13, 7, 3, 5, 8, 4, 2, 3];
  return (
    <svg viewBox="0 0 120 24" className="h-8 flex-1" aria-hidden="true">
      {bars.map((h, i) => (
        <rect key={i} x={i * 5} y={12 - h / 2} width="3" height={h} fill="#d98a3a" opacity={0.4 + (h / 18) * 0.6} />
      ))}
    </svg>
  );
}
