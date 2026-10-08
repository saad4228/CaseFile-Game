import "server-only";
import { BRIEF_EVIDENCE, evidence } from "@/data/cases/case-047/evidence.server";
import { interviews } from "@/data/cases/case-047/interviews.server";
import { conflicts, leads, type Conflict, type Lead } from "@/data/cases/case-047/leads.server";
import { locations, routes } from "@/data/cases/case-047/locations";
import { meta } from "@/data/cases/case-047/meta";
import { suspects } from "@/data/cases/case-047/suspects";
import { truth } from "@/data/cases/case-047/truth.server";
import { verdictOptions } from "@/data/cases/case-047/verdict";
import { keyBy } from "@/lib/collections";
import type {
  CaseMeta,
  Evidence,
  InterviewScript,
  Location,
  Route,
  Suspect,
  VerdictOptions,
} from "./types";

/** Everything the server knows about one case. Never serialize a bundle to the client. */
export interface CaseBundle {
  meta: CaseMeta;
  suspects: Suspect[];
  locations: Location[];
  routes: Route[];
  evidence: Evidence[];
  evidenceById: Map<string, Evidence>;
  brief: string[];
  /** Brief records every team member sees from the start; the rest go to role holders. */
  common: string[];
  leads: Lead[];
  conflicts: Conflict[];
  interviews: Record<string, InterviewScript>;
  truth: typeof truth;
  verdictOptions: VerdictOptions;
}

const bundles: Record<string, CaseBundle> = {
  "047": {
    meta,
    suspects,
    locations,
    routes,
    evidence,
    evidenceById: keyBy(evidence),
    brief: BRIEF_EVIDENCE,
    common: ["E-001"],
    leads,
    conflicts,
    interviews,
    truth,
    verdictOptions,
  },
};

export function getBundle(caseId: string): CaseBundle | null {
  return bundles[caseId] ?? null;
}

export function requireBundle(caseId: string): CaseBundle {
  const b = getBundle(caseId);
  if (!b) throw new Error(`Unknown case ${caseId}`);
  return b;
}

export const bundleIds = () => Object.keys(bundles);
