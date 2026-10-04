"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localFollowLead, localInterview, localRestore, localVerdict, type LocalSnapshot } from "@/app/actions/local";
import { oracleLocalAction } from "@/app/actions/oracle";
import {
  applyPersonal,
  applyShared,
  initialPersonal,
  initialShared,
  normalizePersonal,
  normalizeShared,
  type PersonalOp,
  type PersonalState,
  type SharedOp,
  type SharedState,
} from "@/lib/game-engine/state";
import type { InterviewAction, PlayView } from "@/lib/game-engine/types";
import type { ResultView } from "@/lib/sessions/types";
import { GameContext, makeId, type CasePublic, type GameApi } from "./GameContext";

// Single-device driver: state lives in this browser. Every discovery goes through a
// server action that re-derives what is legitimately reachable.

interface Saved {
  v: 2;
  startedAt: number;
  shared: SharedState;
  personal: PersonalState;
  discovered: string[];
  interviews: InterviewAction[];
  followed: string[];
  result: ResultView | null;
}

const key = (caseId: string) => `casefile:${caseId}:v2`;

function fresh(brief: string[]): Saved {
  return {
    v: 2,
    startedAt: Date.now(),
    shared: initialShared(),
    personal: initialPersonal(),
    discovered: brief,
    interviews: [],
    followed: [],
    result: null,
  };
}

/** Read saved progress, migrating the first build's format if present. */
function load(caseId: string, brief: string[]): Saved {
  try {
    const raw = localStorage.getItem(key(caseId));
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.v === 2) {
        return { ...fresh(brief), ...p, shared: normalizeShared(p.shared), personal: normalizePersonal(p.personal) };
      }
    }
    const old = localStorage.getItem(`casefile:${caseId}:v1`);
    if (old) {
      const o = JSON.parse(old);
      const shared = normalizeShared({ board: o.board, timeline: o.timeline, conflictMarks: o.conflictMarks });
      return {
        ...fresh(brief),
        startedAt: o.startedAt ?? Date.now(),
        shared,
        personal: normalizePersonal({ seen: o.seen, notes: o.notes }),
        discovered: Array.isArray(o.discovered) ? o.discovered : brief,
        followed: Array.isArray(o.followedLeads) ? o.followedLeads : [],
      };
    }
  } catch {
    /* corrupted or unavailable storage: start fresh */
  }
  return fresh(brief);
}

export function LocalGame({
  pub,
  brief,
  initialPlay,
  children,
}: {
  pub: CasePublic;
  brief: string[];
  initialPlay: PlayView;
  children: React.ReactNode;
}) {
  const caseId = pub.meta.id;
  const [saved, setSaved] = useState<Saved>(() => load(caseId, brief));
  const [play, setPlay] = useState<PlayView>(initialPlay);
  const [connection, setConnection] = useState<GameApi["connection"]>("online");
  const savedRef = useRef(saved);

  useEffect(() => {
    savedRef.current = saved;
    try {
      localStorage.setItem(key(caseId), JSON.stringify(saved));
    } catch {
      /* storage full or blocked: play continues without saving */
    }
  }, [caseId, saved]);

  const absorb = useCallback((snap: LocalSnapshot & { followed?: string[] }) => {
    setPlay(snap.play);
    setSaved((s) => ({
      ...s,
      discovered: snap.discovered,
      interviews: snap.interviews,
      followed: snap.followed ?? s.followed,
    }));
  }, []);

  // Re-derive the view on load when progress exists beyond the brief.
  useEffect(() => {
    const s = savedRef.current;
    if (s.discovered.length === brief.length && s.interviews.length === 0) return;
    let alive = true;
    setConnection("syncing");
    localRestore(caseId, { discovered: s.discovered, interviews: s.interviews }).then((r) => {
      if (!alive) return;
      if ("ok" in r && r.ok) {
        absorb(r);
        setConnection("online");
      } else setConnection("offline");
    });
    return () => {
      alive = false;
    };
  }, [caseId, brief.length, absorb]);

  const claims = () => ({ discovered: savedRef.current.discovered, interviews: savedRef.current.interviews });

  const api: GameApi = useMemo(
    () => ({
      ...pub,
      mode: "LOCAL",
      sessionId: null,
      code: null,
      me: { userId: null, codename: "You", roles: ["DETECTIVE", "ANALYST", "FORENSICS", "CYBER", "FIELD"], isHost: true, isGuest: true },
      players: [],
      phase: saved.result ? "RESOLVED" : "ACTIVE",
      startedAt: saved.startedAt,
      budgetMin: 50,
      shared: saved.shared,
      personal: saved.personal,
      evidence: play.evidence,
      holders: play.holders,
      leads: play.leads,
      followed: play.followed,
      conflicts: play.conflicts,
      interviews: play.interviews,
      messages: [],
      result: saved.result,
      connection,
      dispatch: (op: SharedOp) => setSaved((s) => (s.result ? s : { ...s, shared: applyShared(s.shared, op) })),
      dispatchPersonal: (op: PersonalOp) => setSaved((s) => ({ ...s, personal: applyPersonal(s.personal, op) })),
      followLead: async (leadId) => {
        const r = await localFollowLead(caseId, leadId, claims());
        if (!("ok" in r) || !r.ok) return { error: "error" in r ? r.error : "Something went wrong." };
        absorb(r);
        return { ok: true, found: r.found };
      },
      interview: async (suspectId, kind, ref) => {
        const r = await localInterview(caseId, suspectId, kind, ref, claims());
        if (!("ok" in r) || !r.ok) return { error: "error" in r ? r.error : "Something went wrong." };
        absorb(r);
        return { ok: true, unlocks: r.unlocks };
      },
      share: async () => ({ ok: true }),
      sendMessage: async () => ({ error: "Team chat needs a team room." }),
      react: async () => ({ ok: true }),
      pin: async () => ({ ok: true }),
      submitVerdict: async () => {
        const s = savedRef.current;
        const r = await localVerdict(caseId, { ...claims(), shared: s.shared, startedAt: s.startedAt, followed: s.followed });
        if (!("ok" in r)) return { error: r.error };
        setSaved((x) => ({ ...x, result: r.result }));
        return { ok: true };
      },
      askOracle: async (question) => {
        const r = await oracleLocalAction(caseId, claims(), question);
        return "ok" in r ? r : { error: r.error };
      },
      restart: () => {
        setSaved(fresh(brief));
        setPlay(initialPlay);
      },
      newId: () => makeId("n"),
    }),
    [pub, saved, play, connection, caseId, absorb, brief, initialPlay],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}
