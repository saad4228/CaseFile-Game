"use client";

import { useState } from "react";
import { evidenceCode } from "@/components/evidence/format";
import { SuspectPortrait } from "@/components/illustrations/SuspectPortrait";
import { boardSlot, useInvestigation } from "@/components/investigation/store";
import type { Evidence, Suspect } from "@/lib/game-engine/types";

export function PeopleView({
  suspects,
  evidence,
  onOpen,
}: {
  suspects: Suspect[];
  evidence: Evidence[];
  onOpen: (id: string) => void;
}) {
  const { state, dispatch, newId } = useInvestigation();
  const [selected, setSelected] = useState(suspects[0].id);
  const s = suspects.find((x) => x.id === selected)!;
  const linked = evidence.filter((e) => e.suspects.includes(s.id));
  const onBoard = state.board.nodes.some((n) => n.kind === "suspect" && n.ref === s.id);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* roster: swipeable on mobile */}
      <ul className="scrollbar-thin flex shrink-0 snap-x gap-3 overflow-x-auto border-b border-ink-700 p-4 lg:w-[260px] lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r" aria-label="Persons of interest">
        {suspects.map((p) => (
          <li key={p.id} className="snap-start">
            <button
              type="button"
              aria-pressed={p.id === selected}
              onClick={() => setSelected(p.id)}
              className={`flex w-48 items-center gap-3 border p-2 text-left transition-colors lg:w-full ${
                p.id === selected ? "border-amber-500 bg-amber-500/5" : "border-ink-700 hover:border-ink-600"
              }`}
            >
              <SuspectPortrait spec={p.portrait} label={p.name} className="h-14 w-11 shrink-0" />
              <span>
                <span className="block font-display text-lg leading-tight">{p.name}</span>
                <span className="label !text-[9px]">{p.code}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-6 md:p-10">
        <div className="grid gap-10 xl:grid-cols-[260px_1fr]">
          <div>
            <div className="photo-print w-56 -rotate-2">
              <SuspectPortrait spec={s.portrait} label={s.name} className="block w-full" />
              <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#1d1a14]">
                {s.code} · {s.name}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-8"
              disabled={onBoard}
              onClick={() => dispatch({ type: "boardAdd", node: { id: `n-${newId()}`, kind: "suspect", ref: s.id, ...boardSlot(state.board.nodes.length) } })}
            >
              {onBoard ? "On board ✓" : "Pin to board"}
            </button>
          </div>

          <div>
            <p className="label">{s.role}</p>
            <h2 className="font-display mt-1 text-5xl">{s.name}</h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-steel-300">
              {s.age ? `${s.age} · ` : ""}
              {s.relation}
            </p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-bone-100/85">{s.summary}</p>

            <div className="mt-10">
              <p className="label">On record</p>
              {s.statements.length ? (
                <ul className="mt-4 space-y-4">
                  {s.statements.map((st) => (
                    <li key={st.topic} className="paper max-w-2xl px-5 py-4">
                      <p className="label-ink">{st.topic}</p>
                      <p className="mt-1 font-mono text-[13px] leading-relaxed text-[#1d1a14]">“{st.quote}”</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-display mt-3 text-2xl italic text-bone-100/60">No statement. No identity established.</p>
              )}
            </div>

            <div className="mt-10">
              <p className="label">Records naming {s.name.split(" ")[0]} · {linked.length}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {linked.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(e.id)}
                      className="border border-ink-600 px-3 py-1.5 text-left font-mono text-[11px] text-bone-100/80 hover:border-amber-500 hover:text-bone-100"
                    >
                      {evidenceCode(e.number)} {e.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 border border-dashed border-ink-600 px-5 py-4">
              <p className="label">Interview room</p>
              <p className="mt-1 text-sm text-bone-100/60">
                Questioning — with the option to present evidence — opens in the next update.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
