import "server-only";
import { BRIEF_EVIDENCE, evidence, evidenceById } from "@/data/cases/case-047/evidence.server";
import { conflicts, leads } from "@/data/cases/case-047/leads.server";
import type {
  ConflictView,
  Evidence,
  EvidenceId,
  LeadView,
} from "./types";

// The truth engine's public surface. Everything returned from here is safe to send to the
// browser: it only ever describes evidence the player has already discovered.

const SUPPORTED_CASES = new Set(["047"]);

export function assertCase(caseId: string) {
  if (!SUPPORTED_CASES.has(caseId)) throw new Error(`Unknown case ${caseId}`);
}

/** Drop ids that don't exist, and anything not reachable from the brief through leads. */
export function sanitizeDiscovered(ids: unknown): Set<EvidenceId> {
  const claimed = new Set(
    Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [],
  );
  const reachable = new Set<EvidenceId>(BRIEF_EVIDENCE);
  // Walk leads until fixed point, only crediting unlocks the player claims to have.
  let changed = true;
  while (changed) {
    changed = false;
    for (const lead of leads) {
      if (!isAvailable(lead.requires, lead.mode, reachable)) continue;
      for (const id of lead.unlocks) {
        if (claimed.has(id) && !reachable.has(id)) {
          reachable.add(id);
          changed = true;
        }
      }
    }
  }
  return reachable;
}

function isAvailable(requires: EvidenceId[], mode: "all" | "any" = "all", have: Set<EvidenceId>) {
  return mode === "any" ? requires.some((r) => have.has(r)) : requires.every((r) => have.has(r));
}

export function briefEvidence(): Evidence[] {
  return BRIEF_EVIDENCE.map((id) => evidenceById.get(id)!);
}

export function evidenceFor(ids: Set<EvidenceId>): Evidence[] {
  return evidence.filter((e) => ids.has(e.id));
}

export function availableLeads(have: Set<EvidenceId>): LeadView[] {
  return leads
    .filter((l) => isAvailable(l.requires, l.mode, have) && l.unlocks.some((u) => !have.has(u)))
    .map(({ id, label, detail }) => ({ id, label, detail }));
}

export function activeConflicts(have: Set<EvidenceId>): ConflictView[] {
  return conflicts
    .filter((c) => have.has(c.a) && have.has(c.b))
    .map(({ id, number, a, b, prompt }) => ({ id, number, a, b, prompt }));
}

export function followLead(leadId: string, have: Set<EvidenceId>): Evidence[] {
  const lead = leads.find((l) => l.id === leadId);
  if (!lead || !isAvailable(lead.requires, lead.mode, have)) return [];
  return lead.unlocks
    .filter((id) => !have.has(id))
    .map((id) => evidenceById.get(id)!)
    .filter(Boolean);
}
