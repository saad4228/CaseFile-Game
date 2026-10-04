"use client";

import { useState, useSyncExternalStore } from "react";
import type { CaseProgress } from "@/lib/archive-types";
import type { CaseMeta } from "@/lib/game-engine/types";
import { CaseFolder } from "./CaseFolder";

// Device-only (demo) progress lives in localStorage; read it without a hydration mismatch.
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

function useDeviceProgress(ids: string[], enabled: boolean): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!enabled) return null;
      try {
        return JSON.stringify(ids.map((id) => localStorage.getItem(`casefile:${id}:v2`)));
      } catch {
        return null;
      }
    },
    () => null,
  );
}

function parseDevice(ids: string[], raw: string | null) {
  const progress: Record<string, CaseProgress> = {};
  const teasers: Record<string, string> = {};
  if (!raw) return { progress, teasers };
  const items = JSON.parse(raw) as (string | null)[];
  items.forEach((item, i) => {
    if (!item) return;
    try {
      const saved = JSON.parse(item);
      const r = saved?.result;
      if (r?.score) {
        progress[ids[i]] = { state: r.score.solved ? "SOLVED" : "CLOSED", rank: r.score.rank, score: r.score.final };
        const clue = r.truth?.metaClue;
        if (r.score.solved && clue?.nextCase && clue.teaser) teasers[clue.nextCase] = String(clue.teaser);
      } else if (Array.isArray(saved?.discovered)) {
        progress[ids[i]] = { state: "OPEN" };
      }
    } catch {
      /* unreadable save: ignore */
    }
  });
  return { progress, teasers };
}

const sections = [
  { id: "cases", label: "Cases" },
  { id: "people", label: "People", empty: "No identities established." },
  { id: "locations", label: "Locations", empty: "No places on file. Close a case to map it." },
  { id: "evidence", label: "Evidence", empty: "Nothing catalogued yet. The archive grows as you investigate." },
  { id: "organizations", label: "Organizations", empty: "No organizations identified." },
  { id: "unsolved", label: "Unsolved", empty: "Every open question will be filed here." },
  { id: "classified", label: "Classified", empty: "Access denied." },
] as const;

export function ArchiveView({
  cases,
  online,
  progress: serverProgress,
  teasers: serverTeasers,
}: {
  cases: CaseMeta[];
  online: boolean;
  progress: Record<string, CaseProgress>;
  teasers: Record<string, string>;
}) {
  const [tab, setTab] = useState<(typeof sections)[number]["id"]>("cases");
  const current = sections.find((s) => s.id === tab)!;
  const ids = cases.filter((c) => c.playable).map((c) => c.id);
  const device = parseDevice(ids, useDeviceProgress(ids, !online));
  const progress = online ? serverProgress : device.progress;
  const teasers = online ? serverTeasers : device.teasers;

  return (
    <>
      <div role="tablist" aria-label="Archive sections" className="scrollbar-thin -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        {sections.map((s) => (
          <button
            key={s.id}
            role="tab"
            id={`tab-${s.id}`}
            aria-selected={tab === s.id}
            aria-controls={`panel-${s.id}`}
            onClick={() => setTab(s.id)}
            className={`shrink-0 border-b-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors ${
              tab === s.id ? "border-amber-500 text-bone-100" : "border-transparent text-steel-400 hover:text-bone-100"
            }`}
          >
            {s.label}
            {s.id === "cases" && <span className="ml-2 text-amber-300">{cases.length}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-16">
        {tab === "cases" ? (
          <div className="grid gap-x-10 gap-y-24 sm:grid-cols-2 xl:grid-cols-3">
            {cases.map((c, i) => (
              <CaseFolder key={c.id} c={c} index={i} progress={progress[c.id]} teaser={teasers[c.id]} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center border border-dashed border-ink-600 px-6 text-center">
            <p className="font-display text-3xl italic text-bone-100/80">
              {"empty" in current ? current.empty : ""}
            </p>
            <p className="label mt-4">Archive · {current.label}</p>
          </div>
        )}
      </div>
    </>
  );
}
