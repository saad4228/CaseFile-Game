import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { purgeStaleAction, setCasePublishedAction } from "@/app/actions/admin";
import { TopNav } from "@/components/landing/TopNav";
import { adminOverview, requireAdmin } from "@/lib/admin.server";
import { bundleIds, requireBundle } from "@/lib/game-engine/cases.server";
import { validateCase } from "@/lib/game-engine/validate.server";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const when = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export default async function AdminPage() {
  await connection(); // runtime configuration (database, sign-in): render per request
  await requireAdmin();
  const { registered, guests, active, lobby, resolvedWeek, results, sessions, flags, solved } = await adminOverview();
  const published = new Map(flags.map((f) => [f.id, f.published]));
  const reports = bundleIds().map((id) => ({ id, bundle: requireBundle(id), report: validateCase(requireBundle(id)) }));

  const stats = [
    { label: "Registered", value: registered },
    { label: "Guests", value: guests },
    { label: "In progress", value: active },
    { label: "In lobby", value: lobby },
    { label: "Closed · 7 days", value: resolvedWeek },
    { label: "Solve rate", value: results._count._all ? `${Math.round((solved / results._count._all) * 100)}%` : "—" },
    { label: "Avg score", value: results._avg.final ? Math.round(results._avg.final) : "—" },
    { label: "Avg time", value: results._avg.durationSec ? `${Math.round(results._avg.durationSec / 60)}m` : "—" },
  ];

  return (
    <>
      <TopNav tone="solid" />
      <main id="main" className="mx-auto max-w-7xl px-4 py-12 md:px-10">
        <p className="label">Internal</p>
        <h1 className="font-display mt-2 text-5xl">Records office</h1>

        <dl className="mt-10 grid grid-cols-2 gap-px border border-ink-700 bg-ink-700 sm:grid-cols-4 lg:grid-cols-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-ink-900 px-4 py-4">
              <dt className="label !text-[9px]">{s.label}</dt>
              <dd className="font-display mt-1 text-3xl tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-14" aria-labelledby="cases">
          <h2 id="cases" className="label">
            Cases
          </h2>
          <div className="mt-4 space-y-6">
            {reports.map(({ id, bundle, report }) => {
              const isPublished = published.get(id) ?? true;
              return (
                <article key={id} className="border border-ink-700 bg-ink-900/60 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel-400">Case {bundle.meta.number}</p>
                      <p className="font-display text-3xl">{bundle.meta.title}</p>
                      <p className="mt-1 text-sm text-bone-100/60">
                        {report.stats.evidence} records ({report.stats.reachable} reachable) · {report.stats.leads} leads ·{" "}
                        {report.stats.conflicts} conflicts · {report.stats.interviews} interview scripts · perfect run scores{" "}
                        {report.stats.perfectScore} ({report.stats.perfectRank})
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-[11px] uppercase tracking-[0.2em] ${report.ok ? "text-amber-300" : "text-crimson-400"}`}>
                        {report.ok ? "Valid" : "Invalid"}
                      </span>
                      <form action={setCasePublishedAction}>
                        <input type="hidden" name="caseId" value={id} />
                        <input type="hidden" name="published" value={String(!isPublished)} />
                        <button type="submit" className={`btn btn-sm ${isPublished ? "btn-ghost" : "btn-primary"}`}>
                          {isPublished ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                    </div>
                  </div>
                  <ul className="mt-5 grid gap-2 md:grid-cols-2">
                    {report.checks.map((c) => (
                      <li key={c.id} className="text-sm">
                        <span className={c.ok ? "text-amber-300" : "text-crimson-400"}>{c.ok ? "✓" : "✗"}</span> {c.label}
                        {!c.ok && (
                          <ul className="ml-5 mt-1 list-disc text-[13px] text-crimson-400/90">
                            {c.details.slice(0, 8).map((d) => (
                              <li key={d}>{d}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="sessions">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="sessions" className="label">
              Recent investigations
            </h2>
            <form action={purgeStaleAction}>
              <button type="submit" className="label hover:text-bone-100">
                Purge expired sign-ins, rate limits and abandoned lobbies
              </button>
            </form>
          </div>
          <div className="scrollbar-thin mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 font-mono text-[10px] uppercase tracking-[0.18em] text-steel-400">
                  <th className="py-2 pr-4 font-normal">Room</th>
                  <th className="py-2 pr-4 font-normal">Case</th>
                  <th className="py-2 pr-4 font-normal">Mode</th>
                  <th className="py-2 pr-4 font-normal">Phase</th>
                  <th className="py-2 pr-4 font-normal">Players</th>
                  <th className="py-2 pr-4 font-normal">Records</th>
                  <th className="py-2 pr-4 font-normal">Messages</th>
                  <th className="py-2 pr-4 font-normal">Last activity (UTC)</th>
                  <th className="py-2 font-normal">Result</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.code} className="border-b border-ink-800 hover:bg-ink-900">
                    <td className="py-2.5 pr-4 font-mono">
                      <Link href={`/admin/sessions/${s.code}`} className="text-amber-300 hover:underline">
                        {s.code}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">{s.caseId}</td>
                    <td className="py-2.5 pr-4">{s.mode}</td>
                    <td className="py-2.5 pr-4">{s.phase}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{s._count.players}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{s._count.evidence}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{s._count.messages}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{when.format(s.lastActivityAt)}</td>
                    <td className="py-2.5">
                      {s.result ? (
                        <span className={s.result.solved ? "text-amber-300" : "text-crimson-400"}>
                          {s.result.rank} · {s.result.final}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
