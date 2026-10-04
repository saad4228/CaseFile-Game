"use client";

import { useState } from "react";
import type { CaseMeta } from "@/lib/game-engine/types";
import { CaseFolder } from "./CaseFolder";

const sections = [
  { id: "cases", label: "Cases" },
  { id: "people", label: "People", empty: "No identities established." },
  { id: "locations", label: "Locations", empty: "No places on file. Close a case to map it." },
  { id: "evidence", label: "Evidence", empty: "Nothing catalogued yet. The archive grows as you investigate." },
  { id: "organizations", label: "Organizations", empty: "No organizations identified." },
  { id: "unsolved", label: "Unsolved", empty: "Every open question will be filed here." },
  { id: "classified", label: "Classified", empty: "Access denied." },
] as const;

export function ArchiveView({ cases }: { cases: CaseMeta[] }) {
  const [tab, setTab] = useState<(typeof sections)[number]["id"]>("cases");
  const current = sections.find((s) => s.id === tab)!;

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
              <CaseFolder key={c.id} c={c} index={i} />
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
