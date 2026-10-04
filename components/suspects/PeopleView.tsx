"use client";

import { useState } from "react";
import { evidenceCode } from "@/components/evidence/format";
import { boardSlot } from "@/components/game/boardSlot";
import { useGame } from "@/components/game/GameContext";
import { SuspectPortrait } from "@/components/illustrations/SuspectPortrait";
import { InterviewRoom } from "./InterviewRoom";

export function PeopleView({ onOpen }: { onOpen: (id: string) => void }) {
  const { suspects, evidence, shared, dispatch, newId, interviews, phase } = useGame();
  const [selected, setSelected] = useState(suspects[0].id);
  const [tab, setTab] = useState<"file" | "interview">("file");
  const s = suspects.find((x) => x.id === selected)!;
  const linked = evidence.filter((e) => e.suspects.includes(s.id));
  const onBoard = shared.board.nodes.some((n) => n.kind === "suspect" && n.ref === s.id);
  const canInterview = Boolean(interviews[s.id]);
  const asked = (interviews[s.id]?.transcript.length ?? 1) - 1;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <ul
        className="scrollbar-thin flex shrink-0 snap-x gap-3 overflow-x-auto border-b border-ink-700 p-4 lg:w-[260px] lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r"
        aria-label="Persons of interest"
      >
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

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex border-b border-ink-700 px-4 md:px-8" role="tablist">
          {(["file", "interview"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              type="button"
              disabled={t === "interview" && !canInterview}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] disabled:opacity-40 ${
                tab === t ? "border-amber-500 text-bone-100" : "border-transparent text-steel-400 hover:text-bone-100"
              }`}
            >
              {t === "file" ? "Profile" : `Interview room${asked > 0 ? ` · ${asked}` : ""}`}
            </button>
          ))}
        </div>

        {tab === "interview" && canInterview ? (
          <div className="min-h-0 flex-1">
            <InterviewRoom key={s.id} suspect={s} onOpen={onOpen} />
          </div>
        ) : (
          <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-6 md:p-10">
            <div className="grid gap-10 xl:grid-cols-[260px_1fr]">
              <div>
                <div className="photo-print w-56 -rotate-2">
                  <SuspectPortrait spec={s.portrait} label={s.name} className="block w-full" />
                  <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#1d1a14]">
                    {s.code} · {s.name}
                  </p>
                </div>
                <div className="mt-8 flex flex-col gap-2">
                  {canInterview && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setTab("interview")}>
                      Question {s.name.split(" ")[0]}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={onBoard || phase === "RESOLVED"}
                    onClick={() =>
                      dispatch({ t: "board.add", node: { id: newId(), kind: "suspect", ref: s.id, ...boardSlot(shared.board.nodes.length) } })
                    }
                  >
                    {onBoard ? "On board ✓" : "Pin to board"}
                  </button>
                </div>
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
                  <p className="label">
                    Records naming {s.name.replace(/[“”]/g, "").split(" ")[0]} · {linked.length}
                  </p>
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
