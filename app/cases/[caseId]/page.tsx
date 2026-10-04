import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseIntro } from "@/components/case/CaseIntro";
import { getCaseMeta } from "@/data/cases";
import { suspects } from "@/data/cases/case-047/suspects";

export async function generateMetadata(props: PageProps<"/cases/[caseId]">): Promise<Metadata> {
  const { caseId } = await props.params;
  const meta = getCaseMeta(caseId);
  return { title: meta ? `Case ${meta.number} — ${meta.title}` : "Case not found" };
}

export default async function CasePage(props: PageProps<"/cases/[caseId]">) {
  const { caseId } = await props.params;
  const meta = getCaseMeta(caseId);
  if (!meta || !meta.playable) notFound();
  return <CaseIntro meta={meta} suspects={suspects} />;
}
