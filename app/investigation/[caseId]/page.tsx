import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceLoader as Workspace } from "@/components/investigation/WorkspaceLoader";
import { getCaseMeta } from "@/data/cases";
import { BRIEF_EVIDENCE } from "@/data/cases/case-047/evidence.server";
import { locations, routes } from "@/data/cases/case-047/locations";
import { suspects } from "@/data/cases/case-047/suspects";
import { activeConflicts, availableLeads, briefEvidence } from "@/lib/game-engine/engine.server";

export async function generateMetadata(props: PageProps<"/investigation/[caseId]">): Promise<Metadata> {
  const { caseId } = await props.params;
  const meta = getCaseMeta(caseId);
  return { title: meta ? `Investigating ${meta.number}` : "Case not found" };
}

export default async function InvestigationPage(props: PageProps<"/investigation/[caseId]">) {
  const { caseId } = await props.params;
  const meta = getCaseMeta(caseId);
  if (!meta || !meta.playable) notFound();

  // Only the case brief is sent with the page. Everything else is earned through leads.
  const have = new Set(BRIEF_EVIDENCE);
  const initial = {
    evidence: briefEvidence(),
    leads: availableLeads(have),
    conflicts: activeConflicts(have),
  };

  return (
    <Workspace
      meta={meta}
      suspects={suspects}
      locations={locations}
      routes={routes}
      brief={BRIEF_EVIDENCE}
      initial={initial}
    />
  );
}
