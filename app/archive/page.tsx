import type { Metadata } from "next";
import { connection } from "next/server";
import { ArchiveView } from "@/components/archive/ArchiveView";
import { TopNav } from "@/components/landing/TopNav";
import { cases } from "@/data/cases";
import { archiveProgress } from "@/lib/archive.server";
import type { CaseProgress } from "@/lib/archive-types";
import { getCurrentUser } from "@/lib/auth/session";
import { hasDatabase } from "@/lib/env";
import { unpublishedCaseIds } from "@/lib/game-engine/publish.server";

export const metadata: Metadata = {
  title: "The Archive",
  description: "Season One of CASEFILE: five case files. One is open.",
};

export default async function ArchivePage() {
  await connection(); // runtime configuration (database, sign-in): render per request
  const online = hasDatabase();
  const hidden = await unpublishedCaseIds();
  // A case pulled by an admin stays on the wall, sealed.
  const visible = cases.map((c) => (hidden.has(c.id) ? { ...c, playable: false, status: "SEALED" as const } : c));
  let progress: Record<string, CaseProgress> = {};
  let teasers: Record<string, string> = {};
  if (online) {
    const user = await getCurrentUser();
    if (user) ({ progress, teasers } = await archiveProgress(user.id));
  }
  return (
    <>
      <TopNav tone="solid" />
      <main id="main" className="relative min-h-screen overflow-hidden pb-40">
        {/* a shaft of window light across the wall */}
        <div
          className="pointer-events-none absolute -top-40 left-[10%] h-[140%] w-[45%] -rotate-[24deg] bg-gradient-to-b from-amber-300/[0.07] via-amber-300/[0.03] to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1400px] px-4 pt-16 md:px-10 md:pt-24">
          <p className="label">Season One</p>
          <h1 className="font-display mt-4 text-6xl leading-[0.9] md:text-8xl">
            The <em className="text-amber-300">Archive</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone-100/70">
            Five files. One of them is open. The others will be, once you&apos;ve earned them.
          </p>
          <div className="mt-14">
            <ArchiveView cases={visible} online={online} progress={progress} teasers={teasers} />
          </div>
        </div>
      </main>
    </>
  );
}
