import "server-only";
import { randomInt } from "node:crypto";
import type { CurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/db/generated/client";
import { requireBundle, type CaseBundle } from "@/lib/game-engine/cases.server";
import { buildPlayView, followLead, GameError, interviewAct } from "@/lib/game-engine/engine.server";
import {
  applyPersonal,
  applyShared,
  evidenceRefs,
  initialPersonal,
  initialShared,
  normalizePersonal,
  normalizeShared,
  type PersonalOp,
  type SharedOp,
  type SharedState,
} from "@/lib/game-engine/state";
import type { InterviewAction, Role } from "@/lib/game-engine/types";
import { rateLimit } from "@/lib/rate-limit";
import { buildResolution } from "@/lib/scoring/resolution.server";
import { scoreVerdict } from "@/lib/scoring/score.server";
import type { ScoreResult } from "@/lib/scoring/types";
import { ROLES, type MessageView, type PlayerView, type SessionView, type SyncResponse } from "./types";

export { GameError };

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const MAX_PLAYERS = 4;
const ONLINE_MS = 15_000;
const MESSAGE_LIMIT = 120;
const REACTIONS = ["✓", "?", "!", "✗", "👁"];

type Tx = Prisma.TransactionClient;

const genCode = () => Array.from({ length: 5 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
const parseRoles = (s: string) => s.split(",").filter((r): r is Role => (ROLES as string[]).includes(r));

async function bump(tx: Tx, sessionId: string, data: Prisma.GameSessionUpdateInput = {}) {
  await tx.gameSession.update({
    where: { id: sessionId },
    data: { ...data, version: { increment: 1 }, lastActivityAt: new Date() },
  });
}

/** Run fn with the session row locked, so concurrent changes apply one after another. */
async function withLock<T>(sessionId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db().$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "GameSession" WHERE id = ${sessionId} FOR UPDATE`;
      return fn(tx);
    },
    { timeout: 15_000, maxWait: 10_000 },
  );
}

async function membership(tx: Tx, sessionId: string, userId: string) {
  const session = await tx.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new GameError("That case file doesn't exist.");
  const player = await tx.casePlayer.findUnique({ where: { sessionId_userId: { sessionId, userId } } });
  if (!player) throw new GameError("You're not part of this investigation.");
  return { session, player };
}

async function systemMessage(tx: Tx, sessionId: string, body: string, refs: string[] = []) {
  await tx.message.create({ data: { sessionId, kind: "SYSTEM", body, refs } });
}

async function visibleSets(tx: Tx, sessionId: string, userId: string) {
  const rows = await tx.sessionEvidence.findMany({ where: { sessionId } });
  const all = new Set(rows.map((r) => r.evidenceId));
  const visible = new Set(rows.filter((r) => r.holderId === null || r.holderId === userId).map((r) => r.evidenceId));
  const shared = new Set(rows.filter((r) => r.holderId === null).map((r) => r.evidenceId));
  const mine = new Set(rows.filter((r) => r.holderId === userId).map((r) => r.evidenceId));
  return { rows, all, visible, shared, mine };
}

async function interviewHistory(tx: Tx, sessionId: string): Promise<InterviewAction[]> {
  const rows = await tx.interview.findMany({ where: { sessionId }, orderBy: { id: "asc" } });
  const players = await tx.casePlayer.findMany({ where: { sessionId }, include: { user: true } });
  const names = new Map(players.map((p) => [p.userId, p.user.codename]));
  return rows.map((r) => ({
    suspectId: r.suspectId,
    kind: r.kind as "ASK" | "PRESENT",
    ref: r.ref,
    outcome: r.outcome || undefined,
    by: names.get(r.askedById),
  }));
}

// ─── Creating and joining ────────────────────────────────────────────────────

export async function createSession(user: CurrentUser, caseId: string, mode: "SOLO" | "TEAM") {
  const bundle = requireBundle(caseId);
  const published = await db().caseFile.findUnique({ where: { id: caseId } });
  if (published && !published.published) throw new GameError("That case is closed to the public right now.");
  await rateLimit(`create:${user.id}`, 30, 3600);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode();
    try {
      return await db().$transaction(async (tx) => {
        const session = await tx.gameSession.create({
          data: {
            code,
            caseId,
            mode,
            phase: mode === "SOLO" ? "ACTIVE" : "LOBBY",
            hostId: user.id,
            state: initialShared() as unknown as Prisma.InputJsonValue,
            timeBudgetMin: budgetFor(bundle),
            startedAt: mode === "SOLO" ? new Date() : null,
          },
        });
        await tx.casePlayer.create({
          data: {
            sessionId: session.id,
            userId: user.id,
            isHost: true,
            roles: mode === "SOLO" ? ROLES.join(",") : "",
            personal: initialPersonal() as unknown as Prisma.InputJsonValue,
          },
        });
        if (mode === "SOLO") {
          await tx.sessionEvidence.createMany({
            data: bundle.brief.map((evidenceId) => ({ sessionId: session.id, evidenceId, holderId: null, via: "BRIEF" })),
          });
        } else {
          await systemMessage(tx, session.id, `${user.codename} opened the room.`);
        }
        return { id: session.id, code: session.code };
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") continue; // code collision
      throw e;
    }
  }
  throw new GameError("Couldn't open a room. Try again.");
}

function budgetFor(bundle: CaseBundle) {
  const m = bundle.meta.estTime.match(/(\d+)\D+(\d+)/);
  return m ? Number(m[2]) : 50;
}

export async function findSessionByCode(code: string) {
  return db().gameSession.findUnique({ where: { code: code.toUpperCase() } });
}

export async function joinSession(code: string, user: CurrentUser) {
  const session = await findSessionByCode(code);
  if (!session) throw new GameError("No room with that code.");
  return withLock(session.id, async (tx) => {
    const existing = await tx.casePlayer.findUnique({ where: { sessionId_userId: { sessionId: session.id, userId: user.id } } });
    if (existing) return session.id;
    const s = await tx.gameSession.findUniqueOrThrow({ where: { id: session.id } });
    if (s.mode !== "TEAM") throw new GameError("That investigation is private.");
    if (s.phase === "RESOLVED") throw new GameError("That case is already closed.");
    const count = await tx.casePlayer.count({ where: { sessionId: s.id } });
    if (count >= MAX_PLAYERS) throw new GameError("That room is full.");
    await tx.casePlayer.create({
      data: { sessionId: s.id, userId: user.id, personal: initialPersonal() as unknown as Prisma.InputJsonValue },
    });
    await systemMessage(tx, s.id, `${user.codename} joined the investigation.`);
    if (s.phase === "ACTIVE") {
      // Late arrivals hold no role; they see what the team has shared.
      await systemMessage(tx, s.id, `${user.codename} arrived after the briefing and holds no private records.`);
    }
    await bump(tx, s.id);
    return s.id;
  });
}

export async function leaveLobby(sessionId: string, user: CurrentUser) {
  return withLock(sessionId, async (tx) => {
    const { session, player } = await membership(tx, sessionId, user.id);
    if (session.phase !== "LOBBY") throw new GameError("The investigation has already started.");
    if (player.isHost) throw new GameError("The host can't leave the room.");
    await tx.casePlayer.delete({ where: { id: player.id } });
    await systemMessage(tx, sessionId, `${user.codename} left the room.`);
    await bump(tx, sessionId);
  });
}

export async function setLobbyRole(sessionId: string, user: CurrentUser, role: Role | null) {
  return withLock(sessionId, async (tx) => {
    const { session, player } = await membership(tx, sessionId, user.id);
    if (session.phase !== "LOBBY") throw new GameError("Roles are fixed once the investigation starts.");
    if (role) {
      const others = await tx.casePlayer.findMany({ where: { sessionId, NOT: { id: player.id } } });
      if (others.some((o) => parseRoles(o.roles).includes(role))) throw new GameError("Someone else has that role.");
    }
    await tx.casePlayer.update({ where: { id: player.id }, data: { roles: role ?? "", ready: false } });
    await bump(tx, sessionId);
  });
}

export async function setReady(sessionId: string, user: CurrentUser, ready: boolean) {
  return withLock(sessionId, async (tx) => {
    const { session, player } = await membership(tx, sessionId, user.id);
    if (session.phase !== "LOBBY") return;
    await tx.casePlayer.update({ where: { id: player.id }, data: { ready } });
    await bump(tx, sessionId);
  });
}

/** Host starts the case: unclaimed roles are dealt out, and the brief goes to role holders. */
export async function startTeamSession(sessionId: string, user: CurrentUser) {
  return withLock(sessionId, async (tx) => {
    const { session, player } = await membership(tx, sessionId, user.id);
    if (!player.isHost) throw new GameError("Only the host can start the investigation.");
    if (session.phase !== "LOBBY") throw new GameError("The investigation has already started.");
    const bundle = requireBundle(session.caseId);
    const players = await tx.casePlayer.findMany({ where: { sessionId }, orderBy: { joinedAt: "asc" } });

    const roles = new Map(players.map((p) => [p.id, parseRoles(p.roles)]));
    const claimed = new Set([...roles.values()].flat());
    for (const role of ROLES.filter((r) => !claimed.has(r))) {
      const target = [...roles.entries()].sort((a, b) => a[1].length - b[1].length)[0];
      target[1].push(role);
    }
    const holderOf = new Map<Role, string>();
    for (const p of players) {
      const rs = roles.get(p.id)!;
      for (const r of rs) holderOf.set(r, p.userId);
      await tx.casePlayer.update({ where: { id: p.id }, data: { roles: rs.join(",") } });
    }

    await tx.sessionEvidence.createMany({
      data: bundle.brief.map((evidenceId) => {
        const e = bundle.evidenceById.get(evidenceId)!;
        const common = bundle.common.includes(evidenceId) || players.length === 1;
        return {
          sessionId,
          evidenceId,
          holderId: common ? null : (holderOf.get(e.role) ?? null),
          via: common ? "BRIEF" : "ROLE",
        };
      }),
    });
    await systemMessage(
      tx,
      sessionId,
      "The briefing is over. Each of you holds records nobody else has seen. Share what matters.",
    );
    await bump(tx, sessionId, { phase: "ACTIVE", startedAt: new Date() });
  });
}

// ─── Reading ─────────────────────────────────────────────────────────────────

async function playersView(tx: Tx, sessionId: string, privateRows: { holderId: string | null }[]): Promise<PlayerView[]> {
  const players = await tx.casePlayer.findMany({ where: { sessionId }, include: { user: true }, orderBy: { joinedAt: "asc" } });
  const now = Date.now();
  return players.map((p) => ({
    userId: p.userId,
    codename: p.user.codename,
    roles: parseRoles(p.roles),
    isHost: p.isHost,
    ready: p.ready,
    online: now - p.lastSeenAt.getTime() < ONLINE_MS,
    privateCount: privateRows.filter((r) => r.holderId === p.userId).length,
  }));
}

async function messagesView(
  tx: Tx,
  sessionId: string,
  userId: string,
  bundle: CaseBundle,
  sets: { visible: Set<string>; mine: Set<string>; rows: { evidenceId: string; holderId: string | null }[] },
  names: Map<string, string>,
): Promise<MessageView[]> {
  const rows = await tx.message.findMany({ where: { sessionId }, orderBy: { id: "desc" }, take: MESSAGE_LIMIT });
  return rows.reverse().map((m) => {
    const reactions = (m.reactions ?? {}) as Record<string, string[]>;
    return {
      id: m.id,
      userId: m.userId,
      codename: m.userId ? (names.get(m.userId) ?? "Former member") : "CASEFILE",
      kind: m.kind as "TEXT" | "SYSTEM",
      body: m.body,
      refs: m.refs.map((id) => {
        const e = bundle.evidenceById.get(id);
        const row = sets.rows.find((r) => r.evidenceId === id);
        const access = !row ? "unknown" : row.holderId === null ? "team" : sets.mine.has(id) ? "mine" : "private";
        return {
          id,
          number: e?.number ?? 0,
          title: access === "team" || access === "mine" ? (e?.title ?? null) : null,
          access,
          holder: row?.holderId ? names.get(row.holderId) : undefined,
        };
      }),
      pinned: m.pinned,
      reactions: REACTIONS.filter((r) => reactions[r]?.length).map((r) => ({
        emoji: r,
        count: reactions[r].length,
        mine: reactions[r].includes(userId),
      })),
      createdAt: m.createdAt.getTime(),
    };
  });
}

/**
 * Build one player's view of a session. `have` lists record ids the client already holds
 * in full, so unchanged records aren't sent again.
 */
export async function getSessionView(sessionId: string, user: CurrentUser, have: Set<string> = new Set()): Promise<SessionView> {
  return db().$transaction(async (tx) => {
    const { session, player } = await membership(tx, sessionId, user.id);
    const bundle = requireBundle(session.caseId);
    const sets = await visibleSets(tx, sessionId, user.id);
    const players = await playersView(tx, sessionId, sets.rows.filter((r) => r.holderId !== null));
    const names = new Map(players.map((p) => [p.userId, p.codename]));
    const follows = await tx.leadFollow.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } });
    const history = await interviewHistory(tx, sessionId);

    const play = buildPlayView(bundle, {
      visible: sets.visible,
      discoveredAll: sets.all,
      privateIds: sets.mine,
      followed: follows.map((f) => ({ id: f.leadId, by: names.get(f.byId) })),
      actions: history,
    });

    let result: SessionView["result"] = null;
    if (session.phase === "RESOLVED") {
      const r = await tx.caseResult.findUnique({ where: { sessionId } });
      if (r) {
        const verdictShared = normalizeShared(session.state).verdict;
        const filed = (r.verdict as { filedBy?: string })?.filedBy ?? "";
        result = buildResolution(bundle, verdictShared, r.scores as unknown as ScoreResult, sets.all, r.createdAt, filed);
      }
    }

    const { evidence, ...rest } = play;
    return {
      id: session.id,
      code: session.code,
      caseId: session.caseId,
      mode: session.mode as SessionView["mode"],
      phase: session.phase as SessionView["phase"],
      version: session.version,
      createdAt: session.createdAt.getTime(),
      startedAt: session.startedAt?.getTime() ?? null,
      endedAt: session.endedAt?.getTime() ?? null,
      budgetMin: session.timeBudgetMin,
      me: {
        userId: user.id,
        codename: user.codename,
        roles: parseRoles(player.roles),
        isHost: player.isHost,
        isGuest: user.isGuest,
      },
      players,
      shared: normalizeShared(session.state),
      personal: normalizePersonal(player.personal),
      play: { ...rest, evidenceIds: evidence.map((e) => e.id) },
      evidence: evidence.filter((e) => !have.has(e.id)),
      messages: await messagesView(tx, sessionId, user.id, bundle, sets, names),
      result,
    };
  });
}

/** Cheap poll: always marks presence; only builds a full view when something changed. */
export async function syncSession(sessionId: string, user: CurrentUser, knownVersion: number, have: Set<string>): Promise<SyncResponse> {
  const player = await db().casePlayer.findUnique({ where: { sessionId_userId: { sessionId, userId: user.id } } });
  if (!player) throw new GameError("You're not part of this investigation.");
  if (Date.now() - player.lastSeenAt.getTime() > 4000) {
    await db().casePlayer.update({ where: { id: player.id }, data: { lastSeenAt: new Date() } });
  }
  const session = await db().gameSession.findUniqueOrThrow({ where: { id: sessionId }, select: { version: true } });
  if (session.version === knownVersion) {
    const rows = await db().sessionEvidence.findMany({ where: { sessionId, NOT: { holderId: null } }, select: { holderId: true } });
    const players = await db().$transaction((tx) => playersView(tx, sessionId, rows));
    return { changed: false, version: session.version, players };
  }
  const view = await getSessionView(sessionId, user, have);
  return { changed: true, version: view.version, players: view.players, view };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Apply board/timeline/theory/verdict edits and personal edits. */
export async function applyOps(sessionId: string, user: CurrentUser, sharedOps: SharedOp[], personalOps: PersonalOp[]) {
  await rateLimit(`ops:${user.id}`, 600, 60);
  return withLock(sessionId, async (tx) => {
    const { session, player } = await membership(tx, sessionId, user.id);
    if (session.phase !== "ACTIVE") throw new GameError("This investigation isn't open for changes.");
    const bundle = requireBundle(session.caseId);
    const sets = await visibleSets(tx, sessionId, user.id);
    const suspectIds = new Set(bundle.suspects.map((s) => s.id));
    const conflictIds = new Set(bundle.conflicts.map((c) => c.id));

    let shared: SharedState = normalizeShared(session.state);
    for (const op of sharedOps) {
      // Only shared records can go on team surfaces; private ones must be shared first.
      if (evidenceRefs(op).some((id) => !sets.shared.has(id))) continue;
      if (op.t === "board.add" && op.node.kind === "suspect" && (!op.node.ref || !suspectIds.has(op.node.ref))) continue;
      if (op.t === "conflict.mark" && !conflictIds.has(op.id)) continue;
      if (op.t === "verdict.set" && op.value && !bundle.verdictOptions[op.field].some((o) => o.id === op.value)) continue;
      if (op.t === "theory.add" && op.theory.suspect && !suspectIds.has(op.theory.suspect)) continue;
      shared = applyShared(shared, op);
    }
    let personal = normalizePersonal(player.personal);
    for (const op of personalOps) {
      if (op.t === "seen" && !sets.visible.has(op.id)) continue;
      if (op.t === "note" && !sets.visible.has(op.id)) continue;
      personal = applyPersonal(personal, op);
    }

    if (sharedOps.length) {
      await bump(tx, sessionId, { state: shared as unknown as Prisma.InputJsonValue });
    }
    if (personalOps.length) {
      await tx.casePlayer.update({
        where: { id: player.id },
        data: { personal: personal as unknown as Prisma.InputJsonValue },
      });
    }
    const version = (await tx.gameSession.findUniqueOrThrow({ where: { id: sessionId }, select: { version: true } })).version;
    return { version, shared, personal };
  });
}

export async function followLeadInSession(sessionId: string, user: CurrentUser, leadId: string) {
  await rateLimit(`lead:${user.id}`, 60, 60);
  return withLock(sessionId, async (tx) => {
    const { session } = await membership(tx, sessionId, user.id);
    if (session.phase !== "ACTIVE") throw new GameError("This investigation is closed.");
    const bundle = requireBundle(session.caseId);
    const sets = await visibleSets(tx, sessionId, user.id);
    const follows = await tx.leadFollow.findMany({ where: { sessionId } });
    const found = followLead(bundle, leadId, sets.visible, new Set(follows.map((f) => f.leadId)), sets.all);
    await tx.leadFollow.create({ data: { sessionId, leadId, byId: user.id } });
    const solo = session.mode === "SOLO";
    if (found.length) {
      await tx.sessionEvidence.createMany({
        data: found.map((evidenceId) => ({
          sessionId,
          evidenceId,
          holderId: solo ? null : user.id,
          discoveredById: user.id,
          via: "LEAD",
        })),
        skipDuplicates: true,
      });
    }
    if (!solo) {
      const lead = bundle.leads.find((l) => l.id === leadId)!;
      await systemMessage(
        tx,
        sessionId,
        `${user.codename} followed a lead: “${lead.label}”${found.length ? ` — ${found.length} new record${found.length > 1 ? "s" : ""}, held privately.` : "."}`,
      );
    }
    await bump(tx, sessionId);
    return { found };
  });
}

export async function shareEvidence(sessionId: string, user: CurrentUser, evidenceIds: string[]) {
  return withLock(sessionId, async (tx) => {
    const { session } = await membership(tx, sessionId, user.id);
    if (session.phase !== "ACTIVE") throw new GameError("This investigation is closed.");
    const bundle = requireBundle(session.caseId);
    const rows = await tx.sessionEvidence.findMany({
      where: { sessionId, evidenceId: { in: evidenceIds.slice(0, 50) }, holderId: user.id },
    });
    if (!rows.length) return { shared: [] as string[] };
    await tx.sessionEvidence.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: { holderId: null, sharedAt: new Date() },
    });
    const list = rows
      .map((r) => bundle.evidenceById.get(r.evidenceId)!)
      .sort((a, b) => a.number - b.number)
      .map((e) => `#${String(e.number).padStart(3, "0")}`)
      .join(", ");
    await systemMessage(tx, sessionId, `${user.codename} shared ${list} with the team.`, rows.map((r) => r.evidenceId));
    await bump(tx, sessionId);
    return { shared: rows.map((r) => r.evidenceId) };
  });
}

export async function interviewInSession(
  sessionId: string,
  user: CurrentUser,
  suspectId: string,
  action: { kind: "ASK" | "PRESENT"; ref: string },
) {
  await rateLimit(`interview:${user.id}`, 120, 60);
  return withLock(sessionId, async (tx) => {
    const { session } = await membership(tx, sessionId, user.id);
    if (session.phase !== "ACTIVE") throw new GameError("This investigation is closed.");
    const bundle = requireBundle(session.caseId);
    const sets = await visibleSets(tx, sessionId, user.id);
    const history = await interviewHistory(tx, sessionId);
    const { action: done, unlocks } = interviewAct(bundle, suspectId, action, sets.visible, history, sets.all);
    await tx.interview.create({
      data: { sessionId, suspectId, askedById: user.id, kind: done.kind, ref: done.ref, outcome: done.outcome ?? "" },
    });
    if (unlocks.length) {
      // A revised statement is a police record: the whole team gets it.
      await tx.sessionEvidence.createMany({
        data: unlocks.map((evidenceId) => ({ sessionId, evidenceId, holderId: null, discoveredById: user.id, via: "INTERVIEW" })),
        skipDuplicates: true,
      });
      if (session.mode === "TEAM") {
        const name = bundle.suspects.find((s) => s.id === suspectId)?.name ?? "A suspect";
        await systemMessage(tx, sessionId, `${name} revised their statement under questioning from ${user.codename}.`, unlocks);
      }
    }
    await bump(tx, sessionId);
    return { unlocks };
  });
}

const cleanBody = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 600);

