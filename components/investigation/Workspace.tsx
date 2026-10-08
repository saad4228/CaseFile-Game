"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { EvidenceTray } from "@/components/evidence/EvidenceTray";
import { EvidenceViewer } from "@/components/evidence/EvidenceViewer";
import { boardSlot } from "@/components/game/boardSlot";
import { useGame } from "@/components/game/GameContext";
import { ResolutionView } from "@/components/resolution/ResolutionView";
import { SettingsMenu } from "@/components/settings/SettingsMenu";
import { PeopleView } from "@/components/suspects/PeopleView";
import { TheoriesView } from "@/components/theories/TheoriesView";
import { TimelineView } from "@/components/timeline/TimelineView";
import { VerdictView } from "@/components/verdict/VerdictView";
import { play } from "@/lib/client/sound";
import { nextStep } from "@/lib/game-engine/hint";
import { Desk, type DeskTab } from "./Desk";
import { MapView } from "./MapView";

const Board = dynamic(() => import("@/components/board/Board").then((m) => m.Board), {
  ssr: false,
  loading: () => <Loading text="Accessing archive…" />,
});

type View = "board" | "timeline" | "map" | "people" | "theories" | "verdict";

const VIEWS: { id: View; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "timeline", label: "Timeline" },
  { id: "map", label: "Map" },
  { id: "people", label: "People" },
  { id: "theories", label: "Theories" },
  { id: "verdict", label: "Verdict" },
];

