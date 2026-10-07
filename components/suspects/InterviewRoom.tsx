"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { categoryLabel, evidenceCode } from "@/components/evidence/format";
import { useGame } from "@/components/game/GameContext";
import { Detective } from "@/components/illustrations/Detective";
import { SuspectPhoto } from "@/components/illustrations/SuspectPhoto";
import { InterrogationRoom } from "./InterrogationRoom";
import type { Suspect } from "@/lib/game-engine/types";
import { play } from "@/lib/client/sound";

export function InterviewRoom({ suspect, onOpen }: { suspect: Suspect; onOpen: (id: string) => void }) {
  const { interviews, evidence, interview, phase } = useGame();
  const view = interviews[suspect.id];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [flare, setFlare] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const readOnly = phase === "RESOLVED";
  const byId = useMemo(() => new Map(evidence.map((e) => [e.id, e])), [evidence]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [view?.transcript.length]);

  if (!view) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-3xl italic text-bone-100/70">No statement. No identity established.</p>
        <p className="label mt-3">There is no one to interview — yet.</p>
      </div>
    );
  }

  const act = async (kind: "ASK" | "PRESENT", ref: string) => {
    setBusy(true);
    setError(null);
    setPicker(false);
    const r = await interview(suspect.id, kind, ref);
    setBusy(false);
    if (!r.ok) setError(r.error);
    else if (r.unlocks.length) {
      setUnlocked(r.unlocks);
      setFlare((f) => f + 1);
      play("reveal");
    }
  };

  const filtered = evidence.filter((e) => {
    const q = query.trim().toLowerCase();
    return !q || e.title.toLowerCase().includes(q) || evidenceCode(e.number).includes(q) || categoryLabel[e.category].toLowerCase().includes(q);
  });

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#07090c]">
      <InterrogationRoom key={flare} recording={busy} flare={flare > 0} />
      {/* grid-rows-[minmax(0,1fr)]: without it the implicit auto row sizes to the transcript and
          overflows, sliding the newest answer underneath the question tray. */}
      <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[180px_1fr_220px]">
        <div className="relative hidden items-end justify-center lg:flex" aria-hidden="true">
          <Detective className="h-[340px] -scale-x-100 opacity-90" fill="#040506" rim="#f0ae55" />
        </div>

        <div className="scrollbar-thin relative min-h-0 overflow-y-auto bg-gradient-to-r from-transparent via-[#05080a]/55 to-transparent px-5 py-6 md:px-8" aria-live="polite">
          <p className="label">Interview — {suspect.name}</p>
          <div className="mt-4 space-y-6">
            {view.transcript.map((entry) => (
              <motion.div key={entry.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                {entry.kind === "OPEN" ? (
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-steel-400">{entry.prompt}</p>
                ) : (
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-amber-300/90">
                    {entry.by ? `${entry.by} — ` : "You — "}
                    <span className={entry.kind === "PRESENT" ? "text-crimson-400" : ""}>{entry.prompt}</span>
                  </p>
                )}
                <div className="mt-2 space-y-2">
                  {entry.lines.map((l, i) =>
                    l.who === "note" ? (
                      <p key={i} className="text-sm italic text-steel-300">
                        {l.text}
                      </p>
                    ) : (
                      <p key={i} className="font-display text-xl leading-snug text-bone-100 md:text-2xl">
                        “{l.text}”
                      </p>
                    ),
                  )}
                </div>
                {entry.unlocked && entry.unlocked.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.unlocked.map((id) => {
                      const e = byId.get(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onOpen(id)}
                          className="paper-aged px-3 py-1.5 font-mono text-[11px] text-[#1d1a14]"
                        >
                          On file: {e ? `${evidenceCode(e.number)} ${e.title}` : id}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))}
            {busy && <p className="animate-pulse font-mono text-xs uppercase tracking-[0.3em] text-steel-400">…</p>}
            <div ref={endRef} />
          </div>
        </div>

        <div className="relative hidden items-end justify-center lg:flex">
          <SuspectPhoto suspect={suspect} className="block w-[85%] opacity-90 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]" />
        </div>
      </div>

      {/* question tray — never more than a third of the room, so the answers keep the space */}
      {!readOnly && (
        <div className="relative flex max-h-[min(38%,15rem)] flex-col border-t border-ink-700 bg-ink-900 px-4 py-3 md:px-6">
          <AnimatePresence>
            {unlocked.length > 0 && (
              <motion.div
                className="mb-3 flex items-center justify-between gap-3 border border-amber-500/60 bg-amber-500/10 px-4 py-2 text-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span>
                  {suspect.name.split(" ")[0]} gave a revised statement. It&apos;s on file for the whole team.
                </span>
                <button
                  type="button"
                  aria-label="Dismiss"
                  className="label shrink-0 hover:text-bone-100"
                  onClick={() => setUnlocked([])}
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <p role="alert" className="mb-2 text-sm text-crimson-400">
              {error}
            </p>
          )}
          <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:items-stretch">
            <ul className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto" aria-label="Questions">
              {view.questions.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act("ASK", q.id)}
                    className="w-full border-l-2 border-ink-600 px-3 py-1.5 text-left text-sm text-bone-100/80 hover:border-amber-500 hover:bg-amber-500/5 hover:text-bone-100 disabled:opacity-50"
                  >
                    {q.text}
                  </button>
                </li>
              ))}
              {view.questions.length === 0 && (
                <li className="px-3 py-1.5 text-sm italic text-bone-100/50">
                  You&apos;ve asked everything you can for now. Show them something.
                </li>
              )}
            </ul>
            <button
              type="button"
              className="btn btn-sm shrink-0 border-crimson-600/70 text-[#e0a59e] hover:bg-crimson-600/15 md:self-start"
              onClick={() => setPicker((p) => !p)}
              aria-expanded={picker}
              disabled={busy}
            >
              Present evidence <span aria-hidden="true">▾</span>
            </button>
          </div>
          <AnimatePresence>
            {picker && (
              <motion.div
                className="panel fixed inset-x-0 bottom-0 z-50 !bg-ink-900 max-h-[78svh] overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,.7)] md:absolute md:inset-x-auto md:bottom-full md:right-6 md:mb-2 md:max-h-[55vh] md:w-[420px] md:shadow-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="flex items-center gap-2 border-b border-ink-700 p-3">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Find a record — title, number, type"
                    aria-label="Find a record to present"
                    className="w-full border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  />
                  <button type="button" className="shrink-0 px-3 py-2 text-steel-300 hover:text-bone-100 md:hidden" onClick={() => setPicker(false)} aria-label="Close">
                    ✕
                  </button>
                </div>
                <ul className="scrollbar-thin max-h-[62svh] overflow-y-auto py-1 md:max-h-[42vh]">
                  {filtered.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => act("PRESENT", e.id)}
                        className="flex w-full items-baseline gap-3 px-4 py-3 text-left text-sm hover:bg-ink-800 md:py-2"
                      >
                        <span className="font-mono text-[11px] text-steel-400">{evidenceCode(e.number)}</span>
                        <span className="flex-1">{e.title}</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-steel-400">{categoryLabel[e.category]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
