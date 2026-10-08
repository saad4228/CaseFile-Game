import "server-only";
import { initialShared } from "./state";
import type { CaseBundle } from "./cases.server";
import { leadAvailable, resistanceFor } from "./engine.server";
import { availableQuestions, resolvePresent, runInterview } from "./interview";
import { scoreVerdict } from "@/lib/scoring/score.server";
import { PROOF_SLOTS, VERDICT_FIELDS, type InterviewAction } from "./types";

// Case validator: checks references, that every record is reachable by play, and that the
// truth file is consistent. Runs in the unit tests, in CI and on the admin panel.

export interface Check {
  id: string;
  label: string;
  ok: boolean;
  details: string[];
}

export interface ValidationReport {
  caseId: string;
  ok: boolean;
  checks: Check[];
  stats: { evidence: number; reachable: number; leads: number; conflicts: number; interviews: number; perfectScore: number; perfectRank: string };
}

/** Everything a thorough player can reach: follow every lead, ask everything, present everything. */
export function reachableSet(bundle: CaseBundle) {
  const have = new Set<string>(bundle.brief);
  const followed = new Set<string>();
  const actions = new Map<string, InterviewAction[]>(Object.keys(bundle.interviews).map((s) => [s, []]));
  for (let round = 0; round < 50; round++) {
    let changed = false;
    for (const lead of bundle.leads) {
      if (followed.has(lead.id) || !leadAvailable(lead, have)) continue;
      followed.add(lead.id);
      for (const id of lead.unlocks) if (!have.has(id)) have.add(id);
      changed = true;
    }
    for (const [suspectId, script] of Object.entries(bundle.interviews)) {
      const list = actions.get(suspectId)!;
      const resists = resistanceFor(bundle, suspectId);
      let run = runInterview(script, list, have, bundle.evidenceById, resists);
      for (const q of availableQuestions(script, have, run)) {
        list.push({ suspectId, kind: "ASK", ref: q.id });
        changed = true;
      }
      run = runInterview(script, list, have, bundle.evidenceById, resists);
      for (const id of have) {
        const outcome = resolvePresent(script, id, have, run, resists);
        // A record stuck behind a hold is unreachable, which should fail loudly rather than pass.
        if (outcome.startsWith("deflect") || outcome.startsWith("hold:") || outcome === "repeat") continue;
        list.push({ suspectId, kind: "PRESENT", ref: id, outcome });
        run = runInterview(script, list, have, bundle.evidenceById, resists);
        changed = true;
      }
      for (const id of run.unlocked) {
        if (!have.has(id)) {
          have.add(id);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return { have, followed, actions };
}

export function validateCase(bundle: CaseBundle): ValidationReport {
  const checks: Check[] = [];
  const add = (id: string, label: string, details: string[]) => checks.push({ id, label, ok: details.length === 0, details });
  const ids = new Set(bundle.evidence.map((e) => e.id));
  const exists = (ref: string) => ids.has(ref);
  const suspectIds = new Set(bundle.suspects.map((s) => s.id));
  const { truth } = bundle;

  // Records
  {
    const d: string[] = [];
    const seen = new Set<string>();
    const numbers = new Set<number>();
    for (const e of bundle.evidence) {
      if (seen.has(e.id)) d.push(`Duplicate record id ${e.id}`);
      seen.add(e.id);
      if (numbers.has(e.number)) d.push(`Duplicate record number ${e.number}`);
      numbers.add(e.number);
      for (const r of e.related) if (!exists(r)) d.push(`${e.id} relates to missing ${r}`);
      for (const s of e.suspects) if (!suspectIds.has(s)) d.push(`${e.id} names unknown suspect ${s}`);
      if (!e.title.trim() || !e.summary.trim()) d.push(`${e.id} is missing a title or summary`);
    }
    if (bundle.meta.counts.evidence !== bundle.evidence.length)
      d.push(`meta.counts.evidence is ${bundle.meta.counts.evidence}, but there are ${bundle.evidence.length} records`);
    add("records", "Records are unique and cross-references resolve", d);
  }

  // Brief
  {
    const d: string[] = [];
    for (const id of bundle.brief) if (!exists(id)) d.push(`Brief lists missing ${id}`);
    for (const id of bundle.common) if (!bundle.brief.includes(id)) d.push(`Common record ${id} is not in the brief`);
    if (!bundle.brief.length) d.push("The brief is empty");
    add("brief", "Starting brief is valid", d);
  }

  // Leads & conflicts
  {
    const d: string[] = [];
    const leadIds = new Set<string>();
    for (const l of bundle.leads) {
      if (leadIds.has(l.id)) d.push(`Duplicate lead ${l.id}`);
      leadIds.add(l.id);
      for (const r of [...l.requires, ...l.unlocks]) if (!exists(r)) d.push(`${l.id} references missing ${r}`);
      if (!l.unlocks.length) d.push(`${l.id} unlocks nothing`);
    }
    for (const c of bundle.conflicts) {
      if (!exists(c.a) || !exists(c.b)) d.push(`${c.id} references a missing record`);
      if (!truth.conflictTruth[c.id]) d.push(`${c.id} has no explanation in the truth file`);
    }
    for (const id of truth.relevantLeads) if (!leadIds.has(id)) d.push(`relevantLeads lists missing ${id}`);
    add("leads", "Leads and conflicts reference real records", d);
  }

  // Interviews
  {
    const d: string[] = [];
    for (const [suspectId, script] of Object.entries(bundle.interviews)) {
      if (!suspectIds.has(suspectId)) d.push(`Interview for unknown suspect ${suspectId}`);
      const known = new Set([...script.questions.map((q) => q.id), ...script.reactions.map((r) => r.id)]);
      for (const q of script.questions) {
        for (const r of q.requires ?? []) if (!exists(r)) d.push(`${q.id} requires missing ${r}`);
        for (const r of q.unlocks ?? []) if (!exists(r)) d.push(`${q.id} unlocks missing ${r}`);
        for (const a of q.after ?? []) if (!known.has(a)) d.push(`${q.id} follows missing question or reaction ${a}`);
      }
      for (const r of script.reactions) {
        for (const x of [...r.evidence, ...(r.requiresAlso ?? []), ...(r.unlocks ?? [])]) if (!exists(x)) d.push(`${r.id} references missing ${x}`);
      }
      if (!script.deflections.length) d.push(`${suspectId} has no deflections`);
    }
    add("interviews", "Interview scripts reference real records and questions", d);
  }

  // Reachability
  const reach = reachableSet(bundle);
  {
    const d = bundle.evidence.filter((e) => !reach.have.has(e.id)).map((e) => `${e.id} “${e.title}” can never be found`);
    add("reachable", "Every record can be discovered through play", d);
  }

  // Truth
  {
    const d: string[] = [];
    for (const f of VERDICT_FIELDS) {
      if (!bundle.verdictOptions[f].some((o) => o.id === truth.answers[f])) d.push(`The answer to “${f}” is not one of its options`);
      for (const opt of Object.keys(truth.partial[f] ?? {}))
        if (!bundle.verdictOptions[f].some((o) => o.id === opt)) d.push(`Partial credit for “${f}” names unknown option ${opt}`);
    }
    for (const slot of PROOF_SLOTS) {
      const p = truth.proof[slot];
      for (const id of p.accepted) if (!exists(id)) d.push(`Proof “${slot}” accepts missing ${id}`);
      const reachableProof = p.accepted.filter((id) => reach.have.has(id)).length;
      if (reachableProof < p.min) d.push(`Proof “${slot}” needs ${p.min} records but only ${reachableProof} can be found`);
    }
    for (const id of [...truth.keyEvidence, ...truth.misleadingProof, ...Object.keys(truth.evidenceTruth)])
      if (!exists(id)) d.push(`Truth file references missing ${id}`);
    for (const r of truth.relations) {
      for (const end of [r.a, r.b]) {
        if (end.startsWith("suspect:")) {
          if (!suspectIds.has(end.slice(8))) d.push(`Relation names unknown suspect ${end}`);
        } else if (!exists(end)) d.push(`Relation references missing ${end}`);
      }
    }
    if (!exists(truth.metaClue.seenIn)) d.push(`Meta clue appears in missing ${truth.metaClue.seenIn}`);
    if (!truth.sequence.length) d.push("No resolution sequence");
    add("truth", "Solution, proof and relations are consistent", d);
  }

  // Solvable: a perfect investigation must solve the case.
  const shared = initialShared();
  for (const f of VERDICT_FIELDS) shared.verdict[f] = truth.answers[f];
  for (const slot of PROOF_SLOTS) {
    shared.verdict.proof[slot] = truth.proof[slot].accepted.filter((id) => reach.have.has(id)).slice(0, truth.proof[slot].min + 1);
  }
  const interviewUnlocks = new Set<string>();
  for (const [suspectId, script] of Object.entries(bundle.interviews)) {
    const run = runInterview(
      script,
      reach.actions.get(suspectId) ?? [],
      reach.have,
      bundle.evidenceById,
      resistanceFor(bundle, suspectId),
    );
    for (const id of run.unlocked) interviewUnlocks.add(id);
  }
  const perfect = scoreVerdict(bundle, {
    shared,
    discovered: reach.have,
    followedLeads: truth.relevantLeads,
    interviewUnlocks,
    durationSec: 30 * 60,
    budgetMin: 50,
    mode: "SOLO",
  });
  add("solvable", "A complete, correct investigation solves the case", perfect.solved ? [] : ["The ideal verdict does not count as solved"]);

  // A wrong culprit must not count as solved.
  const wrong = { ...shared, verdict: { ...shared.verdict, who: bundle.verdictOptions.who.find((o) => o.id !== truth.answers.who)!.id } };
  const wrongScore = scoreVerdict(bundle, {
    shared: wrong,
    discovered: reach.have,
    followedLeads: truth.relevantLeads,
    interviewUnlocks,
    durationSec: 30 * 60,
    budgetMin: 50,
    mode: "SOLO",
  });
  add("not-trivial", "Naming the wrong culprit does not solve the case", wrongScore.solved ? ["A wrong culprit was accepted"] : []);

  return {
    caseId: bundle.meta.id,
    ok: checks.every((c) => c.ok),
    checks,
    stats: {
      evidence: bundle.evidence.length,
      reachable: bundle.evidence.filter((e) => reach.have.has(e.id)).length,
      leads: bundle.leads.length,
      conflicts: bundle.conflicts.length,
      interviews: Object.keys(bundle.interviews).length,
      perfectScore: perfect.final,
      perfectRank: perfect.rank,
    },
  };
}
