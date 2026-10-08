"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useGame } from "@/components/game/GameContext";
import { ASSUMPTIONS } from "@/lib/game-engine/theory-templates";
import { NewTheory } from "./NewTheory";
import { TheoryCard } from "./TheoryCard";

// The list of open theories down the side, and whichever one you are working on.

export function TheoriesView({ onOpen, onToVerdict }: { onOpen: (id: string) => void; onToVerdict: () => void }) {
  const { shared, suspects, dispatch, newId, me, phase } = useGame();
  const readOnly = phase === "RESOLVED";
  const theories = shared.theories.filter((t) => !t.archived);
  const [selected, setSelected] = useState<string | null>(theories[0]?.id ?? null);
  const [creating, setCreating] = useState(theories.length === 0);
  const current = shared.theories.find((t) => t.id === selected) ?? null;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="scrollbar-thin flex shrink-0 flex-col border-b border-ink-700 lg:w-[300px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="label">Theories · {theories.length}</p>
          {!readOnly && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>
              + New
            </button>
          )}
        </div>
        <ul className="scrollbar-thin flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible">
          {theories.map((t, i) => {
            const supported = t.assumptions.filter((a) => a.status === "supported").length;
            const contradicted = t.assumptions.filter((a) => a.status === "contradicted").length;
            return (
              <li key={t.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(t.id);
                    setCreating(false);
                  }}
                  aria-pressed={t.id === selected && !creating}
                  className={`w-60 border p-3 text-left lg:w-full ${t.id === selected && !creating ? "border-amber-500 bg-amber-500/5" : "border-ink-700 hover:border-ink-600"}`}
                >
                  <p className="label !text-[9px]">Theory #{String(i + 1).padStart(2, "0")}{t.by ? ` · ${t.by}` : ""}</p>
                  <p className="mt-1 font-display text-lg leading-snug">{t.title}</p>
                  <p className="mt-2 font-mono text-[10px] tracking-[0.12em] text-steel-300">
                    ✓ {supported} · ✗ {contradicted} · ○ {t.assumptions.length - supported - contradicted}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
        {theories.length === 0 && !creating && (
          <p className="px-4 pb-4 text-sm italic text-bone-100/50">No theories yet.</p>
        )}
      </aside>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-4 md:p-10">
        <AnimatePresence mode="wait">
          {creating && !readOnly ? (
            <motion.div key="new" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <NewTheory
                onCancel={theories.length ? () => setCreating(false) : undefined}
                onCreate={(claim, suspectId, title) => {
                  const id = newId();
                  const s = suspects.find((x) => x.id === suspectId);
                  const name = s?.name ?? "";
                  const assumptions =
                    claim === "custom"
                      ? []
                      : ASSUMPTIONS[claim].map((a) => ({ id: newId(), key: a.key, text: a.text(name), status: "open" as const, evidence: [] }));
                  dispatch({
                    t: "theory.add",
                    theory: { id, title, suspect: suspectId, claim, assumptions, by: me.codename, createdAt: Date.now() },
                  });
                  setSelected(id);
                  setCreating(false);
                }}
              />
            </motion.div>
          ) : current ? (
            <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <TheoryCard
                theory={current}
                onOpen={onOpen}
                onToVerdict={onToVerdict}
                readOnly={readOnly}
                onDelete={() => {
                  dispatch({ t: "theory.remove", id: current.id });
                  setSelected(theories.find((t) => t.id !== current.id)?.id ?? null);
                }}
              />
            </motion.div>
          ) : (
            <p className="font-display mt-20 text-center text-3xl italic text-bone-100/60">
              No theories yet. Start one as soon as you have a hunch.
            </p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