export function Workspace({ onPlayAgain }: { onPlayAgain?: () => void }) {
  const game = useGame();
  const { meta, mode, phase, evidence, leads, conflicts, shared, personal, interviews, suspects, messages, me, players, connection, dispatch, restart } = game;
  const [view, setView] = useState<View>("board");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compareWith, setCompareWith] = useState<string | null>(null);
  const [panel, setPanel] = useState<"desk" | "chat" | null>(null);
  const [deskTab, setDeskTab] = useState<DeskTab>("leads");
  const [fresh, setFresh] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState<string | null>(null);
  const [lastRead, setLastRead] = useState(() => messages.at(-1)?.id ?? 0);
  const seenMessages = useRef(messages.at(-1)?.id ?? 0);

  const openConflicts = conflicts.filter((c) => !shared.conflictMarks[c.id]).length;

  const hint = useMemo(
    () => nextStep({ evidence, seen: personal.seen, leads, conflicts, conflictMarks: shared.conflictMarks, interviews, suspects, shared }),
    [evidence, personal.seen, leads, conflicts, shared, interviews, suspects],
  );

  /** Send the player wherever the hint points. */
  const followHint = () => {
    setStuck(false);
    const t = hint.target;
    if (!t) return;
    if (t.kind === "record") setOpenId(t.id);
    else if (t.kind === "desk") {
      setDeskTab(t.tab);
      setPanel("desk");
    } else if (t.kind === "suspect") {
      setView("people");
      setPeopleOpen(t.id);
    } else setView(t.view);
  };
  const unread = panel === "chat" ? 0 : messages.filter((m) => m.id > lastRead && m.userId !== me.userId).length;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Mentions and teammates' shares surface as toasts.
  useEffect(() => {
    const incoming = messages.filter((m) => m.id > seenMessages.current);
    if (!incoming.length) return;
    seenMessages.current = incoming.at(-1)!.id;
    const first = me.codename.split(" ")[0].toLowerCase();
    const mention = incoming.find((m) => m.userId !== me.userId && m.body.toLowerCase().includes(`@${first}`));
    const shareMsg = incoming.find((m) => m.kind === "SYSTEM" && m.body.includes(" shared ") && !m.body.startsWith(me.codename));
    const note = mention && panel !== "chat" ? `${mention.codename} mentioned you: “${mention.body.slice(0, 80)}”` : shareMsg?.body;
    if (incoming.some((m) => m.userId && m.userId !== me.userId)) play("tick");
    if (note) queueMicrotask(() => setToast(note));
  }, [messages, me, panel]);

  const togglePanel = (p: "desk" | "chat") => {
    setPanel((cur) => (cur === p ? null : p));
    if (p === "chat") setLastRead(messages.at(-1)?.id ?? 0);
  };

  const pinToBoard = (id: string) => {
    if (game.holders[id] === "me") {
      setToast("That record is private to you. Share it with the team before pinning it.");
      return;
    }
    // The reducer refuses a second copy of the same record, so say so rather than claiming
    // to have pinned something and leaving the player hunting for it.
    if (shared.board.nodes.some((n) => n.kind === "evidence" && n.ref === id)) {
      setToast("That record is already on the board.");
      return;
    }
    dispatch({ t: "board.add", node: { id: game.newId(), kind: "evidence", ref: id, ...boardSlot(shared.board.nodes.length) } });
    play("pin");
    setToast("Pinned to the board.");
  };

  if (phase === "RESOLVED" && !reviewing) {
    return (
      <div className="fixed inset-0">
        <ResolutionView onReview={() => setReviewing(true)} onPlayAgain={onPlayAgain} />
      </div>
    );
  }

  return (
    // Pinned to the viewport rather than sized to it: an app shell measured in svh can end up
    // a little taller than the window, and the document then scrolls behind it — which clips
    // the header off the top in fullscreen.
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <header className="relative z-40 flex flex-wrap items-center gap-x-2 border-b border-ink-700 bg-ink-950 px-3 md:flex-nowrap md:gap-5 md:px-5">
        <Link href="/archive" className="hidden font-display text-lg tracking-[0.08em] xl:block" aria-label="CASEFILE archive">
          CASEFILE
        </Link>
        <div className="mr-auto min-w-0 py-2.5 md:mr-0">
          <p className="label whitespace-nowrap !text-[9px]">
            Case {meta.number}
            {mode === "TEAM" && game.code ? ` · Room ${game.code}` : ""}
          </p>
          <p className="font-display truncate text-lg leading-tight">{meta.title}</p>
        </div>
        <nav
          className="scrollbar-thin order-last -mx-3 flex w-[calc(100%+1.5rem)] overflow-x-auto border-t border-ink-800 px-1 md:order-none md:mx-auto md:w-auto md:border-t-0 md:px-0"
          aria-label="Workspace views"
        >
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
              className={`shrink-0 border-b-2 px-2.5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] md:px-3.5 md:py-4 ${
                view === v.id ? "border-amber-500 text-bone-100" : "border-transparent text-steel-400 hover:text-bone-100"
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>
        {mode === "TEAM" && (
          <ul className="hidden items-center -space-x-1.5 lg:flex" aria-label="Team">
            {players.map((p) => (
              <li
                key={p.userId}
                title={`${p.codename}${p.online ? "" : " (away)"}`}
                className={`flex h-7 w-7 items-center justify-center border font-display text-sm ${
                  p.online ? "border-amber-500/70 bg-ink-800 text-amber-300" : "border-ink-600 bg-ink-900 text-steel-400"
                }`}
              >
                <span aria-hidden="true">{p.codename.slice(0, 1)}</span>
                <span className="sr-only">
                  {p.codename} {p.online ? "online" : "away"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Clock startedAt={game.startedAt} budgetMin={game.budgetMin} endedAt={game.result?.filedAt ?? null} />
        {connection !== "online" && (
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300 md:inline" role="status">
            {connection === "offline" ? "Archive connection lost" : "Syncing…"}
          </span>
        )}
        {/* "Stuck?" is the way back in when the trail goes cold, so it is the loudest thing here. */}
        {phase !== "RESOLVED" && (
          <button
            type="button"
            onClick={() => setStuck((v) => !v)}
            aria-expanded={stuck}
            className={`btn btn-sm shrink-0 !px-2.5 sm:!px-3.5 ${
              stuck ? "border-amber-500 bg-amber-500/15 text-amber-200" : "border-amber-500/70 text-amber-300 hover:bg-amber-500/10"
            }`}
          >
            Stuck?
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setDeskTab("oracle");
            setPanel("desk");
          }}
          className="btn btn-sm shrink-0 border-ink-600 !px-2.5 text-bone-100 hover:border-amber-500 sm:!px-3.5"
        >
          <span className="hidden sm:inline">Ask&nbsp;</span>ORACLE
        </button>
        <button
          type="button"
          onClick={() => togglePanel("desk")}
          aria-expanded={panel === "desk"}
          className="btn btn-sm shrink-0 border-ink-600 !px-2.5 text-bone-100 hover:border-amber-500 sm:!px-3.5"
        >
          Leads
          {/* The badges are glyphs and bare numbers; assistive tech gets the sentence instead. */}
          {leads.length > 0 && (
            <>
              <span aria-hidden="true" className="text-amber-300">
                {leads.length}
              </span>
              <span className="sr-only">, {leads.length} open leads</span>
            </>
          )}
          {openConflicts > 0 && (
            <>
              <span aria-hidden="true" className="text-crimson-400">
                ▲{openConflicts}
              </span>
              <span className="sr-only">, {openConflicts} conflicts you haven&apos;t settled</span>
            </>
          )}
        </button>
        {mode === "TEAM" && (
          <button
            type="button"
            onClick={() => togglePanel("chat")}
            aria-expanded={panel === "chat"}
            className="btn btn-sm shrink-0 border-ink-600 !px-2.5 text-bone-100 hover:border-amber-500 sm:!px-3.5"
          >
            Chat
            {unread > 0 && (
              <>
                <span aria-hidden="true" className="bg-amber-500 px-1.5 text-ink-950">
                  {unread}
                </span>
                <span className="sr-only">, {unread} unread messages</span>
              </>
            )}
          </button>
        )}
        <div className="hidden sm:block">
          <SettingsMenu />
        </div>
        <div className="relative">
          <button type="button" className="px-2 py-2 text-steel-300 hover:text-bone-100" aria-label="Case menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            ⋮
          </button>
          {menu && (
            <ul className="panel absolute right-0 top-full z-50 mt-1 w-60 py-1 shadow-2xl" role="menu">
              {mode === "TEAM" && game.code && (
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-4 py-2.5 text-left text-sm hover:bg-ink-800"
                    onClick={() => {
                      navigator.clipboard?.writeText(`${location.origin}/play/${game.code}`);
                      setToast("Invite link copied.");
                      setMenu(false);
                    }}
                  >
                    Copy invite link
                  </button>
                </li>
              )}
              {phase === "RESOLVED" && (
                <li>
                  <button type="button" role="menuitem" className="block w-full px-4 py-2.5 text-left text-sm hover:bg-ink-800" onClick={() => setReviewing(false)}>
                    Back to the resolution
                  </button>
                </li>
              )}
              <li>
                <Link role="menuitem" href={`/cases/${meta.id}`} className="block px-4 py-2.5 text-sm hover:bg-ink-800">
                  Replay case introduction
                </Link>
              </li>
              <li>
                <Link role="menuitem" href="/archive" className="block px-4 py-2.5 text-sm hover:bg-ink-800">
                  Exit to archive
                </Link>
              </li>
              {restart && (
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      if (confirm(`Restart Case ${meta.number}? Your board, notes and discoveries on this device will be cleared.`)) {
                        restart();
                        setReviewing(false);
                      }
                      setMenu(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-crimson-400 hover:bg-ink-800"
                  >
                    Restart case
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </header>

      {phase === "RESOLVED" && (
        <div className="flex items-center justify-between gap-3 border-b border-ink-700 bg-ink-900 px-4 py-2 text-sm">
          <span className="text-bone-100/75">Case closed — you&apos;re reviewing a read-only copy.</span>
          <button type="button" className="label hover:text-bone-100" onClick={() => setReviewing(false)}>
            Back to the resolution →
          </button>
        </div>
      )}

      <main id="main" className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          {view === "board" && <Board onOpen={setOpenId} onToast={setToast} />}
          {view === "timeline" && <TimelineView onOpen={setOpenId} />}
          {view === "map" && <MapView locations={game.locations} routes={game.routes} evidence={evidence} onOpen={setOpenId} />}
          {view === "people" && <PeopleView key={peopleOpen ?? "all"} onOpen={setOpenId} start={peopleOpen} />}
          {view === "theories" && <TheoriesView onOpen={setOpenId} onToVerdict={() => setView("verdict")} />}
          {view === "verdict" && <VerdictView onOpen={setOpenId} />}
        </div>

        <Desk
          open={panel === "desk"}
          tab={deskTab}
          setTab={setDeskTab}
          onClose={() => setPanel(null)}
          onOpen={setOpenId}
          onCompare={(a, b) => {
            setCompareWith(b);
            setOpenId(a);
          }}
          onFound={(ids, message) => {
            setFresh(ids);
            setToast(message);
          }}
        />
        {mode === "TEAM" && <ChatPanel open={panel === "chat"} onClose={() => setPanel(null)} onOpen={setOpenId} />}

        <AnimatePresence>
          {stuck && (
            <motion.div
              className="absolute inset-x-0 top-0 z-50 flex justify-center px-4"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              role="dialog"
              aria-label="What to do next"
            >
              <div className="paper torn mt-3 w-full max-w-lg px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="label-ink">Next step</p>
                  <button type="button" className="label-ink hover:text-crimson-600" onClick={() => setStuck(false)} aria-label="Close">
                    ✕
                  </button>
                </div>
                <p className="font-display mt-2 text-2xl leading-tight text-[#1d1a14]">{hint.step}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#1d1a14]/75">{hint.why}</p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {hint.cta && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={followHint}>
                      {hint.cta} →
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm border-[#1d1a14]/40 text-[#1d1a14]"
                    onClick={() => {
                      setStuck(false);
                      setDeskTab("oracle");
                      setPanel("desk");
                    }}
                  >
                    Ask ORACLE instead
                  </button>
                </div>
                <p className="mt-4 border-t border-[#1d1a14]/20 pt-3 text-[12px] text-[#1d1a14]/60">
                  This only knows what you have found. It will never tell you who did it.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4" aria-live="polite">
          <AnimatePresence>
            {toast && (
              <motion.div
                className="paper pointer-events-auto max-w-xl px-5 py-3 font-mono text-xs text-[#1d1a14]"
                initial={{ opacity: 0, y: 20, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {view !== "verdict" && <EvidenceTray onOpen={setOpenId} fresh={fresh} />}

      <EvidenceViewer
        openId={openId}
        onOpen={setOpenId}
        onClose={() => {
          setOpenId(null);
          setCompareWith(null);
        }}
        onPinToBoard={pinToBoard}
        compareWith={compareWith}
      />
    </div>
  );
}

const subscribeSecond = (cb: () => void) => {
  const t = setInterval(cb, 1000);
  return () => clearInterval(t);
};
const nowSecond = () => Math.floor(Date.now() / 1000);

/** Countdown against the case's time budget. Rendered client-side only (no SSR clock skew). */
function Clock({ startedAt, budgetMin, endedAt }: { startedAt: number; budgetMin: number; endedAt: number | null }) {
  const now = useSyncExternalStore(subscribeSecond, nowSecond, () => null);
  const at = endedAt ?? (now === null ? null : now * 1000);
  const elapsed = at === null ? 0 : Math.max(0, Math.floor((at - startedAt) / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  // Running long costs a few points of the Time score and nothing else, so the clock counts
  // up and reports the estimate beside it. It used to count down into a red "Overtime",
  // which rushed the player out of an investigation that was never on a deadline.
  const over = elapsed > budgetMin * 60;
  return (
    <div
      className="hidden shrink-0 text-right md:block"
      role="timer"
      aria-label={
        at === null ? "Time on the case" : `${mm} minutes ${ss} seconds on the case, estimated ${budgetMin} minutes`
      }
    >
      <p className="label !text-[9px]">On the case</p>
      <p className={`font-mono text-sm tabular-nums ${over ? "text-amber-300" : "text-bone-100/90"}`}>
        {at === null ? "--:--" : `${mm}:${ss}`}
        <span className="ml-1 text-[11px] text-steel-400">/ {budgetMin}m</span>
      </p>
    </div>
  );
}

export function Loading({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-steel-300">
        <span className="animate-pulse">{text}</span>
      </p>
    </div>
  );
}
