"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { evidenceCode } from "@/components/evidence/format";
import { useGame } from "@/components/game/GameContext";
import type { AssumptionStatus, ClaimKind, Theory } from "@/lib/game-engine/state";
import { ASSUMPTION_LIBRARY, ASSUMPTIONS, CLAIMS } from "@/lib/game-engine/theory-templates";

const statusInfo: Record<AssumptionStatus, { mark: string; label: string; cls: string }> = {
  open: { mark: "○", label: "Not checked", cls: "text-[#4f4636]" },
  supported: { mark: "✓", label: "Backed up", cls: "text-[#3d5a3a]" },
  contradicted: { mark: "✗", label: "Records disagree", cls: "text-crimson-600" },
};
const nextStatus: Record<AssumptionStatus, AssumptionStatus> = { open: "supported", supported: "contradicted", contradicted: "open" };

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
              <TheoryCard theory={current} onOpen={onOpen} onToVerdict={onToVerdict} readOnly={readOnly} />
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

function NewTheory({
  onCreate,
  onCancel,
}: {
  onCreate: (claim: ClaimKind, suspectId: string | null, title: string) => void;
  onCancel?: () => void;
}) {
  const { suspects } = useGame();
  const [claim, setClaim] = useState<ClaimKind>("culprit");
  const [suspectId, setSuspectId] = useState<string>(suspects[0].id);
  const [custom, setCustom] = useState("");
  const spec = CLAIMS.find((c) => c.id === claim)!;
  const name = suspects.find((s) => s.id === suspectId)?.name ?? "";
  const title = claim === "custom" ? custom.trim() : spec.label(name);

  return (
    <div className="paper torn mx-auto max-w-2xl px-6 py-8 md:px-10">
      <p className="label-ink">New theory</p>
      <p className="font-display mt-2 text-3xl text-[#1d1a14]">What do you think happened?</p>
      <fieldset className="mt-6">
        <legend className="label-ink">What are you saying happened?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CLAIMS.map((c) => (
            <label
              key={c.id}
              className={`cursor-pointer border-2 px-3 py-2 text-sm text-[#1d1a14] ${claim === c.id ? "border-crimson-600 bg-crimson-600/5" : "border-[#1d1a14]/20"}`}
            >
              <input type="radio" name="claim" className="sr-only" checked={claim === c.id} onChange={() => setClaim(c.id)} />
              {c.id === "custom" ? "Something else…" : c.label("Someone")}
            </label>
          ))}
        </div>
      </fieldset>
      {spec.needsSuspect ? (
        <fieldset className="mt-6">
          <legend className="label-ink">Who</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {suspects.map((s) => (
              <label
                key={s.id}
                className={`cursor-pointer border-2 px-3 py-1.5 font-mono text-[12px] text-[#1d1a14] ${suspectId === s.id ? "border-crimson-600 bg-crimson-600/5" : "border-[#1d1a14]/20"}`}
              >
                <input type="radio" name="suspect" className="sr-only" checked={suspectId === s.id} onChange={() => setSuspectId(s.id)} />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <label className="mt-6 block">
          <span className="label-ink">Your claim</span>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={160}
            placeholder="e.g. The whisky never came from the minibar."
            className="mt-1.5 w-full border-b-2 border-[#1d1a14]/40 bg-transparent px-1 py-2 font-mono text-[14px] text-[#1d1a14] outline-none focus:border-crimson-600"
          />
        </label>
      )}
      {title && <p className="font-display mt-8 text-2xl text-[#1d1a14]">“{title}”</p>}
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!title}
          onClick={() => onCreate(claim, spec.needsSuspect ? suspectId : null, title)}
        >
          Open theory
        </button>
        {onCancel && (
          <button type="button" className="btn border-[#1d1a14]/40 text-[#1d1a14]" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function TheoryCard({
  theory,
  onOpen,
  onToVerdict,
  readOnly,
}: {
  theory: Theory;
  onOpen: (id: string) => void;
  onToVerdict: () => void;
  readOnly: boolean;
}) {
  const { evidence, holders, dispatch, newId, shared } = useGame();
  const [attachFor, setAttachFor] = useState<string | null>(null);
  const [addText, setAddText] = useState("");
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const sharedEvidence = evidence.filter((e) => holders[e.id] !== "me");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="paper torn px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="label-ink">Theory{theory.by ? ` — started by ${theory.by}` : ""}</p>
            <h2 className="font-display mt-2 text-3xl leading-tight text-[#1d1a14] md:text-4xl">{theory.title}</h2>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              {theory.claim === "culprit" && theory.suspect && (
                <button
                  type="button"
                  className="btn btn-sm border-crimson-600 text-crimson-600 hover:bg-crimson-600/10"
                  onClick={() => {
                    if (shared.verdict.who !== theory.suspect) dispatch({ t: "verdict.set", field: "who", value: theory.suspect });
                    onToVerdict();
                  }}
                >
                  Use this in the verdict →
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm border-[#1d1a14]/30 text-[#1d1a14]/70"
                onClick={() => dispatch({ t: "theory.update", id: theory.id, patch: { archived: true } })}
              >
                Put it aside
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 font-mono text-[11px] font-semibold tracking-[0.25em] text-crimson-600">
          IF THIS IS TRUE, WHAT ELSE WOULD HAVE TO BE TRUE?
        </p>

        <ul className="mt-5 space-y-4">
          {theory.assumptions.map((a) => {
            const st = statusInfo[a.status];
            return (
              <li key={a.id} className="border-b border-[#1d1a14]/15 pb-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => dispatch({ t: "assumption.update", theoryId: theory.id, id: a.id, patch: { status: nextStatus[a.status] } })}
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border-2 border-current font-mono text-sm ${st.cls}`}
                    aria-label={`${a.text}: ${st.label}. Change status`}
                    title="Click to change: not checked → backed up → records disagree"
                  >
                    {st.mark}
                  </button>
                  <div className="flex-1">
                    <p className="text-[15px] leading-snug text-[#1d1a14]">{a.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${st.cls}`}>{st.label}</span>
                      {a.evidence.map((id) => {
                        const e = byId.get(id);
                        return (
                          <span key={id} className="inline-flex items-center border border-[#1d1a14]/30 font-mono text-[11px] text-[#1d1a14]">
                            <button type="button" className="px-2 py-0.5 hover:bg-[#1d1a14]/5" onClick={() => onOpen(id)}>
                              {e ? `${evidenceCode(e.number)} ${e.title}` : id}
                            </button>
                            {!readOnly && (
                              <button
                                type="button"
                                aria-label="Take this record off"
                                className="border-l border-[#1d1a14]/20 px-1.5 text-[#1d1a14]/50 hover:text-crimson-600"
                                onClick={() => dispatch({ t: "assumption.detach", theoryId: theory.id, id: a.id, evidence: id })}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })}
                      {!readOnly && (
                        <button
                          type="button"
                          className="font-mono text-[11px] text-[#4f4636] underline-offset-2 hover:underline"
                          onClick={() => setAttachFor(attachFor === a.id ? null : a.id)}
                        >
                          + add a record
                        </button>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          className="ml-auto font-mono text-[10px] text-[#1d1a14]/40 hover:text-crimson-600"
                          onClick={() => dispatch({ t: "assumption.remove", theoryId: theory.id, id: a.id })}
                          aria-label={`Remove: ${a.text}`}
                        >
                          remove
                        </button>
                      )}
                    </div>
                    {attachFor === a.id && (
                      <div className="mt-3 max-h-56 overflow-y-auto border border-[#1d1a14]/20 bg-[#1d1a14]/[0.03]">
                        {sharedEvidence
                          .filter((e) => !a.evidence.includes(e.id))
                          .map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              className="block w-full px-3 py-1.5 text-left font-mono text-[12px] text-[#1d1a14] hover:bg-[#1d1a14]/5"
                              onClick={() => {
                                dispatch({ t: "assumption.attach", theoryId: theory.id, id: a.id, evidence: e.id });
                                setAttachFor(null);
                              }}
                            >
                              {evidenceCode(e.number)} {e.title}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {!readOnly && (
          <div className="mt-6">
            <p className="label-ink">Add something else that would have to be true</p>
            <div className="mt-2 flex gap-2">
              <input
                value={addText}
                onChange={(e) => setAddText(e.target.value)}
                maxLength={160}
                list={`assume-${theory.id}`}
                placeholder="Something else that would have to be true…"
                className="flex-1 border-b-2 border-[#1d1a14]/30 bg-transparent px-1 py-2 text-sm text-[#1d1a14] outline-none focus:border-crimson-600"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && addText.trim()) {
                    dispatch({ t: "assumption.add", theoryId: theory.id, assumption: { id: newId(), key: "custom", text: addText.trim(), status: "open", evidence: [] } });
                    setAddText("");
                  }
                }}
              />
              <datalist id={`assume-${theory.id}`}>
                {ASSUMPTION_LIBRARY.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <button
                type="button"
                className="btn btn-sm border-[#1d1a14]/40 text-[#1d1a14]"
                disabled={!addText.trim()}
                onClick={() => {
                  dispatch({ t: "assumption.add", theoryId: theory.id, assumption: { id: newId(), key: "custom", text: addText.trim(), status: "open", evidence: [] } });
                  setAddText("");
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-sm text-bone-100/50">
        Nothing here is marked right or wrong. A theory is somewhere to think — the verdict is where it counts.
      </p>
    </div>
  );
}
