import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { TopNav } from "@/components/landing/TopNav";
import { adminTitle, requireAdmin } from "@/lib/admin.server";
import { db } from "@/lib/db/prisma";
import { getBundle } from "@/lib/game-engine/cases.server";
import { normalizeShared } from "@/lib/game-engine/state";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await adminTitle("Investigation"), robots: { index: false } };
}

const when = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" });

export default async function AdminSessionPage(props: PageProps<"/admin/sessions/[code]">) {
  await connection(); // runtime configuration (database, sign-in): render per request
  await requireAdmin();
  const { code } = await props.params;
  const s = await db().gameSession.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      players: { include: { user: { select: { codename: true, isGuest: true, email: true } } }, orderBy: { joinedAt: "asc" } },
      evidence: { orderBy: { createdAt: "asc" } },
      leads: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { id: "desc" }, take: 60 },
      result: true,
    },
  });
  if (!s) notFound();
  const bundle = getBundle(s.caseId);
  const shared = normalizeShared(s.state);
  const names = new Map(s.players.map((p) => [p.userId, p.user.codename]));
  const title = (id: string) => bundle?.evidenceById.get(id)?.title ?? id;

  return (
    <>
      <TopNav tone="solid" />
      <main id="main" className="mx-auto max-w-7xl px-4 py-12 md:px-10">
        <Link href="/admin" className="label hover:text-bone-100">
          ← Records office
        </Link>
        <h1 className="font-display mt-3 text-5xl">
          Room <span className="font-mono">{s.code}</span>
        </h1>
        <p className="mt-2 text-bone-100/65">
          Case {s.caseId} · {s.mode} · {s.phase} · version {s.version} · created {when.format(s.createdAt)} UTC
          {s.result && ` · ${s.result.solved ? "solved" : "unsolved"}, rank ${s.result.rank}, ${s.result.final} points`}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="players">
            <h2 id="players" className="label">
              Investigators
            </h2>
            <ul className="mt-3 divide-y divide-ink-800 border-y border-ink-700">
              {s.players.map((p) => (
                <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2.5 text-sm">
                  <span>
                    {p.user.codename}
                    {p.isHost && <span className="ml-2 text-amber-300">host</span>}
                    {p.user.isGuest && <span className="ml-2 text-steel-400">guest</span>}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-steel-300">{p.roles || "no role"}</span>
                </li>
              ))}
            </ul>

            <h2 className="label mt-10">Board &amp; verdict</h2>
            <p className="mt-3 text-sm text-bone-100/70">
              {shared.board.nodes.length} pinned items · {shared.board.edges.length} threads · {shared.timeline.placed.length} on the
              timeline · {shared.theories.length} theories
            </p>
            <p className="mt-2 text-sm text-bone-100/70">
              Draft verdict: who {shared.verdict.who ?? "—"}, how {shared.verdict.how ?? "—"}, when {shared.verdict.when ?? "—"}, where{" "}
              {shared.verdict.where ?? "—"}, why {shared.verdict.why ?? "—"}
            </p>

            <h2 className="label mt-10">Leads followed · {s.leads.length}</h2>
            <ul className="mt-3 space-y-1 text-sm text-bone-100/75">
              {s.leads.map((l) => (
                <li key={l.id}>
                  {l.leadId} {bundle?.leads.find((x) => x.id === l.leadId)?.label} — {names.get(l.byId) ?? "?"}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="records">
            <h2 id="records" className="label">
              Records on file · {s.evidence.length}
            </h2>
            <ul className="scrollbar-thin mt-3 max-h-[420px] space-y-1 overflow-y-auto text-sm">
              {s.evidence.map((e) => (
                <li key={e.id} className="flex justify-between gap-3">
                  <span>
                    <span className="font-mono text-steel-400">{e.evidenceId}</span> {title(e.evidenceId)}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-steel-400">
                    {e.via} · {e.holderId ? `private: ${names.get(e.holderId) ?? "?"}` : "shared"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-12" aria-labelledby="chat">
          <h2 id="chat" className="label">
            Team channel · latest {s.messages.length}
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {s.messages.map((m) => (
              <li key={m.id} className={m.kind === "SYSTEM" ? "text-steel-300" : ""}>
                <span className="font-mono text-[11px] text-steel-400">{when.format(m.createdAt)}</span>{" "}
                {m.userId ? <strong className="font-medium">{names.get(m.userId) ?? "?"}: </strong> : null}
                {m.body}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
