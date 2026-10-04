import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { createRoomAction, joinRoomAction } from "@/app/actions/session";
import { Rain } from "@/components/illustrations/Rain";
import { TopNav } from "@/components/landing/TopNav";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cases } from "@/data/cases";
import { getCurrentUser } from "@/lib/auth/session";
import { hasDatabase } from "@/lib/env";
import { unpublishedCaseIds } from "@/lib/game-engine/publish.server";
import { ROLE_INFO, ROLES } from "@/lib/sessions/types";

export const metadata: Metadata = {
  title: "Team investigation",
  description: "Open a private room, send the invite link, and split the case between up to four investigators.",
};

export default async function NewRoomPage(props: PageProps<"/rooms/new">) {
  await connection(); // runtime configuration (database, sign-in): render per request
  const sp = await props.searchParams;
  const online = hasDatabase();
  const error = typeof sp.error === "string" ? sp.error.slice(0, 200) : undefined;
  const code = typeof sp.code === "string" ? sp.code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) : "";
  const hidden = await unpublishedCaseIds();
  const playable = cases.filter((c) => c.playable && !hidden.has(c.id));
  const user = online ? await getCurrentUser() : null;

  return (
    <>
      <TopNav tone="solid" />
      <main id="main" className="relative min-h-[calc(100svh-77px)] overflow-hidden px-4 py-16 md:px-10">
        <Rain className="absolute inset-0 h-full w-full opacity-40" density={0.45} />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(240,174,85,0.12),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="label">Vesper City PD — Task force</p>
          <h1 className="font-display mt-4 text-5xl leading-[0.95] md:text-7xl">
            Nobody solves
            <br />
            <em className="text-amber-300">this alone.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone-100/70">
            Open a private room and send the link. Each investigator takes a role and starts with records only they hold.
            What you share, the team can use. What you keep to yourself, it can&apos;t.
          </p>

          {!online ? (
            <div className="paper torn mt-12 max-w-xl px-8 py-10">
              <p className="label-ink">Demo mode</p>
              <p className="font-display mt-3 text-3xl text-[#1d1a14]">Team rooms are switched off.</p>
              <p className="mt-4 text-sm leading-relaxed text-[#1d1a14]/80">
                This deployment has no database, so rooms, accounts and profiles are unavailable. The case is still fully
                playable on this device.
              </p>
              <Link href="/cases/047" className="btn btn-primary mt-8">
                Play on this device
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <p role="alert" className="mt-10 max-w-xl border-l-4 border-crimson-600 bg-crimson-600/10 px-4 py-3 text-sm">
                  {error}
                </p>
              )}
              <div className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
                <section className="paper relative min-w-0 px-7 py-8 md:px-10" aria-labelledby="open-room">
                  <p className="label-ink">Open a room</p>
                  <h2 id="open-room" className="font-display mt-2 text-3xl text-[#1d1a14]">
                    Choose the file
                  </h2>
                  <ul className="mt-6 space-y-3">
                    {playable.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 border border-[#1d1a14]/20 px-5 py-4">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1d1a14]/60">
                            Case {c.number} · {c.players} investigators · {c.estTime.toLowerCase()}
                          </p>
                          <p className="font-display text-2xl text-[#1d1a14]">{c.title}</p>
                        </div>
                        <form action={createRoomAction}>
                          <input type="hidden" name="caseId" value={c.id} />
                          <SubmitButton className="btn btn-primary btn-sm" pendingText="Opening…">
                            Open room
                          </SubmitButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm text-[#1d1a14]/70">
                    {user
                      ? `You'll host as ${user.codename}.`
                      : "You'll host as a guest. You can register at any time and keep everything."}
                  </p>
                </section>

                <section className="panel min-w-0 px-7 py-8" aria-labelledby="join-room">
                  <p className="label">Join a room</p>
                  <h2 id="join-room" className="font-display mt-2 text-3xl">
                    Got a code?
                  </h2>
                  <form action={joinRoomAction} className="mt-6 flex gap-3">
                    <label htmlFor="room-code" className="sr-only">
                      Room code
                    </label>
                    <input
                      id="room-code"
                      name="code"
                      defaultValue={code}
                      required
                      minLength={4}
                      maxLength={8}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      placeholder="K7Q2XM"
                      className="min-w-0 flex-1 border border-ink-600 bg-ink-950 px-4 py-3 font-mono text-lg uppercase tracking-[0.3em] outline-none focus:border-amber-500"
                    />
                    <SubmitButton className="btn btn-primary" pendingText="…">
                      Join
                    </SubmitButton>
                  </form>
                  <p className="mt-4 text-sm text-bone-100/60">The host can copy an invite link from the room. Opening the link works too.</p>
                </section>
              </div>

              <section className="mt-16" aria-labelledby="roles">
                <p className="label">The roles</p>
                <h2 id="roles" className="sr-only">
                  Roles
                </h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {ROLES.map((r) => (
                    <li key={r} className="border border-ink-700 bg-ink-900/60 p-5">
                      <p className="font-display text-2xl">{ROLE_INFO[r].title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-bone-100/65">{ROLE_INFO[r].brief}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-bone-100/55">
                  With fewer than five investigators, unclaimed roles are dealt out when the case opens — someone holds every
                  record.
                </p>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
