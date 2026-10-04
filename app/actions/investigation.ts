"use server";

import {
  activeConflicts,
  assertCase,
  availableLeads,
  evidenceFor,
  followLead,
  sanitizeDiscovered,
} from "@/lib/game-engine/engine.server";
import type { ConflictView, Evidence, LeadView } from "@/lib/game-engine/types";

export interface InvestigationSnapshot {
  evidence: Evidence[];
  leads: LeadView[];
  conflicts: ConflictView[];
}

/**
 * Rebuild the player's view from the ids they hold. Ids that weren't legitimately
 * reachable are dropped, so a forged list can't pull hidden evidence.
 * (Single-player milestone: session state moves server-side with multiplayer.)
 */
export async function restoreInvestigation(
  caseId: string,
  discovered: string[],
): Promise<InvestigationSnapshot> {
  assertCase(caseId);
  const have = sanitizeDiscovered(discovered);
  return {
    evidence: evidenceFor(have),
    leads: availableLeads(have),
    conflicts: activeConflicts(have),
  };
}

export async function pursueLead(
  caseId: string,
  leadId: string,
  discovered: string[],
): Promise<InvestigationSnapshot & { found: string[] }> {
  assertCase(caseId);
  const have = sanitizeDiscovered(discovered);
  const found = followLead(String(leadId), have);
  for (const e of found) have.add(e.id);
  return {
    found: found.map((e) => e.id),
    evidence: evidenceFor(have),
    leads: availableLeads(have),
    conflicts: activeConflicts(have),
  };
}
