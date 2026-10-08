"use client";

import { useState } from "react";
import { useGame } from "@/components/game/GameContext";
import type { ClaimKind } from "@/lib/game-engine/state";
import { CLAIMS } from "@/lib/game-engine/theory-templates";

// Starting a theory: what you are claiming, and about whom.

export function NewTheory({
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
