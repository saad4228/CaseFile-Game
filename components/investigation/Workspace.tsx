"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { pursueLead, restoreInvestigation, type InvestigationSnapshot } from "@/app/actions/investigation";
import { EvidenceTray } from "@/components/evidence/EvidenceTray";
import { EvidenceViewer } from "@/components/evidence/EvidenceViewer";
import { evidenceCode } from "@/components/evidence/format";
import { PeopleView } from "@/components/suspects/PeopleView";
import { TimelineView } from "@/components/timeline/TimelineView";
import type { CaseMeta, Location, Route, Suspect } from "@/lib/game-engine/types";
import { Desk } from "./Desk";
import { MapView } from "./MapView";
import { boardSlot, InvestigationProvider, useInvestigation, type InvestigationState } from "./store";

const Board = dynamic(() => import("@/components/board/Board").then((m) => m.Board), {
  ssr: false,
  loading: () => <Loading text="Accessing archive…" />,
});

type View = "board" | "timeline" | "map" | "people";

interface Props {
  meta: CaseMeta;
  suspects: Suspect[];
  locations: Location[];
  routes: Route[];
  brief: string[];
  initial: InvestigationSnapshot;
}

export function Workspace(props: Props) {
  const [data, setData] = useState<InvestigationSnapshot>(props.initial);
  const [syncError, setSyncError] = useState(false);

  const restore = useCallback(
    async (s: InvestigationState) => {
      if (s.discovered.length === props.brief.length) return;
      try {
        setSyncError(false);
        setData(await restoreInvestigation(props.meta.id, s.discovered));
      } catch {
        setSyncError(true);
      }
    },
    [props.meta.id, props.brief.length],
  );

  return (
    <InvestigationProvider caseId={props.meta.id} brief={props.brief} onHydrated={restore}>
      <WorkspaceInner {...props} data={data} setData={setData} syncError={syncError} retry={restore} />
    </InvestigationProvider>
  );
}

