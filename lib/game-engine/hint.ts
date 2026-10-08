import type { ConflictMark, Evidence, InterviewView, LeadView, Suspect, VerdictField } from "./types";
import { PROOF_SLOTS, VERDICT_FIELDS } from "./types";
import type { SharedState } from "./state";

// What to do next, worked out from what the player has actually done. It reads only public
// state — never the truth file — so a hint can say "you have not asked Elena anything yet"
// but can never edge anyone toward the answer.

export type HintTarget =
  | { kind: "record"; id: string }
  | { kind: "desk"; tab: "leads" | "conflicts" | "oracle" }
  | { kind: "suspect"; id: string }
  | { kind: "view"; view: "board" | "theories" | "verdict" };

export interface Hint {
  /** The next thing to do, in one line. */
  step: string;
  /** Why it is the next thing. */
  why: string;
  target?: HintTarget;
  cta?: string;
}

export interface HintInput {
  evidence: Evidence[];
  seen: string[];
  leads: LeadView[];
  conflicts: { id: string }[];
  conflictMarks: Record<string, ConflictMark>;
  interviews: Record<string, InterviewView>;
  suspects: Suspect[];
  shared: SharedState;
}

const first = <T,>(xs: T[]) => xs[0];

/**
 * The ladder, in order. Reading comes before asking, asking before pressing, and the case is
 * only ever argued once there is something to argue with.
 */
export function nextStep(input: HintInput): Hint {
  const { evidence, seen, leads, conflicts, conflictMarks, interviews, suspects, shared } = input;

  const unread = evidence.filter((e) => !seen.includes(e.id));
  if (unread.length) {
    const e = first(unread)!;
    return {
      step: `Read ${unread.length === 1 ? "the record" : `the ${unread.length} records`} you haven't opened yet`,
      why: "Everything else starts here. A record you haven't read can't tell you anything.",
      target: { kind: "record", id: e.id },
      cta: `Open ${e.title}`,
    };
  }

  if (leads.length) {
    return {
      step: `Follow one of your ${leads.length} open ${leads.length === 1 ? "lead" : "leads"}`,
      why: "Following a lead is the only way new records arrive. Nothing new turns up on its own.",
      target: { kind: "desk", tab: "leads" },
      cta: "Open the leads",
    };
  }

  const spokenTo = (id: string) => (interviews[id]?.transcript.length ?? 0) > 1;
  const silent = suspects.filter((s) => interviews[s.id] && !spokenTo(s.id));
  if (silent.length) {
    const s = first(silent)!;
    return {
      step: `Question ${s.name}`,
      why: "You haven't put a single question to them yet.",
      target: { kind: "suspect", id: s.id },
      cta: `Interview ${s.name.split(" ")[0]}`,
    };
  }

  const withQuestions = suspects.filter((s) => (interviews[s.id]?.questions.length ?? 0) > 0);
  if (withQuestions.length) {
    const s = first(withQuestions)!;
    const n = interviews[s.id]!.questions.length;
    return {
      step: `Ask ${s.name} the ${n} ${n === 1 ? "question" : "questions"} you haven't`,
      why: "Questions open up more questions, and they set up the records you'll show later.",
      target: { kind: "suspect", id: s.id },
      cta: `Back to ${s.name.split(" ")[0]}`,
    };
  }

  const presented = (id: string) => (interviews[id]?.transcript ?? []).some((t) => t.kind === "PRESENT");
  const unpressed = suspects.filter((s) => interviews[s.id] && !presented(s.id));
  if (unpressed.length) {
    const s = first(unpressed)!;
    return {
      step: `Show ${s.name} a record that contradicts them`,
      why: "Asking gets you their story. Putting a record in front of them is what breaks it.",
      target: { kind: "suspect", id: s.id },
      cta: `Press ${s.name.split(" ")[0]}`,
    };
  }

  const openConflicts = conflicts.filter((c) => !conflictMarks[c.id]);
  if (openConflicts.length) {
    return {
      step: `Settle the ${openConflicts.length} ${openConflicts.length === 1 ? "conflict" : "conflicts"} on your desk`,
      why: "Each one is a pair of records that can't both be true. Saying which is lying counts at the end.",
      target: { kind: "desk", tab: "conflicts" },
      cta: "Open the conflicts",
    };
  }

  if (shared.board.nodes.length === 0) {
    return {
      step: "Pin your records to the board",
      why: "Laying them out side by side is how the shape of the night shows up.",
      target: { kind: "view", view: "board" },
      cta: "Go to the board",
    };
  }

  if (shared.board.edges.length === 0) {
    return {
      step: "Draw a thread between two records on the board",
      why: "Pull from the edge of a pinned record to another. Sound connections count toward your score.",
      target: { kind: "view", view: "board" },
      cta: "Go to the board",
    };
  }

  if (shared.theories.filter((t) => !t.archived).length === 0) {
    return {
      step: "Start a theory",
      why: "Name someone, and the game lists what would have to be true for it. Then go and check each one.",
      target: { kind: "view", view: "theories" },
      cta: "Open theories",
    };
  }

  const answered = VERDICT_FIELDS.filter((f: VerdictField) => shared.verdict[f]).length;
  if (answered < VERDICT_FIELDS.length) {
    return {
      step: `Answer the ${VERDICT_FIELDS.length - answered} verdict ${VERDICT_FIELDS.length - answered === 1 ? "question" : "questions"} you've left blank`,
      why: "Who and how decide whether the case is solved. The rest still earn credit.",
      target: { kind: "view", view: "verdict" },
      cta: "Open the verdict",
    };
  }

  const backed = PROOF_SLOTS.filter((s) => shared.verdict.proof[s].length >= 2).length;
  if (backed < 3) {
    return {
      step: `Back up ${3 - backed} more ${3 - backed === 1 ? "part" : "parts"} of your verdict`,
      why: "A case counts as solved when at least three parts are held up by records that really show them.",
      target: { kind: "view", view: "verdict" },
      cta: "Open the verdict",
    };
  }

  return {
    step: "You're ready to file",
    why: "You've named it and backed it up. If something still nags at you, ask ORACLE before you commit.",
    target: { kind: "view", view: "verdict" },
    cta: "Open the verdict",
  };
}
