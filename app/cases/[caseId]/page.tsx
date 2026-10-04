import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CaseIntro, type StartOptions } from "@/components/case/CaseIntro";
import { getCaseMeta } from "@/data/cases";
import { suspects } from "@/data/cases/case-047/suspects";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasDatabase } from "@/lib/env";
import { isCasePublished } from "@/lib/game-engine/publish.server";

export async function generateMetadata(props: PageProps<"/cases/[caseId]">): Promise<Metadata> {
  const { caseId } = await props.params;
  const meta = getCaseMeta(caseId);
  if (!meta) return { title: "Case not found" };
  const title = `Case ${meta.number} — ${meta.title}`;
  return { title, description: meta.logline, openGraph: { title, description: meta.logline } };
}

export default async function CasePage(props: PageProps<"/cases/[caseId]">) {
  await connection(); // runtime configuration (database, sign-in): render per request
  const { caseId } = await props.params;
  const sp = await props.searchParams;
  const meta = getCaseMeta(caseId);
  if (!meta || !meta.playable || !(await isCasePublished(meta.id))) notFound();

  const start: StartOptions = { online: hasDatabase() };
  if (start.online) {
    if (typeof sp.error === "string") start.error = sp.error.slice(0, 200);
    const user = await getCurrentUser();
    if (user) {
      const open = await db().casePlayer.findFirst({
        where: { userId: user.id, session: { caseId: meta.id, phase: { not: "RESOLVED" } } },
        orderBy: { joinedAt: "desc" },
        select: { session: { select: { code: true, mode: true } } },
      });
      start.resume = open ? { code: open.session.code, mode: open.session.mode === "TEAM" ? "TEAM" : "SOLO" } : null;
    }
  }
  return <CaseIntro meta={meta} suspects={suspects} start={start} />;
}
