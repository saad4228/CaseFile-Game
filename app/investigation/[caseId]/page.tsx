import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalApp } from "@/components/game/LocalApp";
import { getBundle } from "@/lib/game-engine/cases.server";
import { buildPlayView } from "@/lib/game-engine/engine.server";
import { casePublic } from "@/lib/game-engine/public.server";

export async function generateMetadata(props: PageProps<"/investigation/[caseId]">): Promise<Metadata> {
  const { caseId } = await props.params;
  const bundle = getBundle(caseId);
  return { title: bundle ? `Investigating ${bundle.meta.number}` : "Case not found", robots: { index: false } };
}

/** Device-only investigation: works with no database; progress stays in this browser. */
export default async function LocalInvestigationPage(props: PageProps<"/investigation/[caseId]">) {
  const { caseId } = await props.params;
  const bundle = getBundle(caseId);
  if (!bundle || !bundle.meta.playable) notFound();

  // Only the case brief ships with the page. Everything else is earned.
  const initialPlay = buildPlayView(bundle, { visible: new Set(bundle.brief), followed: [], actions: [] });
  return <LocalApp pub={casePublic(bundle)} brief={bundle.brief} initialPlay={initialPlay} />;
}
