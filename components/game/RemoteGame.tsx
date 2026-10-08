"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  followLeadAction,
  interviewSessionAction,
  leaveAction,
  messageAction,
  pinAction,
  reactAction,
  readyAction,
  setRoleAction,
  shareAction,
  startTeamAction,
  verdictAction,
  type ActionResult,
} from "@/app/actions/session";
import { oracleSessionAction } from "@/app/actions/oracle";
import {
  applyPersonal,
  applyShared,
  type PersonalOp,
  type PersonalState,
  type SharedOp,
  type SharedState,
} from "@/lib/game-engine/state";
import type { Evidence } from "@/lib/game-engine/types";
import type { SessionView, SyncResponse, PlayerView } from "@/lib/sessions/types";
import { GameContext, makeId, type CasePublic, type GameApi } from "./GameContext";

// Server-session driver. Edits apply instantly (optimistically), are sent in small
// batches, and are confirmed by the server's authoritative state. Teammates' changes
// arrive by polling — no websocket service required. All shared ops are idempotent, so
// re-applying an in-flight op on top of a newer server state is harmless.

interface Seq<T> {
  seq: number;
  op: T;
}

interface Confirmed {
  version: number;
  shared: SharedState;
  personal: PersonalState;
}


/** Two rosters are the same when nobody has joined, left, or changed what they are showing. */
function samePlayers(a: PlayerView[], b: PlayerView[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((p, i) => {
    const q = b[i];
    return (
      p.userId === q.userId &&
      p.codename === q.codename &&
      p.online === q.online &&
      p.ready === q.ready &&
      p.isHost === q.isHost &&
      p.privateCount === q.privateCount
    );
  });
}

export function RemoteGame({
  pub,
  initial,
  children,
  onPhaseChange,
}: {
  pub: CasePublic;
  initial: SessionView;
  children: React.ReactNode;
  onPhaseChange?: (view: SessionView) => void;
}) {
  const [view, setView] = useState<SessionView>(initial);
  const [confirmed, setConfirmed] = useState<Confirmed>({
    version: initial.version,
    shared: initial.shared,
    personal: initial.personal,
  });
  const [pendingShared, setPendingShared] = useState<Seq<SharedOp>[]>([]);
  const [pendingPersonal, setPendingPersonal] = useState<Seq<PersonalOp>[]>([]);
  const [connection, setConnection] = useState<GameApi["connection"]>("online");
  const [evidenceCache, setEvidenceCache] = useState<Map<string, Evidence>>(
    () => new Map(initial.evidence.map((e) => [e.id, e])),
  );

  const refs = useRef({
    version: initial.version,
    cacheIds: new Set(initial.evidence.map((e) => e.id)),
    inFlight: false,
    queueShared: [] as Seq<SharedOp>[],
    queuePersonal: [] as Seq<PersonalOp>[],
    seq: 0,
    syncing: false,
    failures: 0,
    opFailures: 0,
    phase: initial.phase,
  });
  const sessionId = initial.id;

  const acceptView = useCallback(
    (v: SessionView) => {
      if (v.version < refs.current.version) return;
      refs.current.version = v.version;
      if (v.evidence.length) {
        for (const e of v.evidence) refs.current.cacheIds.add(e.id);
        setEvidenceCache((m) => {
          const next = new Map(m);
          for (const e of v.evidence) next.set(e.id, e);
          return next;
        });
      }
      setView(v);
      setConfirmed({ version: v.version, shared: v.shared, personal: v.personal });
      if (v.phase !== refs.current.phase) {
        refs.current.phase = v.phase;
        onPhaseChange?.(v);
      }
    },
    [onPhaseChange],
  );

  const sync = useCallback(async () => {
    if (refs.current.syncing) return;
    refs.current.syncing = true;
    try {
      const have = [...refs.current.cacheIds].join(",");
      const res = await fetch(`/api/sessions/${sessionId}/sync?v=${refs.current.version}&have=${have}`, {
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 400) {
        setConnection("offline");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as SyncResponse;
      refs.current.failures = 0;
      setConnection("online");
      if (data.changed && data.view) acceptView(data.view);
      // An unchanged poll used to allocate a new view every time, re-rendering the whole
      // workspace once a second for nothing. Hand back the same object when the roster is
      // the same and React skips the render entirely.
      else setView((v) => (samePlayers(v.players, data.players) ? v : { ...v, players: data.players }));
    } catch {
      refs.current.failures++;
      setConnection(refs.current.failures > 2 ? "offline" : "syncing");
    } finally {
      refs.current.syncing = false;
    }
  }, [sessionId, acceptView]);

  // Polling loop: brisk for teams, relaxed solo, slow when the tab is hidden.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      await sync();
      const hidden = document.visibilityState === "hidden";
      const base = initial.mode === "TEAM" ? 1500 : 6000;
      const backoff = Math.min(30000, base * 2 ** refs.current.failures);
      timer = setTimeout(tick, hidden ? Math.max(15000, backoff) : backoff);
    };
    timer = setTimeout(tick, 800);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sync, initial.mode]);

  // Self-scheduling retries go through a ref so `flush` never captures itself.
  const flushRef = useRef<() => Promise<void>>(async () => {});

  const flush = useCallback(async () => {
    const r = refs.current;
    if (r.inFlight || (!r.queueShared.length && !r.queuePersonal.length)) return;
    r.inFlight = true;
    const shared = r.queueShared.splice(0, 100);
    const personal = r.queuePersonal.splice(0, 100);
    let failed = false;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/ops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shared: shared.map((x) => x.op), personal: personal.map((x) => x.op) }),
      });
      if (res.ok) {
        const data = (await res.json()) as Confirmed;
        if (data.version >= r.version) {
          r.version = data.version;
          setConfirmed(data);
        }
        r.opFailures = 0;
        setConnection("online");
      } else if (res.status >= 500 || res.status === 429 || res.status === 408) {
        // Busy, rate limited or briefly broken. The edits are still perfectly valid, so they
        // go back on the queue and are retried — dropping them here is how a board full of
        // work used to vanish on one unlucky request.
        throw new Error(String(res.status));
      } else {
        // Genuinely refused (stale, invalid, or not allowed): the server's state is the truth.
        void sync();
      }
      // Acknowledged (or refused outright): drop everything up to the last op sent.
      const maxShared = shared.at(-1)?.seq ?? -1;
      const maxPersonal = personal.at(-1)?.seq ?? -1;
      setPendingShared((p) => p.filter((x) => x.seq > maxShared));
      setPendingPersonal((p) => p.filter((x) => x.seq > maxPersonal));
    } catch {
      // Network trouble, or a refusal the edits can survive: put them back and retry.
      r.queueShared.unshift(...shared);
      r.queuePersonal.unshift(...personal);
      r.opFailures++;
      setConnection("syncing");
      failed = true;
    } finally {
      r.inFlight = false;
      // Back off while a rate-limit window drains instead of hammering it open again.
      if (failed) setTimeout(() => flushRef.current(), Math.min(15000, 1000 * 2 ** Math.min(r.opFailures, 4)));
      else if (r.queueShared.length || r.queuePersonal.length) setTimeout(() => flushRef.current(), 50);
    }
  }, [sessionId, sync]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => flush(), 120);
  }, [flush]);

  const dispatch = useCallback(
    (op: SharedOp) => {
      const item = { seq: refs.current.seq++, op };
      refs.current.queueShared.push(item);
      setPendingShared((p) => [...p, item]);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const dispatchPersonal = useCallback(
    (op: PersonalOp) => {
      // Notes are typed character by character; only send the latest edit per record.
      const q = refs.current.queuePersonal;
      if (op.t === "note") {
        const i = q.findIndex((x) => x.op.t === "note" && x.op.id === op.id);
        if (i >= 0) q.splice(i, 1);
      }
      const item = { seq: refs.current.seq++, op };
      q.push(item);
      setPendingPersonal((p) => [...p, item]);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const act = useCallback(
    async <T,>(fn: () => Promise<ActionResult<T>>) => {
      const r = await fn();
      await sync();
      return r;
    },
    [sync],
  );

  const shared = useMemo(
    () => pendingShared.reduce((s, x) => applyShared(s, x.op), confirmed.shared),
    [pendingShared, confirmed.shared],
  );
  const personal = useMemo(
    () => pendingPersonal.reduce((s, x) => applyPersonal(s, x.op), confirmed.personal),
    [pendingPersonal, confirmed.personal],
  );
  const evidence = useMemo(
    () =>
      view.play.evidenceIds
        .map((id) => evidenceCache.get(id))
        .filter((e): e is Evidence => Boolean(e))
        .sort((a, b) => a.number - b.number),
    [view.play.evidenceIds, evidenceCache],
  );

  const api: GameApi = useMemo(
    () => ({
      ...pub,
      mode: view.mode,
      sessionId,
      code: view.code,
      me: view.me,
      players: view.players,
      phase: view.phase,
      startedAt: view.startedAt ?? view.createdAt,
      budgetMin: view.budgetMin,
      shared,
      personal,
      evidence,
      holders: view.play.holders,
      leads: view.play.leads,
      followed: view.play.followed,
      conflicts: view.play.conflicts,
      interviews: view.play.interviews,
      messages: view.messages,
      result: view.result,
      connection,
      dispatch,
      dispatchPersonal,
      followLead: (leadId) => act(() => followLeadAction(sessionId, leadId)),
      interview: (suspectId, kind, ref) => act(() => interviewSessionAction(sessionId, suspectId, kind, ref)),
      share: (ids) => act(() => shareAction(sessionId, ids)),
      sendMessage: (body) => act(() => messageAction(sessionId, body)),
      react: (id, emoji) => act(() => reactAction(sessionId, id, emoji)),
      pin: (id) => act(() => pinAction(sessionId, id)),
      submitVerdict: async () => {
        // Make sure every pending edit has reached the server before filing.
        for (let i = 0; i < 40 && (refs.current.queueShared.length || refs.current.inFlight); i++) {
          await flush();
          await new Promise((r) => setTimeout(r, 100));
        }
        return act(() => verdictAction(sessionId));
      },
      askOracle: async (question) => {
        const r = await oracleSessionAction(sessionId, question);
        return "ok" in r ? r : { error: r.error };
      },
      lobby: {
        setRole: (role) => act(() => setRoleAction(sessionId, role)),
        setReady: (ready) => act(() => readyAction(sessionId, ready)),
        start: () => act(() => startTeamAction(sessionId)),
        leave: () => act(() => leaveAction(sessionId)),
      },
      newId: () => makeId("n"),
    }),
    [pub, view, sessionId, shared, personal, evidence, connection, dispatch, dispatchPersonal, act, flush],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}