export async function postMessage(sessionId: string, user: CurrentUser, raw: string) {
  await rateLimit(`chat:${user.id}`, 20, 15);
  const body = cleanBody(raw);
  if (!body) return;
  return withLock(sessionId, async (tx) => {
    const { session } = await membership(tx, sessionId, user.id);
    const bundle = requireBundle(session.caseId);
    const refs = Array.from(body.matchAll(/#0*(\d{1,3})\b/g))
      .map((m) => `E-${String(Number(m[1])).padStart(3, "0")}`)
      .filter((id) => bundle.evidenceById.has(id));
    await tx.message.create({ data: { sessionId, userId: user.id, body, refs: Array.from(new Set(refs)).slice(0, 10) } });
    await bump(tx, sessionId);
  });
}

export async function reactToMessage(sessionId: string, user: CurrentUser, messageId: number, emoji: string) {
  if (!REACTIONS.includes(emoji)) throw new GameError("Unknown reaction.");
  return withLock(sessionId, async (tx) => {
    await membership(tx, sessionId, user.id);
    const m = await tx.message.findFirst({ where: { id: messageId, sessionId } });
    if (!m) throw new GameError("Message not found.");
    const reactions = { ...((m.reactions ?? {}) as Record<string, string[]>) };
    const list = new Set(reactions[emoji] ?? []);
    if (list.has(user.id)) list.delete(user.id);
    else list.add(user.id);
    reactions[emoji] = [...list];
    await tx.message.update({ where: { id: m.id }, data: { reactions } });
    await bump(tx, sessionId);
  });
}

export async function pinMessage(sessionId: string, user: CurrentUser, messageId: number) {
  return withLock(sessionId, async (tx) => {
    await membership(tx, sessionId, user.id);
    const m = await tx.message.findFirst({ where: { id: messageId, sessionId } });
    if (!m) throw new GameError("Message not found.");
    await tx.message.update({ where: { id: m.id }, data: { pinned: !m.pinned } });
    await bump(tx, sessionId);
  });
}

/** File the team's verdict: scored on the server, results recorded for every player. */
export async function submitVerdict(sessionId: string, user: CurrentUser) {
  await rateLimit(`verdict:${user.id}`, 10, 60);
  return withLock(sessionId, async (tx) => {
    const { session } = await membership(tx, sessionId, user.id);
    if (session.phase !== "ACTIVE") throw new GameError("This case is already closed.");
    const bundle = requireBundle(session.caseId);
    const shared = normalizeShared(session.state);
    if (!shared.verdict.who || !shared.verdict.how) throw new GameError("Name who and how before you file.");
    const sets = await visibleSets(tx, sessionId, user.id);
    const follows = await tx.leadFollow.findMany({ where: { sessionId } });
    const interviewUnlocks = new Set(sets.rows.filter((r) => r.via === "INTERVIEW").map((r) => r.evidenceId));
    const started = session.startedAt ?? session.createdAt;
    const durationSec = Math.max(1, Math.round((Date.now() - started.getTime()) / 1000));

    const score = scoreVerdict(bundle, {
      shared,
      discovered: sets.shared, // proof and evidence count what the team actually shared
      followedLeads: follows.map((f) => f.leadId),
      interviewUnlocks,
      durationSec,
      budgetMin: session.timeBudgetMin,
      mode: session.mode as "SOLO" | "TEAM",
    });

    await tx.caseResult.create({
      data: {
        sessionId,
        caseId: session.caseId,
        mode: session.mode,
        verdict: { ...shared.verdict, filedBy: user.codename } as unknown as Prisma.InputJsonValue,
        scores: score as unknown as Prisma.InputJsonValue,
        final: score.final,
        rank: score.rank,
        solved: score.solved,
        durationSec,
      },
    });

    const players = await tx.casePlayer.findMany({ where: { sessionId } });
    for (const p of players) {
      const prof = await tx.detectiveProfile.upsert({ where: { userId: p.userId }, create: { userId: p.userId }, update: {} });
      await tx.detectiveProfile.update({
        where: { userId: p.userId },
        data: {
          casesSolved: prof.casesSolved + (score.solved ? 1 : 0),
          casesFailed: prof.casesFailed + (score.solved ? 0 : 1),
          bestScore: Math.max(prof.bestScore, score.final),
          totalScore: prof.totalScore + score.final,
          deductionTotal: prof.deductionTotal + score.scores.deduction,
          evidenceTotal: prof.evidenceTotal + score.scores.evidence,
          logicTotal: prof.logicTotal + score.scores.logic,
          contradictionTotal: prof.contradictionTotal + score.scores.contradictions,
          totalSolveSeconds: prof.totalSolveSeconds + durationSec,
        },
      });
      if (score.achievements.length) {
        await tx.achievement.createMany({
          data: score.achievements.map((key) => ({ userId: p.userId, key, sessionId })),
          skipDuplicates: true,
        });
      }
    }
    await systemMessage(tx, sessionId, `${user.codename} filed the verdict. Case ${bundle.meta.number} is closed.`);
    await bump(tx, sessionId, { phase: "RESOLVED", endedAt: new Date() });
    return { final: score.final, rank: score.rank, solved: score.solved };
  });
}

export interface SessionSummary {
  code: string;
  caseId: string;
  mode: "SOLO" | "TEAM";
  phase: "LOBBY" | "ACTIVE" | "RESOLVED";
  isHost: boolean;
  joinedAt: number;
  endedAt: number | null;
  team: string[];
  result: { rank: string; final: number; solved: boolean; durationSec: number } | null;
}

/** A player's investigations, newest first — only what their own detective file shows. */
export async function listMySessions(userId: string, take = 30): Promise<SessionSummary[]> {
  const rows = await db().casePlayer.findMany({
    where: { userId },
    select: {
      isHost: true,
      joinedAt: true,
      session: {
        select: {
          code: true,
          caseId: true,
          mode: true,
          phase: true,
          endedAt: true,
          result: { select: { rank: true, final: true, solved: true, durationSec: true } },
          players: { select: { user: { select: { codename: true } } }, orderBy: { joinedAt: "asc" } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
    take,
  });
  return rows.map((r) => ({
    code: r.session.code,
    caseId: r.session.caseId,
    mode: r.session.mode as SessionSummary["mode"],
    phase: r.session.phase as SessionSummary["phase"],
    isHost: r.isHost,
    joinedAt: r.joinedAt.getTime(),
    endedAt: r.session.endedAt?.getTime() ?? null,
    team: r.session.players.map((p) => p.user.codename),
    result: r.session.result,
  }));
}

/** What a player can legitimately put in front of ORACLE: their visible records and conflicts. */
export async function oracleContext(sessionId: string, user: CurrentUser) {
  return db().$transaction(async (tx) => {
    const { session } = await membership(tx, sessionId, user.id);
    const bundle = requireBundle(session.caseId);
    const sets = await visibleSets(tx, sessionId, user.id);
    const play = buildPlayView(bundle, { visible: sets.visible, discoveredAll: sets.all, followed: [], actions: [] });
    return { bundle, evidence: play.evidence, conflicts: play.conflicts };
  });
}
