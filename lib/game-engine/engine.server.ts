import "server-only";
import type { Lead } from "@/data/cases/case-047/leads.server";
import type { CaseBundle } from "./cases.server";
import { availableQuestions, resistance, resolvePresent, runInterview } from "./interview";
import type { ConflictView, EvidenceId, InterviewAction, LeadView, PlayView } from "./types";

// Public surface of the truth engine: returns only what a player has legitimately found.

/** Resistance from a suspect's hidden profile. Only the number leaves this module. */
export function resistanceFor(bundle: CaseBundle, suspectId: string) {
  const profile = bundle.truth.suspects[suspectId];
  return profile ? resistance(profile) : 0;
}

export function leadAvailable(lead: Lead, have: Set<string>) {
  return (lead.mode ?? "all") === "any" ? lead.requires.some((r) => have.has(r)) : lead.requires.every((r) => have.has(r));
}

const toStringSet = (ids: unknown) =>
  new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string" && x.length < 32) : []);

export function sanitizeActions(raw: unknown): InterviewAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (a): a is InterviewAction =>
        a &&
        typeof a === "object" &&
        typeof a.suspectId === "string" &&
        (a.kind === "ASK" || a.kind === "PRESENT") &&
        typeof a.ref === "string" &&
        a.ref.length < 40 &&
        (a.outcome === undefined || (typeof a.outcome === "string" && a.outcome.length < 40)),
    )
    .slice(0, 400)
    .map((a) => ({ suspectId: a.suspectId, kind: a.kind, ref: a.ref, outcome: a.outcome }));
}

/**
 * Single-device mode: the browser holds the state, so re-derive what was actually reachable
 * from the brief through leads and interviews. Unreachable claims are dropped.
 */
export function sanitizeLocal(bundle: CaseBundle, claimed: unknown, rawActions: unknown) {
  const claimedSet = toStringSet(claimed);
  const actions = sanitizeActions(rawActions);
  const have = new Set<EvidenceId>(bundle.brief);
  const followed = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const lead of bundle.leads) {
      if (!leadAvailable(lead, have)) continue;
      for (const id of lead.unlocks) {
        if (claimedSet.has(id) && !have.has(id)) {
          have.add(id);
          followed.add(lead.id);
          changed = true;
        }
      }
    }
    for (const [suspectId, script] of Object.entries(bundle.interviews)) {
      const run = runInterview(
        script,
        actions.filter((a) => a.suspectId === suspectId),
        have,
        bundle.evidenceById,
        resistanceFor(bundle, suspectId),
      );
      for (const id of run.unlocked) {
        if (claimedSet.has(id) && !have.has(id)) {
          have.add(id);
          changed = true;
        }
      }
    }
  }
  return { have, actions, followed };
}

export function conflictsFor(bundle: CaseBundle, have: Set<string>): ConflictView[] {
  return bundle.conflicts
    .filter((c) => have.has(c.a) && have.has(c.b))
    .map(({ id, number, a, b, prompt }) => ({ id, number, a, b, prompt }));
}

export function leadsFor(bundle: CaseBundle, have: Set<string>, followed: Set<string>, discoveredAll: Set<string>): LeadView[] {
  return bundle.leads
    .filter((l) => !followed.has(l.id) && leadAvailable(l, have) && l.unlocks.some((u) => !discoveredAll.has(u)))
    .map(({ id, label, detail }) => ({ id, label, detail }));
}

/** Build the gameplay view for one viewer. */
export function buildPlayView(
  bundle: CaseBundle,
  opts: {
    /** Records the viewer can see (shared + their own private). */
    visible: Set<string>;
    /** Everything discovered by anyone in the session (defaults to `visible`). */
    discoveredAll?: Set<string>;
    privateIds?: Set<string>;
    followed: { id: string; by?: string }[];
    actions: InterviewAction[];
  },
): PlayView {
  const discoveredAll = opts.discoveredAll ?? opts.visible;
  const followedSet = new Set(opts.followed.map((f) => f.id));
  const holders: PlayView["holders"] = {};
  const evidence = bundle.evidence.filter((e) => opts.visible.has(e.id));
  for (const e of evidence) holders[e.id] = opts.privateIds?.has(e.id) ? "me" : "team";

  const interviews: PlayView["interviews"] = {};
  for (const [suspectId, script] of Object.entries(bundle.interviews)) {
    const run = runInterview(
      script,
      opts.actions.filter((a) => a.suspectId === suspectId),
      discoveredAll,
      bundle.evidenceById,
      resistanceFor(bundle, suspectId),
    );
    interviews[suspectId] = {
      transcript: run.view.transcript,
      questions: availableQuestions(script, opts.visible, run),
    };
  }

  return {
    evidence,
    holders,
    leads: leadsFor(bundle, opts.visible, followedSet, discoveredAll),
    followed: opts.followed.map((f) => ({
      id: f.id,
      label: bundle.leads.find((l) => l.id === f.id)?.label ?? f.id,
      by: f.by,
    })),
    conflicts: conflictsFor(bundle, opts.visible),
    interviews,
  };
}

export class GameError extends Error {}

/** Follow a lead: returns the record ids it reveals (excluding ones already discovered). */
export function followLead(bundle: CaseBundle, leadId: string, visible: Set<string>, followed: Set<string>, discoveredAll: Set<string>) {
  const lead = bundle.leads.find((l) => l.id === leadId);
  if (!lead) throw new GameError("That lead doesn't exist.");
  if (followed.has(lead.id)) throw new GameError("That lead has already been followed.");
  if (!leadAvailable(lead, visible)) throw new GameError("You don't have what that lead needs yet.");
  return lead.unlocks.filter((u) => !discoveredAll.has(u));
}

/** One interview action. `visible` is the actor's view; `discoveredAll` replays teammates'. */
export function interviewAct(
  bundle: CaseBundle,
  suspectId: string,
  action: { kind: "ASK" | "PRESENT"; ref: string },
  visible: Set<string>,
  history: InterviewAction[],
  discoveredAll: Set<string>,
): { action: InterviewAction; unlocks: string[] } {
  const script = bundle.interviews[suspectId];
  if (!script) throw new GameError("That person isn't available for interview.");
  const prior = history.filter((a) => a.suspectId === suspectId);
  const resists = resistanceFor(bundle, suspectId);
  const run = runInterview(script, prior, discoveredAll, bundle.evidenceById, resists);

  if (action.kind === "ASK") {
    if (!availableQuestions(script, visible, run).some((q) => q.id === action.ref)) {
      throw new GameError("That question isn't on the table.");
    }
    const q = script.questions.find((x) => x.id === action.ref)!;
    return {
      action: { suspectId, kind: "ASK", ref: action.ref },
      unlocks: (q.unlocks ?? []).filter((u) => !discoveredAll.has(u)),
    };
  }

  if (!visible.has(action.ref)) throw new GameError("You can only present records you hold.");
  const outcome = resolvePresent(script, action.ref, visible, run, resists);
  // A "hold:" outcome matches no reaction id, so holding the line reveals nothing.
  const reaction = script.reactions.find((r) => r.id === outcome);
  return {
    action: { suspectId, kind: "PRESENT", ref: action.ref, outcome },
    unlocks: (reaction?.unlocks ?? []).filter((u) => !discoveredAll.has(u)),
  };
}
