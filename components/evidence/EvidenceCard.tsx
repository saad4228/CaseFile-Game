"use client";

import { PhotoScene } from "@/components/illustrations/PhotoScene";
import { RecordIcon } from "@/components/ui/RecordIcon";
import type { Evidence } from "@/lib/game-engine/types";
import { categoryLabel, evidenceCode } from "./format";

/** A small paper slip for trays, lists and the board. */
export function EvidenceCard({
  e,
  unseen,
  pinned,
  compact,
  privateRecord,
}: {
  e: Evidence;
  unseen?: boolean;
  pinned?: boolean;
  compact?: boolean;
  privateRecord?: boolean;
}) {
  const isPhoto = e.body.kind === "photo";
  const kind = e.body.kind;
  // Each kind of record has its own paper: statements are police forms, handwriting is on a
  // yellow legal pad, everything else a typed slip.
  const surface = isPhoto ? "photo-print" : kind === "handwritten" ? "legal-pad" : "paper";
  return (
    <div className={`relative ${surface} ${compact ? "w-40" : "w-48"} text-left`}>
      {unseen && (
        <span className="absolute -right-1.5 -top-1.5 z-10 h-3 w-3 rounded-full bg-amber-500 ring-2 ring-ink-950" aria-label="Not yet examined" />
      )}
      {pinned && <span className="absolute left-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-crimson-600" aria-label="Pinned" />}
      {privateRecord && (
        <span className="absolute -left-1.5 -top-2 z-10 bg-ink-950 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-amber-300 ring-1 ring-amber-500/60">
          🔒 Private
        </span>
      )}
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
          {kind === "statement" && (
            <p className="-mx-3 -mt-2.5 mb-2 bg-[#1d1a14] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.25em] text-[#e9e4d8]">
              Statement
            </p>
          )}
          <div className="flex items-start justify-between gap-2">
            <p className="label-ink !text-[9px]">
              {evidenceCode(e.number)} · {categoryLabel[e.category]}
            </p>
            <RecordIcon category={e.category} className="h-4 w-4 shrink-0 text-[#1d1a14]/55" />
          </div>
          <p className={`mt-1.5 font-display leading-tight text-[#1d1a14] ${compact ? "text-[15px]" : "text-base"} line-clamp-2`}>
            {e.title}
          </p>
          <p className="mt-2 font-mono text-[10px] text-[#1d1a14]/70">{e.time ?? "—"}</p>
        </div>
      )}
    </div>
  );
}
