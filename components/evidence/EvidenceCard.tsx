"use client";

import { PhotoScene } from "@/components/illustrations/PhotoScene";
import type { Evidence } from "@/lib/game-engine/types";
import { categoryLabel, evidenceCode } from "./format";

/** A small paper slip for trays, lists and the board. */
export function EvidenceCard({
  e,
  unseen,
  pinned,
  compact,
}: {
  e: Evidence;
  unseen?: boolean;
  pinned?: boolean;
  compact?: boolean;
}) {
  const isPhoto = e.body.kind === "photo";
  return (
    <div className={`relative ${isPhoto ? "photo-print" : "paper"} ${compact ? "w-40" : "w-48"} text-left`}>
      {unseen && (
        <span className="absolute -right-1.5 -top-1.5 z-10 h-3 w-3 rounded-full bg-amber-500 ring-2 ring-ink-950" aria-label="Not yet examined" />
      )}
      {pinned && <span className="absolute left-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-crimson-600" aria-label="Pinned" />}
      {isPhoto && e.body.kind === "photo" ? (
        <>
          <div className={e.category === "CCTV" ? "scanlines" : ""}>
            <PhotoScene scene={e.body.scene} className="block w-full" />
          </div>
          <p className="mt-1.5 truncate px-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#3a3428]">
            {evidenceCode(e.number)} · {e.title}
          </p>
        </>
      ) : (
        <div className={compact ? "px-3 py-2.5" : "px-3.5 py-3"}>
          <p className="label-ink !text-[9px]">
            {evidenceCode(e.number)} · {categoryLabel[e.category]}
          </p>
          <p className={`mt-1.5 font-display leading-tight text-[#1d1a14] ${compact ? "text-[15px]" : "text-base"} line-clamp-2`}>
            {e.title}
          </p>
          <p className="mt-2 font-mono text-[10px] text-[#1d1a14]/70">{e.time ?? "—"}</p>
        </div>
      )}
    </div>
  );
}
