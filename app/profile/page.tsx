import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { signOutAction } from "@/app/actions/auth";
import { Rain } from "@/components/illustrations/Rain";
import { TopNav } from "@/components/landing/TopNav";
import { CodenameForm } from "@/components/profile/CodenameForm";
import { RingSymbol } from "@/components/ui/RingSymbol";
import { Stamp } from "@/components/ui/Stamp";
import { getCaseMeta } from "@/data/cases";
import { ACHIEVEMENTS, RANKS, rankTitle, type AchievementKey } from "@/lib/achievements";
import { enabledProviders } from "@/lib/auth/oauth";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasDatabase } from "@/lib/env";
import { listMySessions } from "@/lib/sessions/service.server";

export const metadata: Metadata = { title: "Detective file", robots: { index: false } };

const providerLabel = { google: "Google", github: "GitHub" } as const;

const minutes = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function ProfilePage(props: PageProps<"/profile">) {
  await connection(); // runtime configuration (database, sign-in): render per request
  if (!hasDatabase()) redirect("/login");
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error.slice(0, 200) : undefined;

  const [record, profile, earned, accounts, history] = await Promise.all([
    db().user.findUniqueOrThrow({ where: { id: user.id }, select: { email: true, createdAt: true } }),
    db().detectiveProfile.findUnique({ where: { userId: user.id } }),
    db().achievement.findMany({ where: { userId: user.id }, select: { key: true, earnedAt: true } }),
    db().account.findMany({ where: { userId: user.id }, select: { provider: true } }),
    listMySessions(user.id),
  ]);

  const solved = profile?.casesSolved ?? 0;
  const closed = solved + (profile?.casesFailed ?? 0);
  const avg = (total: number | undefined) => (closed ? Math.round((total ?? 0) / closed) : 0);
  const rank = rankTitle(solved);
  const nextRank = RANKS.find((r) => r.min > solved);
  const earnedAt = new Map(earned.map((a) => [a.key, a.earnedAt]));
  const linked = new Set(accounts.map((a) => a.provider));
  const connectable = enabledProviders().filter((p) => !linked.has(p));
  const ringSeen = earnedAt.has("the_ring");

  const stats = [
    { label: "Cases solved", value: String(solved) },
    { label: "Cases closed", value: String(closed) },
    { label: "Best score", value: closed ? String(profile?.bestScore ?? 0) : "—" },
    { label: "Average score", value: closed ? String(avg(profile?.totalScore)) : "—" },
    { label: "Average time", value: closed ? minutes((profile?.totalSolveSeconds ?? 0) / closed) : "—" },
  ];
  const skills = [
    { label: "Deduction", value: avg(profile?.deductionTotal) },
    { label: "Logic", value: avg(profile?.logicTotal) },
    { label: "Evidence", value: avg(profile?.evidenceTotal) },
    { label: "Contradictions", value: avg(profile?.contradictionTotal) },
  ];

  return (
    <>
      <TopNav tone="solid" />
      <main id="main" className="relative min-h-[calc(100svh-77px)] overflow-hidden px-4 py-14 md:px-10">
        <Rain className="absolute inset-0 h-full w-full opacity-30" density={0.35} />
        <div className="relative mx-auto max-w-6xl">
          {error && (
            <p role="alert" className="mb-8 max-w-xl border-l-4 border-crimson-600 bg-crimson-600/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}

          <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
            {/* identity card */}
            <section className="paper relative self-start px-7 pb-8 pt-7" aria-labelledby="who">
              <p className="label-ink">Vesper City PD — Personnel file</p>
              <h1 id="who" className="font-display mt-4 text-4xl leading-tight text-[#1d1a14]">
                {user.codename}
              </h1>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[#1d1a14]/70">
                {rank}
                {user.isGuest ? " · Guest" : ""}
              </p>
              <div className="absolute bottom-7 right-6">
                <Stamp tone={user.isGuest ? "crimson" : "ink"} rotate={-8} size="sm">
                  {user.isGuest ? "Temporary" : "On file"}
                </Stamp>
              </div>
              {nextRank && (
                <p className="mt-4 text-sm text-[#1d1a14]/75">
                  {nextRank.min - solved} more solved case{nextRank.min - solved > 1 ? "s" : ""} to {nextRank.title}.
                </p>
              )}
              <CodenameForm codename={user.codename} />
              <dl className="mt-6 space-y-1.5 font-mono text-[12px] text-[#1d1a14]/80">
                {record.email && (
                  <div className="flex justify-between gap-3">
                    <dt>Email</dt>
                    <dd className="truncate">{record.email}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt>On file since</dt>
                  <dd>{dateFmt.format(record.createdAt)}</dd>
                </div>
                {[...linked].map((p) => (
                  <div key={p} className="flex justify-between gap-3">
                    <dt>Connected</dt>
                    <dd>{providerLabel[p as keyof typeof providerLabel] ?? p}</dd>
                  </div>
                ))}
              </dl>

              {user.isGuest ? (
                <div className="mt-7 border-l-4 border-crimson-600 bg-[#1d1a14]/[0.06] px-4 py-3">
                  <p className="text-sm text-[#1d1a14]">
                    Guest files are tied to this browser. Register to keep your record on any device.
                  </p>
                  <Link href="/login?mode=register&next=/profile" className="btn btn-primary btn-sm mt-3">
                    Register
                  </Link>
                </div>
              ) : (
                connectable.length > 0 && (
                  <div className="mt-7 flex flex-wrap gap-2">
                    {connectable.map((p) => (
                      <a
                        key={p}
                        href={`/api/auth/oauth/${p}?next=/profile`}
                        className="btn btn-sm border-[#1d1a14]/50 text-[#1d1a14] hover:bg-[#1d1a14]/10"
                      >
                        Connect {providerLabel[p]}
                      </a>
                    ))}
                  </div>
                )
              )}
              <form action={signOutAction} className="mt-6">
                <button type="submit" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1d1a14]/60 hover:text-[#1d1a14]">
                  Sign out
                </button>
              </form>
            </section>

            <div className="space-y-10">
              {/* record */}
              <section aria-labelledby="record">
                <p id="record" className="label">
                  Service record
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-px border border-ink-700 bg-ink-700 sm:grid-cols-5">
                  {stats.map((s) => (
                    <div key={s.label} className="bg-ink-900 px-4 py-4">
                      <dt className="label !text-[9px]">{s.label}</dt>
                      <dd className="font-display mt-1 text-3xl tabular-nums">{s.value}</dd>
                    </div>
                  ))}
                </dl>
                {closed > 0 && (
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {skills.map((s) => (
                      <li key={s.label}>
                        <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-steel-300">
                          <span>{s.label}</span>
                          <span className="tabular-nums text-bone-100/85">{s.value}</span>
                        </div>
                        <div className="mt-1.5 h-1 bg-ink-700" aria-hidden="true">
                          <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, s.value)}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* history */}
              <section aria-labelledby="history">
                <p id="history" className="label">
                  Case history
                </p>
                {history.length ? (
                  <ul className="mt-4 divide-y divide-ink-700 border-y border-ink-700">
                    {history.map((h) => {
                      const meta = getCaseMeta(h.caseId);
                      return (
                        <li key={h.code}>
                          <Link href={`/play/${h.code}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-4 hover:bg-ink-900">
                            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel-400">
                              {meta ? `Case ${meta.number}` : h.caseId}
                            </span>
                            <span className="font-display min-w-[10rem] flex-1 text-xl">{meta?.title ?? "Unknown file"}</span>
                            <span className="text-sm text-bone-100/60">
                              {h.mode === "TEAM" ? `Team · ${h.team.join(", ")}` : "Solo"}
                            </span>
                            <span className="w-28 text-right font-mono text-[11px] uppercase tracking-[0.18em]">
                              {h.result ? (
                                <span className={h.result.solved ? "text-amber-300" : "text-crimson-400"}>
                                  {h.result.rank} · {h.result.final}
                                </span>
                              ) : h.phase === "LOBBY" ? (
                                <span className="text-steel-300">In lobby</span>
                              ) : (
                                <span className="text-steel-300">Open</span>
                              )}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="mt-4 border border-dashed border-ink-600 px-6 py-8">
                    <p className="font-display text-2xl italic text-bone-100/70">No cases on file yet.</p>
                    <Link href="/cases/047" className="btn btn-primary btn-sm mt-5">
                      Open Case 047
                    </Link>
                  </div>
                )}
              </section>

              {/* achievements */}
              <section aria-labelledby="commendations">
                <p id="commendations" className="label">
                  Commendations · {earned.length}/{Object.keys(ACHIEVEMENTS).length}
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(Object.keys(ACHIEVEMENTS) as AchievementKey[]).map((key) => {
                    const a = ACHIEVEMENTS[key];
                    const when = earnedAt.get(key);
                    const secret = key === "the_ring" && !when;
                    return (
                      <li
                        key={key}
                        className={`flex gap-4 border px-4 py-3 ${when ? "border-amber-500/50 bg-ink-900" : "border-ink-700 bg-ink-950/60 opacity-60"}`}
                      >
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border font-display text-lg ${
                            when ? "border-amber-500 text-amber-300" : "border-ink-600 text-steel-400"
                          }`}
                          aria-hidden="true"
                        >
                          {key === "the_ring" && ringSeen ? <RingSymbol className="h-6 w-6" /> : when ? "✓" : "·"}
                        </span>
                        <div>
                          <p className="font-display text-lg leading-tight">{secret ? "Sealed" : a.title}</p>
                          <p className="text-sm text-bone-100/65">{secret ? "Some things are only noticed by those who look twice." : a.description}</p>
                          {when && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-steel-400">{dateFmt.format(when)}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
