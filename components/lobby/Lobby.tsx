"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useGame } from "@/components/game/GameContext";
import { Rain } from "@/components/illustrations/Rain";
import { SuspectPhoto } from "@/components/illustrations/SuspectPhoto";
import { SuspectPortrait } from "@/components/illustrations/SuspectPortrait";
import { Stamp } from "@/components/ui/Stamp";
import type { Role } from "@/lib/game-engine/types";
import { ROLE_INFO, ROLES } from "@/lib/sessions/types";

export function Lobby() {
  const { meta, code, players, me, lobby, suspects } = useGame();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const mine = players.find((p) => p.userId === me.userId);
  const claimedBy = (r: Role) => players.find((p) => p.roles.includes(r));
  const allReady = players.every((p) => p.isHost || p.ready);
  const link = typeof window !== "undefined" ? `${window.location.origin}/play/${code}` : `/play/${code}`;

  const run = async (fn: () => Promise<{ ok?: boolean; error?: string } | undefined>) => {
    setBusy(true);
    setError(null);
    const r = await fn();
    setBusy(false);
    if (r && !r.ok && r.error) setError(r.error);
  };

  if (!lobby) return null;

  return (
    <main id="main" className="relative min-h-[100svh] overflow-hidden">
      <Rain className="pointer-events-none absolute inset-0 h-full w-full opacity-40" density={0.5} />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[80%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_55%_at_50%_0%,rgba(240,174,85,0.14),transparent_70%)]" />
      <header className="relative flex items-center justify-between px-4 py-5 md:px-10">
        <Link href="/archive" className="font-display text-xl tracking-[0.08em]">
          CASEFILE
        </Link>
        <span className="label">Team room</span>
      </header>

      <div className="relative mx-auto grid max-w-[1400px] gap-10 px-4 pb-16 md:px-10 xl:grid-cols-[1fr_380px]">
        <div>
          <p className="label">Case {meta.number} — {meta.title}</p>
          <h1 className="font-display mt-3 text-5xl leading-[0.95] md:text-7xl">
            Assemble the <em className="text-amber-300">team.</em>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-bone-100/70">
            Every role starts with records nobody else has seen. Nobody holds the whole truth. Pick a role, share what matters, and
            close the case together. Two to five investigators.
          </p>

          {/* invite */}
          <div className="mt-10 flex flex-wrap items-stretch gap-4">
            <div className="paper-aged px-6 py-4">
              <p className="label-ink">Room code</p>
              <p className="mt-1 font-mono text-4xl font-semibold tracking-[0.35em] text-[#1d1a14]">{code}</p>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2 border border-ink-700 px-5 py-4">
              <p className="label">Invite link</p>
              <div className="flex flex-wrap items-center gap-3">
                <code className="break-all font-mono text-sm text-bone-100/85">{link}</code>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* players */}
          <div className="mt-12">
            <p className="label">Investigators · {players.length}/5</p>
            <ul className="mt-5 flex flex-wrap gap-5">
              {players.map((p, i) => (
                <motion.li
                  key={p.userId}
                  className="photo-print relative w-36"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0, rotate: [-2, 1.5, -1, 2.5, -1.5][i % 5] }}
                >
                  <span className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-crimson-600 shadow-[0_2px_3px_rgba(0,0,0,.6)]" aria-hidden="true" />
                  <SuspectPortrait spec={{ hair: (["short", "long", "bun", "swept"] as const)[i % 4], collar: "coat", hat: i % 3 === 0 }} label={p.codename} className="block w-full" />
                  <p className="mt-2 truncate font-mono text-[11px] uppercase tracking-[0.12em] text-[#1d1a14]">
                    {p.codename}
                    {p.userId === me.userId && " (you)"}
                  </p>
                  <p className="text-[11px] text-[#1d1a14]/70">
                    {p.roles.length ? p.roles.map((r) => ROLE_INFO[r].title).join(" + ") : "No role yet"}
                  </p>
                  <div className="absolute -right-3 bottom-8">
                    {p.isHost ? (
                      <Stamp tone="ink" rotate={-8} size="sm">
                        Host
                      </Stamp>
                    ) : p.ready ? (
                      <Stamp tone="crimson" rotate={-8} size="sm">
                        Ready
                      </Stamp>
                    ) : null}
                  </div>
                  {!p.online && <span className="absolute left-2 top-2 bg-ink-950/80 px-1.5 font-mono text-[9px] uppercase text-steel-300">away</span>}
                </motion.li>
              ))}
              {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
                <li key={`empty-${i}`} className="flex w-36 items-center justify-center border border-dashed border-ink-600 px-3 py-12 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-steel-400">
                  Waiting for an investigator
                </li>
              ))}
            </ul>
          </div>

          {/* roles */}
          <div className="mt-12">
            <p className="label">Your role</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {ROLES.map((r) => {
                const holder = claimedBy(r);
                const isMine = holder?.userId === me.userId;
                const taken = holder && !isMine;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={busy || Boolean(taken)}
                    aria-pressed={isMine}
                    onClick={() => run(() => lobby.setRole(isMine ? null : r))}
                    className={`border p-4 text-left transition-colors disabled:cursor-not-allowed ${
                      isMine ? "border-amber-500 bg-amber-500/10" : taken ? "border-ink-700 opacity-50" : "border-ink-600 hover:border-bone-100/50"
                    }`}
                  >
                    <p className="font-display text-xl">{ROLE_INFO[r].title}</p>
                    <p className="mt-1 text-[13px] leading-snug text-bone-100/65">{ROLE_INFO[r].brief}</p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-steel-300">
                      {isMine ? "Yours — click to release" : taken ? `Taken by ${holder!.codename}` : "Open"}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-bone-100/50">Unclaimed roles are dealt out when the case starts, so every record has an owner.</p>
          </div>

          {error && (
            <p role="alert" className="mt-6 border-l-4 border-crimson-600 bg-crimson-600/10 px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {mine?.isHost ? (
              <>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run(() => lobby.start())}>
                  Open the case
                </button>
                <span className="text-sm text-bone-100/55">
                  {players.length < 2
                    ? "You can start alone, but this case is built for two or more."
                    : allReady
                      ? "Everyone's ready."
                      : "Some investigators aren't ready yet."}
                </span>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run(() => lobby.setReady(!mine?.ready))}>
                  {mine?.ready ? "Not ready" : "I'm ready"}
                </button>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => run(() => lobby.leave()).then(() => router.push("/archive"))}>
                  Leave room
                </button>
                <span className="text-sm text-bone-100/55">The host opens the case.</span>
              </>
            )}
          </div>

          <div className="mt-14 hidden gap-4 opacity-60 md:flex" aria-hidden="true">
            {suspects.slice(0, 4).map((s) => (
              <div key={s.id} className="w-20">
                <SuspectPhoto suspect={s} className="block w-full grayscale" />
              </div>
            ))}
          </div>
        </div>

        <div className="h-[520px] border border-ink-700 xl:sticky xl:top-6 xl:h-[calc(100svh-120px)]">
          <ChatPanel open inline onOpen={() => {}} />
        </div>
      </div>
    </main>
  );
}