function WorkspaceInner({
  meta,
  suspects,
  locations,
  routes,
  brief,
  initial,
  data,
  setData,
  syncError,
  retry,
}: Props & {
  data: InvestigationSnapshot;
  setData: (d: InvestigationSnapshot) => void;
  syncError: boolean;
  retry: (s: InvestigationState) => void;
}) {
  const { state, dispatch } = useInvestigation();
  const [view, setView] = useState<View>("board");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compareWith, setCompareWith] = useState<string | null>(null);
  const [deskOpen, setDeskOpen] = useState(false);
  const [deskTab, setDeskTab] = useState<"leads" | "conflicts">("leads");
  const [pending, setPending] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);

  const evidence = [...data.evidence].sort((a, b) => a.number - b.number);
  const openConflicts = data.conflicts.filter((c) => !state.conflictMarks[c.id]).length;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const follow = async (leadId: string) => {
    setPending(leadId);
    try {
      const res = await pursueLead(meta.id, leadId, state.discovered);
      dispatch({ type: "discover", ids: res.found, lead: leadId });
      setData(res);
      setFresh(res.found);
      const titles = res.evidence.filter((e) => res.found.includes(e.id)).map((e) => `${evidenceCode(e.number)} ${e.title}`);
      setToast(titles.length ? `New record${titles.length > 1 ? "s" : ""} · ${titles.join(" · ")}` : "Nothing new turned up.");
    } catch {
      setToast("Archive connection lost. Evidence synchronization failed — try again.");
    } finally {
      setPending(null);
    }
  };

  const pinToBoard = (id: string) => {
    dispatch({
      type: "boardAdd",
      node: { id: `n-${Date.now().toString(36)}`, kind: "evidence", ref: id, ...boardSlot(state.board.nodes.length) },
    });
    setToast("Pinned to the board.");
  };

  const restart = () => {
    if (!confirm("Restart Case 047? Your board, notes and discoveries on this device will be cleared.")) return;
    dispatch({ type: "reset", brief });
    setData(initial);
    setMenu(false);
  };

  const views: { id: View; label: string }[] = [
    { id: "board", label: "Board" },
    { id: "timeline", label: "Timeline" },
    { id: "map", label: "Map" },
    { id: "people", label: "People" },
  ];

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-ink-950">
      {/* command bar */}
      <header className="relative z-30 flex items-center gap-3 border-b border-ink-700 bg-ink-950 px-3 md:gap-6 md:px-5">
        <Link href="/archive" className="hidden font-display text-lg tracking-[0.08em] md:block" aria-label="CASEFILE archive">
          CASEFILE
        </Link>
        <div className="min-w-0 py-2.5">
          <p className="label !text-[9px]">Case {meta.number}</p>
          <p className="font-display hidden truncate text-lg leading-tight sm:block">{meta.title}</p>
        </div>
        <nav className="scrollbar-thin mx-auto flex overflow-x-auto" aria-label="Workspace views">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
              className={`shrink-0 border-b-2 px-3 py-4 font-mono text-[11px] uppercase tracking-[0.2em] md:px-4 ${
                view === v.id ? "border-amber-500 text-bone-100" : "border-transparent text-steel-400 hover:text-bone-100"
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <Elapsed startedAt={state.startedAt} />
        <button
          type="button"
          onClick={() => {
            setDeskOpen((o) => !o);
          }}
          aria-expanded={deskOpen}
          className="btn btn-sm shrink-0 border-ink-600 !px-2.5 text-bone-100 hover:border-amber-500 sm:!px-3.5"
        >
          Desk
          {data.leads.length > 0 && <span className="text-amber-300">{data.leads.length}</span>}
          {openConflicts > 0 && <span className="text-crimson-400">▲{openConflicts}</span>}
        </button>
        <div className="relative">
          <button type="button" className="px-2 py-2 text-steel-300 hover:text-bone-100" aria-label="Case menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            ⋮
          </button>
          {menu && (
            <ul className="panel absolute right-0 top-full z-40 mt-1 w-56 py-1 shadow-2xl">
              <li>
                <Link href="/archive" className="block px-4 py-2.5 text-sm hover:bg-ink-800">
                  Exit to archive
                </Link>
              </li>
              <li>
                <Link href={`/cases/${meta.id}`} className="block px-4 py-2.5 text-sm hover:bg-ink-800">
                  Replay case introduction
                </Link>
              </li>
              <li>
                <button type="button" onClick={restart} className="block w-full px-4 py-2.5 text-left text-sm text-crimson-400 hover:bg-ink-800">
                  Restart case
                </button>
              </li>
            </ul>
          )}
        </div>
      </header>

      {/* workspace */}
      <main className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          {view === "board" && <Board evidence={evidence} suspects={suspects} onOpen={setOpenId} />}
          {view === "timeline" && <TimelineView evidence={evidence} onOpen={setOpenId} />}
          {view === "map" && <MapView locations={locations} routes={routes} evidence={evidence} onOpen={setOpenId} />}
          {view === "people" && <PeopleView suspects={suspects} evidence={evidence} onOpen={setOpenId} />}
        </div>

        <Desk
          open={deskOpen}
          tab={deskTab}
          setTab={setDeskTab}
          onClose={() => setDeskOpen(false)}
          leads={data.leads}
          conflicts={data.conflicts}
          evidence={evidence}
          pending={pending}
          onFollow={follow}
          onOpen={setOpenId}
          onCompare={(a, b) => {
            setCompareWith(b);
            setOpenId(a);
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4" aria-live="polite">
          <AnimatePresence>
            {(toast || syncError) && (
              <motion.div
                className="paper pointer-events-auto max-w-xl px-5 py-3 font-mono text-xs text-[#1d1a14]"
                initial={{ opacity: 0, y: 20, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {syncError ? (
                  <span>
                    ARCHIVE CONNECTION LOST — evidence synchronization failed.{" "}
                    <button type="button" className="underline" onClick={() => retry(state)}>
                      Retry
                    </button>
                  </span>
                ) : (
                  toast
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <EvidenceTray evidence={evidence} onOpen={setOpenId} fresh={fresh} />

      <EvidenceViewer
        list={evidence}
        openId={openId}
        onOpen={setOpenId}
        onClose={() => {
          setOpenId(null);
          setCompareWith(null);
        }}
        suspects={suspects}
        locations={locations}
        onPinToBoard={pinToBoard}
        compareWith={compareWith}
      />
    </div>
  );
}

function Elapsed({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const fmt = `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className="hidden text-right lg:block">
      <p className="label !text-[9px]">Elapsed</p>
      <p className="font-mono text-sm tabular-nums text-bone-100/90">{fmt}</p>
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
