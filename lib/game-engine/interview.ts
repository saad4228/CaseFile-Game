import type {
  Evidence,
  InterviewAction,
  InterviewScript,
  InterviewView,
  TranscriptEntry,
} from "./types";

// Pure interview engine. Given a script and the ordered actions taken, it renders the
// transcript, works out which questions are on offer, and resolves new actions.

export interface InterviewRun {
  view: InterviewView;
  asked: Set<string>;
  triggered: Set<string>;
  presented: Set<string>;
  unlocked: Set<string>;
  deflections: number;
}

const code = (n: number) => `#${String(n).padStart(3, "0")}`;

/** Decide how a suspect reacts to a presented record (doesn't mutate the run). */
export function resolvePresent(
  script: InterviewScript,
  evidenceId: string,
  have: Set<string>,
  run: Pick<InterviewRun, "triggered" | "presented" | "deflections">,
): string {
  const reaction = script.reactions.find(
    (r) => r.evidence.includes(evidenceId) && (r.requiresAlso ?? []).every((x) => have.has(x)),
  );
  if (reaction) return run.triggered.has(reaction.id) ? "repeat" : reaction.id;
  if (run.presented.has(evidenceId)) return "repeat";
  return `deflect:${run.deflections % Math.max(1, script.deflections.length)}`;
}

/**
 * Replay actions into a transcript. Outcomes recorded at the time are honoured when they
 * are still consistent with the script; otherwise they're recomputed.
 */
export function runInterview(
  script: InterviewScript,
  actions: InterviewAction[],
  have: Set<string>,
  evidenceById: Map<string, Evidence>,
): InterviewRun {
  const run: InterviewRun = {
    view: { transcript: [], questions: [] },
    asked: new Set(),
    triggered: new Set(),
    presented: new Set(),
    unlocked: new Set(),
    deflections: 0,
  };
  const transcript: TranscriptEntry[] = [{ key: "open", kind: "OPEN", prompt: script.setting, lines: script.opening }];

  actions.forEach((a, i) => {
    if (a.kind === "ASK") {
      const q = script.questions.find((x) => x.id === a.ref);
      if (!q || run.asked.has(q.id)) return;
      if (!(q.requires ?? []).every((r) => have.has(r))) return;
      if (!(q.after ?? []).every((x) => run.asked.has(x) || run.triggered.has(x))) return;
      run.asked.add(q.id);
      q.unlocks?.forEach((u) => run.unlocked.add(u));
      transcript.push({ key: `a${i}`, kind: "ASK", prompt: q.text, lines: q.answer, by: a.by, unlocked: q.unlocks });
      return;
    }
    const e = evidenceById.get(a.ref);
    if (!e || !have.has(e.id)) return;
    let outcome = a.outcome;
    if (!outcome || !validRecorded(script, outcome, e.id, have, run)) outcome = resolvePresent(script, e.id, have, run);

    let lines = script.repeat;
    let unlocked: string[] | undefined;
    if (outcome.startsWith("deflect:")) {
      lines = script.deflections[Number(outcome.slice(8)) % script.deflections.length] ?? script.repeat;
      run.deflections++;
    } else if (outcome !== "repeat") {
      const r = script.reactions.find((x) => x.id === outcome)!;
      run.triggered.add(r.id);
      lines = r.answer;
      unlocked = r.unlocks;
      r.unlocks?.forEach((u) => run.unlocked.add(u));
    }
    run.presented.add(e.id);
    transcript.push({
      key: `p${i}`,
      kind: "PRESENT",
      prompt: `Presented ${code(e.number)} — ${e.title}`,
      lines,
      by: a.by,
      unlocked,
    });
  });

  run.view = { transcript, questions: availableQuestions(script, have, run) };
  return run;
}

/**
 * A recorded outcome is honoured if it is still structurally valid. Reactions are only
 * honoured when their prerequisites are met, so a forged outcome can't unlock anything.
 */
function validRecorded(script: InterviewScript, outcome: string, evidenceId: string, have: Set<string>, run: InterviewRun) {
  if (outcome === "repeat") return true;
  if (outcome.startsWith("deflect:")) return Number.isInteger(Number(outcome.slice(8)));
  const r = script.reactions.find((x) => x.id === outcome);
  return Boolean(
    r && r.evidence.includes(evidenceId) && !run.triggered.has(r.id) && (r.requiresAlso ?? []).every((x) => have.has(x)),
  );
}

export function availableQuestions(
  script: InterviewScript,
  have: Set<string>,
  run: Pick<InterviewRun, "asked" | "triggered">,
) {
  return script.questions
    .filter(
      (q) =>
        !run.asked.has(q.id) &&
        (q.requires ?? []).every((r) => have.has(r)) &&
        (q.after ?? []).every((x) => run.asked.has(x) || run.triggered.has(x)),
    )
    .map((q) => ({ id: q.id, text: q.text }));
}
