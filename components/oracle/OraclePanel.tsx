"use client";

import { useEffect, useRef, useState } from "react";
import { evidenceCode } from "@/components/evidence/format";
import { useGame } from "@/components/game/GameContext";
import type { Evidence, Suspect } from "@/lib/game-engine/types";

// ORACLE: a records clerk over what the player has legitimately found. It points at
// relationships to check; it never names a culprit or grades a theory.

interface Entry {
  id: number;
  question: string;
  text: string;
  refs: string[];
  suggestions?: string[];
  error?: boolean;
}

/** Opening questions, built only from what's on the desk. */
function starters(evidence: Evidence[], suspects: Suspect[], conflicts: number, objective: string): string[] {
  const out = ["What can you do?"];
  const counts = new Map<string, number>();
  for (const e of evidence) for (const s of e.suspects) counts.set(s, (counts.get(s) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const person = top && suspects.find((s) => s.id === top[0]);
  const latest = [...evidence].filter((e) => e.time).sort((a, b) => b.number - a.number)[0];
  const window = /between (.+?) and (.+?)[.,;]/i.exec(objective);
  if (person) out.push(`Where was ${person.name.replace(/[“”"]/g, "").split(" ")[0]} that night?`);
  if (latest?.time) out.push(`What happened around ${latest.time}?`);
  if (conflicts) out.push("Which records disagree?");
  else if (window) out.push(`What's missing between ${window[1]} and ${window[2]}?`);
  if (person) out.push(`What do we have on ${person.name}?`);
  return out.slice(0, 5);
}

const historyKey = (scope: string) => `casefile:oracle:${scope}`;

function loadHistory(scope: string): Entry[] {
  try {
    const raw = typeof window === "undefined" ? null : sessionStorage.getItem(historyKey(scope));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(-20) : [];
  } catch {
    return [];
  }
}

export function OraclePanel({ onOpen }: { onOpen: (id: string) => void }) {
  const { askOracle, evidence, sessionId, meta, phase, suspects, conflicts } = useGame();
  const scope = sessionId ?? `local-${meta.id}`;
  const [history, setHistory] = useState<Entry[]>(() => loadHistory(scope));
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const byNumber = new Map(evidence.map((e) => [evidenceCode(e.number), e]));

  useEffect(() => {
    try {
      sessionStorage.setItem(historyKey(scope), JSON.stringify(history.slice(-20)));
    } catch {
      /* storage unavailable: history lasts until the desk closes */
    }
  }, [scope, history]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [history.length, pending]);

  const ask = async (q: string) => {
    const text = q.replace(/\s+/g, " ").trim();
    if (!text || pending) return;
    setPending(text);
    setQuestion("");
    const r = await askOracle(text);
    setPending(null);
    setHistory((h) => [
      ...h.slice(-19),
      r.ok
        ? { id: Date.now(), question: text, text: r.text, refs: r.refs, suggestions: r.suggestions }
        : { id: Date.now(), question: text, text: r.error, refs: [], error: true },
    ]);
  };

  /** Render record numbers (#012) as links into the viewer. */
  const linkify = (line: string, key: string) =>
    line.split(/(#\d{3})/g).map((part, i) => {
      const e = byNumber.get(part);
      if (!e) return <span key={`${key}-${i}`}>{part}</span>;
      return (
        <button
          key={`${key}-${i}`}
          type="button"
          onClick={() => onOpen(e.id)}
          className="font-mono text-amber-300 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-500"
          title={e.title}
        >
          {part}
        </button>
      );
    });

  return (
    <div className="flex min-h-full flex-col">
      <div className="border border-ink-700 bg-ink-950/60 p-4">
        <p className="label">ORACLE · Records index</p>
        <p className="mt-2 text-sm leading-relaxed text-bone-100/70">
          ORACLE has read only what you have found. Ask where someone was, whether a journey fits a window, what&rsquo;s missing from the night, or how two records compare. It will not tell you who did it.
        </p>
      </div>

      <div className="mt-4 flex-1 space-y-5" aria-live="polite">
        {history.length === 0 && !pending && (
          <div>
            <p className="label">Try</p>
            <ul className="mt-2 space-y-1.5">
              {starters(evidence, suspects, conflicts.length, meta.objective).map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    onClick={() => ask(ex)}
                    className="w-full border border-dashed border-ink-600 px-3 py-2 text-left text-sm text-bone-100/75 hover:border-amber-500 hover:text-bone-100"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {history.map((h, hi) => (
          <div key={h.id}>
            <p className="font-display text-lg italic leading-snug text-bone-100/90">“{h.question}”</p>
            <div
              className={`mt-2 border-l-2 pl-3 text-sm leading-relaxed ${
                h.error ? "border-crimson-600 text-crimson-400" : "border-amber-500/60 text-bone-100/80"
              }`}
            >
              {h.text.split("\n").map((line, i) => (
                <p key={i} className={line.startsWith("—") ? "mt-1 pl-2" : line.startsWith("   ") ? "pl-6 text-bone-100/55" : i ? "mt-2" : ""}>
                  {linkify(line, `${h.id}-${i}`)}
                </p>
              ))}
            </div>
            {!h.error && h.refs.length > 0 && (
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-steel-400">
                From {h.refs.length} record{h.refs.length > 1 ? "s" : ""} you hold
              </p>
            )}
            {hi === history.length - 1 && !pending && phase !== "RESOLVED" && (h.suggestions?.length ?? 0) > 0 && (
              <div role="group" className="mt-3 flex flex-wrap gap-1.5" aria-label="Ask next">
                {h.suggestions!.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="min-h-9 border border-dashed border-ink-600 px-2.5 py-1.5 text-left text-xs text-bone-100/75 hover:border-amber-500 hover:text-bone-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {pending && (
          <div>
            <p className="font-display text-lg italic leading-snug text-bone-100/90">“{pending}”</p>
            <p className="mt-2 animate-pulse font-mono text-[11px] uppercase tracking-[0.3em] text-steel-300">Consulting the archive…</p>
          </div>
        )}
        <div ref={endRef} className="scroll-mb-24" />
      </div>

      <form
        className="sticky bottom-0 mt-5 flex gap-2 bg-ink-900 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label htmlFor="oracle-q" className="sr-only">
          Ask ORACLE
        </label>
        <input
          id="oracle-q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={400}
          placeholder={phase === "RESOLVED" ? "The file is closed." : "Ask about a name, a time, a record…"}
          disabled={phase === "RESOLVED"}
          className="min-w-0 flex-1 border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-amber-500 disabled:opacity-50"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!question.trim() || pending !== null || phase === "RESOLVED"}>
          Ask
        </button>
      </form>
    </div>
  );
}
