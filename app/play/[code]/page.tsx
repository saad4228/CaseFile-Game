import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { joinRoomAction } from "@/app/actions/session";
import { SessionApp } from "@/components/game/SessionApp";
import { Rain } from "@/components/illustrations/Rain";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasDatabase } from "@/lib/env";
import { getBundle } from "@/lib/game-engine/cases.server";
import { casePublic } from "@/lib/game-engine/public.server";
import { findSessionByCode, getSessionView, MAX_PLAYERS } from "@/lib/sessions/service.server";

export const metadata: Metadata = { title: "Investigation", robots: { index: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink-950 px-4">
      <Rain className="absolute inset-0 h-full w-full opacity-50" density={0.5} />
      <div className="relative w-full max-w-lg">{children}</div>
    </main>
  );
}

export default async function PlayPage(props: PageProps<"/play/[code]">) {
  await connection(); // runtime configuration (database, sign-in): render per request
  if (!hasDatabase()) notFound();
  const { code } = await props.params;
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const session = await findSessionByCode(clean);
  if (!session) notFound();
  const bundle = getBundle(session.caseId);
  if (!bundle) notFound();
  const user = await getCurrentUser();
  const member = user
    ? await db().casePlayer.findUnique({ where: { sessionId_userId: { sessionId: session.id, userId: user.id } } })
    : null;

  if (!user || !member) {
    const canJoin = session.mode === "TEAM" && session.phase !== "RESOLVED";
    const count = await db().casePlayer.count({ where: { sessionId: session.id } });
    return (
      <Shell>
        <div className="paper torn px-8 py-10">
          <p className="label-ink">Case {bundle.meta.number} — {bundle.meta.title}</p>
          {canJoin && count < MAX_PLAYERS ? (
            <>
              <p className="font-display mt-3 text-4xl text-[#1d1a14]">You&apos;ve been called in.</p>
              <p className="mt-4 text-sm leading-relaxed text-[#1d1a14]/80">
                A team is investigating in room <span className="font-mono font-semibold">{session.code}</span>
                {session.phase === "ACTIVE" ? " — the briefing is already over, so you'll start with what the team has shared." : "."}{" "}
                {user ? `You'll join as ${user.codename}.` : "You'll join as a guest — you can register later and keep everything."}
              </p>
              <form action={joinRoomAction} className="mt-8 flex flex-wrap items-center gap-4">
                <input type="hidden" name="code" value={session.code} />
                <button type="submit" className="btn btn-primary">
                  Join the investigation
                </button>
                {!user && (
                  <Link href={`/login?next=/play/${session.code}`} className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1d1a14]/70 hover:text-[#1d1a14]">
                    Sign in first →
                  </Link>
                )}
              </form>
            </>
          ) : (
            <>
              <p className="font-display mt-3 text-4xl text-[#1d1a14]">This file is closed to you.</p>
              <p className="mt-4 text-sm text-[#1d1a14]/80">
                {session.mode === "SOLO" ? "That investigation is private." : count >= MAX_PLAYERS ? "That room is full." : "That case has already been closed."}
              </p>
              <Link href="/archive" className="btn btn-primary mt-8">
                Back to the archive
              </Link>
            </>
          )}
        </div>
      </Shell>
    );
  }

  const view = await getSessionView(session.id, user);
  return <SessionApp pub={casePublic(bundle)} initial={view} />;
}
