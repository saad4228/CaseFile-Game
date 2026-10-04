"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { evidenceCode } from "@/components/evidence/format";
import { useGame } from "@/components/game/GameContext";
import { PROOF_SLOTS, VERDICT_FIELDS, type ProofSlot, type VerdictField } from "@/lib/game-engine/types";

const QUESTION: Record<VerdictField, string> = { who: "Who?", how: "How?", when: "When?", where: "Where?", why: "Why?" };
const SLOT: Record<ProofSlot, { label: string; hint: string }> = {
  motive: { label: "Motive", hint: "Why they needed Daniel gone" },
  opportunity: { label: "Opportunity", hint: "How they reached him" },
  means: { label: "Means", hint: "What killed him, and where it came from" },
  timeline: { label: "Timeline", hint: "When it happened, minute by minute" },
  identity: { label: "Identity", hint: "Why this person and no one else" },
};

export function VerdictView({ onOpen }: { onOpen: (id: string) => void }) {
  const { shared, verdictOptions, evidence, holders, dispatch, submitVerdict, mode, meta, phase } = useGame();
  const v = shared.verdict;
  const [picker, setPicker] = useState<ProofSlot | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [filing, setFiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readOnly = phase === "RESOLVED";
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const sharedEvidence = evidence.filter((e) => holders[e.id] !== "me");
  const answered = VERDICT_FIELDS.filter((f) => v[f]).length;
  const proven = PROOF_SLOTS.filter((s) => v.proof[s].length >= 2).length;
  const ready = Boolean(v.who && v.how);

  const file = async () => {
    setFiling(true);
    setError(null);
    const r = await submitVerdict();
    setFiling(false);
    if (!r.ok) setError(r.error);
    else setConfirm(false);
  };

  return (
    <div className="scrollbar-thin h-full overflow-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-10 md:py-12">
        <p className="label">Case {meta.number} — Verdict</p>
        <h2 className="font-display mt-3 text-5xl leading-[0.95] md:text-7xl">
          State your case.
          <br />
          <em className="text-crimson-400">Then prove it.</em>
        </h2>
        {mode === "TEAM" && (
          <p className="mt-5 max-w-2xl text-sm text-bone-100/65">
            This sheet is shared — everyone on the team sees every change. Anyone can file it, and filing closes the case for
            everyone.
          </p>
        )}

        <div className="panel mt-10 p-5 md:p-8">
          <div className="space-y-7">
            {VERDICT_FIELDS.map((f) => (
              <fieldset key={f} className="grid gap-3 border-b border-ink-700 pb-6 md:grid-cols-[150px_1fr]">
                <legend className="sr-only">{QUESTION[f]}</legend>
                <p className="font-display text-3xl uppercase tracking-wide" aria-hidden="true">
                  {QUESTION[f]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {verdictOptions[f].map((o) => {
                    const on = v[f] === o.id;
                    return (
                      <label
                        key={o.id}
                        className={`cursor-pointer border px-3 py-2 text-sm transition-colors ${
                          on ? "border-amber-500 bg-amber-500/15 text-bone-100" : "border-ink-600 text-bone-100/70 hover:border-bone-100/40"
                        } ${readOnly ? "pointer-events-none" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`verdict-${f}`}
                          className="sr-only"
                          checked={on}
                          disabled={readOnly}
                          onChange={() => dispatch({ t: "verdict.set", field: f, value: o.id })}
                        />
                        {o.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <p className="mt-10 font-mono text-[11px] tracking-[0.3em] text-amber-300">PROVE IT</p>
          <p className="mt-1 text-sm text-bone-100/60">
            Attach the records that prove each part. A conclusion needs at least two independent traces. Only records shared
            with the team can be used.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {PROOF_SLOTS.map((slot) => (
              <div key={slot} className={`relative border border-dashed p-3 ${v.proof[slot].length >= 2 ? "border-amber-500/60" : "border-steel-400/40"}`}>
                <p className="label !text-bone-100">{SLOT[slot].label}</p>
                <p className="mt-1 text-[12px] leading-snug text-bone-100/50">{SLOT[slot].hint}</p>
                <ul className="mt-3 space-y-1.5">
                  {v.proof[slot].map((id) => {
                    const e = byId.get(id);
                    return (
                      <li key={id} className="paper flex items-start justify-between gap-1 px-2 py-1.5">
                        <button type="button" className="text-left text-[11.5px] leading-snug text-[#1d1a14]" onClick={() => onOpen(id)}>
                          <span className="font-mono text-[10px] text-[#1d1a14]/60">{e ? evidenceCode(e.number) : id}</span> {e?.title}
                        </button>
                        {!readOnly && (
                          <button
                            type="button"
                            aria-label="Remove"
                            className="px-1 text-[#1d1a14]/40 hover:text-crimson-600"
                            onClick={() => dispatch({ t: "verdict.detach", slot, evidence: id })}
                          >
                            ×
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {!readOnly && (
                  <button
                    type="button"
                    className="mt-2 w-full border border-ink-600 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-bone-100/60 hover:border-amber-500 hover:text-bone-100"
                    onClick={() => setPicker(picker === slot ? null : slot)}
                    aria-expanded={picker === slot}
                  >
                    + Evidence
                  </button>
                )}
                {picker === slot && (
                  <div className="panel absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto shadow-2xl md:w-80">
                    {sharedEvidence
                      .filter((e) => !v.proof[slot].includes(e.id))
                      .map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-ink-800"
                          onClick={() => {
                            dispatch({ t: "verdict.attach", slot, evidence: e.id });
                            setPicker(null);
                          }}
                        >
                          <span className="font-mono text-[11px] text-steel-400">{evidenceCode(e.number)}</span> {e.title}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <label className="mt-8 block">
            <span className="label">In your own words (optional)</span>
            <textarea
              value={v.statement}
              disabled={readOnly}
              maxLength={1200}
              onChange={(e) => dispatch({ t: "verdict.statement", text: e.target.value })}
              className="font-hand mt-2 h-28 w-full border border-ink-600 bg-paper-100 px-4 py-3 text-2xl leading-7 text-[#1f2c55] placeholder:text-[#1f2c55]/40"
              placeholder="What happened in Room 314…"
            />
          </label>

          {!readOnly && (
            <div className="mt-8 flex flex-col items-start gap-4 border-t border-ink-700 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-steel-300">
                {answered}/5 answered · {proven}/5 slots with two or more records
              </p>
              <button type="button" className="btn btn-primary" disabled={!ready} onClick={() => setConfirm(true)}>
                File the verdict
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {confirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/85 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="paper torn w-full max-w-lg px-8 py-10">
              <p className="label-ink">Final</p>
              <p id="confirm-title" className="font-display mt-2 text-3xl text-[#1d1a14]">
                File the verdict?
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[#1d1a14]/80">
                The case closes {mode === "TEAM" ? "for the whole team " : ""}and the truth is revealed. You can&apos;t change your
                answers afterwards.
                {proven < 3 && " You have fewer than three proof slots with two records — the case may not count as solved."}
              </p>
              {error && (
                <p role="alert" className="mt-4 text-sm text-crimson-600">
                  {error}
                </p>
              )}
              <div className="mt-8 flex gap-3">
                <button type="button" className="btn btn-primary" onClick={file} disabled={filing} autoFocus>
                  {filing ? "Filing…" : "File it"}
                </button>
                <button type="button" className="btn border-[#1d1a14]/40 text-[#1d1a14]" onClick={() => setConfirm(false)}>
                  Not yet
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
