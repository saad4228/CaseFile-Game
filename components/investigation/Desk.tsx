"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { evidenceCode } from "@/components/evidence/format";
import { useGame } from "@/components/game/GameContext";
import { OraclePanel } from "@/components/oracle/OraclePanel";
import { play } from "@/lib/client/sound";
import type { ConflictMark } from "@/lib/game-engine/types";

const marks: { id: ConflictMark; label: string }[] = [
  { id: "contradiction", label: "Mark contradiction" },
  { id: "explained", label: "Explained" },
  { id: "ignored", label: "Ignore" },
];

export type DeskTab = "leads" | "conflicts" | "oracle";

export function Desk({
  open,
  tab,
  setTab,
  onClose,
  onOpen,
  onCompare,
  onFound,
}: {
  open: boolean;
  tab: DeskTab;
  setTab: (t: DeskTab) => void;
  onClose: () => void;
  onOpen: (id: string) => void;
  onCompare: (a: string, b: string) => void;
  onFound: (ids: string[], message: string) => void;
}) {
  const { leads, followed, conflicts, evidence, shared, dispatch, followLead, phase, mode } = useGame();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const openConflicts = conflicts.filter((c) => !shared.conflictMarks[c.id]).length;
  const readOnly = phase === "RESOLVED";

  const follow = async (id: string) => {
    setPending(id);
    setError(null);
    const r = await followLead(id);
    setPending(null);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    play(r.found.length ? "paper" : "tick");
    onFound(
      r.found.map((f) => f.id),
      r.found.length
        ? `New record${r.found.length > 1 ? "s" : ""}${mode === "TEAM" ? " (private to you)" : ""} · ${r.found.map((f) => f.title).join(" · ")}`
        : "Nothing new turned up.",
    );
  };

  const tabs: { id: DeskTab; label: string }[] = [
    { id: "leads", label: `Leads · ${leads.length}` },
    { id: "conflicts", label: `Conflicts · ${openConflicts}` },
    { id: "oracle", label: "Oracle" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[440px] flex-col border-l border-ink-700 bg-ink-900/[0.97] shadow-[-20px_0_60px_rgba(0,0,0,.5)]"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          aria-label="Case desk"
        >
          <div className="flex items-center border-b border-ink-700">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={`flex-1 border-b-2 px-3 py-4 font-mono text-[11px] uppercase tracking-[0.2em] ${
                  tab === t.id ? "border-amber-500 text-bone-100" : "border-transparent text-steel-400 hover:text-bone-100"
                }`}
              >
                {t.label}
              </button>
            ))}
            <button type="button" onClick={onClose} className="px-4 py-4 text-steel-400 hover:text-bone-100" aria-label="Close desk">
              ✕
            </button>
          </div>

          <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-5">
            {tab === "oracle" && <OraclePanel onOpen={onOpen} />}

            {tab === "leads" && (
              <>
                {error && (
                  <p role="alert" className="mb-3 border-l-4 border-crimson-600 bg-crimson-600/10 px-3 py-2 text-sm">
                    {error}
                  </p>
                )}
                {leads.length ? (
                  <ul className="space-y-3">
                    {leads.map((l) => (
                      <li key={l.id} className="border border-ink-700 bg-ink-950/60 p-4">
                        <p className="font-display text-xl leading-snug">{l.label}</p>
                        <p className="mt-1 text-sm text-bone-100/65">{l.detail}</p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm mt-4 w-full"
                          disabled={pending !== null || readOnly}
                          onClick={() => follow(l.id)}
                        >
                          {pending === l.id ? <span className="animate-pulse">Recovering record…</span> : "Investigate"}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-display mt-6 text-center text-2xl italic text-bone-100/60">
                    No open leads. Look again at what you have{mode === "TEAM" ? " — or ask your team what they're holding" : ""}.
                  </p>
                )}
                {followed.length > 0 && (
                  <div className="mt-8">
                    <p className="label">Already followed · {followed.length}</p>
                    <ul className="mt-2 space-y-1.5">
                      {followed.map((f) => (
                        <li key={f.id} className="flex justify-between gap-3 text-sm text-bone-100/55">
                          <span className="line-through decoration-ink-600">{f.label}</span>
                          {f.by && <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-steel-400">{f.by}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {tab === "conflicts" &&
              (conflicts.length ? (
                <ul className="space-y-4">
                  {conflicts.map((c) => {
                    const a = byId.get(c.a);
                    const b = byId.get(c.b);
                    const mark = shared.conflictMarks[c.id];
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
                                <button key={e.id} type="button" onClick={() => onOpen(e.id)} className="paper px-2.5 py-2 text-left">
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
                          {!readOnly &&
                            marks.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                aria-pressed={mark === m.id}
                                onClick={() => dispatch({ t: "conflict.mark", id: c.id, mark: mark === m.id ? null : m.id })}
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
                <p className="font-display mt-10 text-center text-2xl italic text-bone-100/60">No records disagree. Yet.</p>
              ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
