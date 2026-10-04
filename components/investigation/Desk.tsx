"use client";

import { AnimatePresence, motion } from "framer-motion";
import { evidenceCode } from "@/components/evidence/format";
import { useInvestigation } from "@/components/investigation/store";
import type { ConflictMark, ConflictView, Evidence, LeadView } from "@/lib/game-engine/types";

const marks: { id: ConflictMark; label: string }[] = [
  { id: "contradiction", label: "Mark contradiction" },
  { id: "explained", label: "Explained" },
  { id: "ignored", label: "Ignore" },
];

export function Desk({
  open,
  tab,
  setTab,
  onClose,
  leads,
  conflicts,
  evidence,
  pending,
  onFollow,
  onOpen,
  onCompare,
}: {
  open: boolean;
  tab: "leads" | "conflicts";
  setTab: (t: "leads" | "conflicts") => void;
  onClose: () => void;
  leads: LeadView[];
  conflicts: ConflictView[];
  evidence: Evidence[];
  pending: string | null;
  onFollow: (leadId: string) => void;
  onOpen: (id: string) => void;
  onCompare: (a: string, b: string) => void;
}) {
  const { state, dispatch } = useInvestigation();
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const openConflicts = conflicts.filter((c) => !state.conflictMarks[c.id]).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[420px] flex-col border-l border-ink-700 bg-ink-900/[0.97] shadow-[-20px_0_60px_rgba(0,0,0,.5)] backdrop-blur"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          aria-label="Case desk"
        >
          <div className="flex items-center border-b border-ink-700">
            {(["leads", "conflicts"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`flex-1 border-b-2 px-4 py-4 font-mono text-[11px] uppercase tracking-[0.22em] ${
                  tab === t ? "border-amber-500 text-bone-100" : "border-transparent text-steel-400 hover:text-bone-100"
                }`}
              >
                {t === "leads" ? `Leads · ${leads.length}` : `Conflicts · ${openConflicts}`}
              </button>
            ))}
            <button type="button" onClick={onClose} className="px-4 py-4 text-steel-400 hover:text-bone-100" aria-label="Close desk">
              ✕
            </button>
          </div>

          <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-5">
            {tab === "leads" ? (
              leads.length ? (
                <ul className="space-y-3">
                  {leads.map((l) => (
                    <li key={l.id} className="border border-ink-700 bg-ink-950/60 p-4">
                      <p className="font-display text-xl leading-snug">{l.label}</p>
                      <p className="mt-1 text-sm text-bone-100/65">{l.detail}</p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm mt-4 w-full"
                        disabled={pending !== null}
                        onClick={() => onFollow(l.id)}
                      >
                        {pending === l.id ? <span className="animate-pulse">Recovering record…</span> : "Investigate"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-display mt-10 text-center text-2xl italic text-bone-100/60">
                  No open leads. Look again at what you have.
                </p>
              )
            ) : conflicts.length ? (
              <ul className="space-y-4">
                {conflicts.map((c) => {
                  const a = byId.get(c.a);
                  const b = byId.get(c.b);
                  const mark = state.conflictMarks[c.id];
                  return (
                    <li key={c.id} className={`border p-4 ${mark === "contradiction" ? "border-crimson-600/70" : "border-ink-700"} bg-ink-950/60`}>
                      <div className="flex items-baseline justify-between">
                        <p className="font-mono text-[11px] font-semibold tracking-[0.25em] text-bone-100">
                          CONFLICT #{String(c.number).padStart(2, "0")}
                        </p>
                        {mark && (
                          <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${mark === "contradiction" ? "text-crimson-400" : "text-steel-300"}`}>
                            {mark === "contradiction" ? "▲ Contradiction" : mark === "explained" ? "Explained" : "Ignored"}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-bone-100/80">{c.prompt}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {[a, b].map(
                          (e) =>
                            e && (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => onOpen(e.id)}
                                className="paper px-2.5 py-2 text-left"
                              >
                                <p className="label-ink !text-[9px]">{evidenceCode(e.number)}</p>
                                <p className="line-clamp-2 text-[12px] leading-snug text-[#1d1a14]">{e.title}</p>
                              </button>
                            ),
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onCompare(c.a, c.b)}>
                          Investigate
                        </button>
                        {marks.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            aria-pressed={mark === m.id}
                            onClick={() => dispatch({ type: "markConflict", id: c.id, mark: mark === m.id ? null : m.id })}
                            className={`btn btn-sm ${
                              mark === m.id
                                ? m.id === "contradiction"
                                  ? "border-crimson-600 bg-crimson-600/20 text-[#f1c3bd]"
                                  : "border-bone-100/70 bg-bone-100/10 text-bone-100"
                                : "border-ink-600 text-bone-100/70 hover:border-bone-100/50"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="font-display mt-10 text-center text-2xl italic text-bone-100/60">
                No records disagree. Yet.
              </p>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
