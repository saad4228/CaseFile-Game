"use client";

import { useState } from "react";
import { evidenceCode } from "@/components/evidence/format";
import { useGame } from "@/components/game/GameContext";
import { keyBy } from "@/lib/collections";
import type { Theory } from "@/lib/game-engine/state";
import { ASSUMPTION_LIBRARY } from "@/lib/game-engine/theory-templates";
import { nextStatus, statusInfo } from "./status";

// One open theory: the claim, everything that would have to be true for it, and the records
// you have put behind each of those.

export function TheoryCard({
  theory,
  onOpen,
  onToVerdict,
  readOnly,
  onDelete,
}: {
  theory: Theory;
  onOpen: (id: string) => void;
  onToVerdict: () => void;
  readOnly: boolean;
  onDelete: () => void;
}) {
  const { evidence, holders, dispatch, newId, shared } = useGame();
  const [attachFor, setAttachFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addText, setAddText] = useState("");
  const byId = keyBy(evidence);
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
              {confirmDelete ? (
                <span className="flex items-center gap-2">
                  <span className="text-[12px] text-[#1d1a14]/70">Delete this theory?</span>
                  <button type="button" className="btn btn-sm border-crimson-600 text-crimson-600 hover:bg-crimson-600/10" onClick={onDelete}>
                    Delete
                  </button>
                  <button type="button" className="btn btn-sm border-[#1d1a14]/30 text-[#1d1a14]/70" onClick={() => setConfirmDelete(false)}>
                    Keep it
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm border-[#1d1a14]/30 text-[#1d1a14]/70"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </button>
              )}
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
