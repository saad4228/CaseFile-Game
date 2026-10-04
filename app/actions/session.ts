"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, startSession, type CurrentUser } from "@/lib/auth/session";
import { createGuest } from "@/lib/auth/users";
import { hasDatabase } from "@/lib/env";
import type { Role } from "@/lib/game-engine/types";
import { actionError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import {
  createSession,
  followLeadInSession,
  interviewInSession,
  joinSession,
  leaveLobby,
  pinMessage,
  postMessage,
  reactToMessage,
  setLobbyRole,
  setReady,
  shareEvidence,
  startTeamSession,
  submitVerdict,
} from "@/lib/sessions/service.server";
import { ROLES } from "@/lib/sessions/types";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok?: false; error: string };

/** The signed-in user, or a fresh guest so nobody has to register to play. */
async function userOrGuest(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (current) return current;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  await rateLimit(`guest:${ip}`, 30, 3600);
  const guest = await createGuest();
  await startSession(guest.id);
  return { id: guest.id, codename: guest.codename, email: null, isGuest: true, isAdmin: false, image: null };
}

async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error("Not signed in");
  return u;
}

const str = (v: unknown, max = 64) => (typeof v === "string" ? v.slice(0, max) : "");

/** Begin a solo investigation (form action). Falls back to the device-only demo without a database. */
export async function startSoloAction(form: FormData) {
  const caseId = str(form.get("caseId"), 8);
  if (!hasDatabase()) redirect(`/investigation/${caseId}`);
  let code: string;
  try {
    const user = await userOrGuest();
    code = (await createSession(user, caseId, "SOLO")).code;
  } catch (e) {
    const err = actionError(e);
    redirect(`/cases/${caseId}?error=${encodeURIComponent(err.error)}`);
  }
  redirect(`/play/${code}`);
}

/** Open a team room (form action). */
export async function createRoomAction(form: FormData) {
  const caseId = str(form.get("caseId"), 8) || "047";
  if (!hasDatabase()) redirect("/rooms/new");
  let code: string;
  try {
    const user = await userOrGuest();
    code = (await createSession(user, caseId, "TEAM")).code;
  } catch (e) {
    const err = actionError(e);
    redirect(`/rooms/new?error=${encodeURIComponent(err.error)}`);
  }
  redirect(`/play/${code}`);
}

export async function joinRoomAction(form: FormData) {
  const code = str(form.get("code"), 8).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!hasDatabase()) redirect("/rooms/new");
  try {
    const user = await userOrGuest();
    await joinSession(code, user);
  } catch (e) {
    const err = actionError(e);
    redirect(`/rooms/new?error=${encodeURIComponent(err.error)}&code=${code}`);
  }
  redirect(`/play/${code}`);
}

export async function setRoleAction(sessionId: string, role: string | null): Promise<ActionResult> {
  try {
    if (role && !(ROLES as string[]).includes(role)) return { error: "Unknown role." };
    await setLobbyRole(str(sessionId), await requireUser(), role as Role | null);
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function readyAction(sessionId: string, ready: boolean): Promise<ActionResult> {
  try {
    await setReady(str(sessionId), await requireUser(), Boolean(ready));
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function leaveAction(sessionId: string): Promise<ActionResult> {
  try {
    await leaveLobby(str(sessionId), await requireUser());
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function startTeamAction(sessionId: string): Promise<ActionResult> {
  try {
    await startTeamSession(str(sessionId), await requireUser());
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function followLeadAction(
  sessionId: string,
  leadId: string,
): Promise<ActionResult<{ found: { id: string; title: string }[] }>> {
  try {
    const { found } = await followLeadInSession(str(sessionId), await requireUser(), str(leadId, 12));
    return { ok: true, found };
  } catch (e) {
    return actionError(e);
  }
}

export async function shareAction(sessionId: string, evidenceIds: string[]): Promise<ActionResult<{ shared: string[] }>> {
  try {
    const ids = (Array.isArray(evidenceIds) ? evidenceIds : []).map((x) => str(x, 8)).slice(0, 50);
    const { shared } = await shareEvidence(str(sessionId), await requireUser(), ids);
    return { ok: true, shared };
  } catch (e) {
    return actionError(e);
  }
}

export async function interviewSessionAction(
  sessionId: string,
  suspectId: string,
  kind: "ASK" | "PRESENT",
  ref: string,
): Promise<ActionResult<{ unlocks: string[] }>> {
  try {
    if (kind !== "ASK" && kind !== "PRESENT") return { error: "Unknown action." };
    const { unlocks } = await interviewInSession(str(sessionId), await requireUser(), str(suspectId, 32), {
      kind,
      ref: str(ref, 32),
    });
    return { ok: true, unlocks };
  } catch (e) {
    return actionError(e);
  }
}

export async function messageAction(sessionId: string, body: string): Promise<ActionResult> {
  try {
    await postMessage(str(sessionId), await requireUser(), str(body, 2000));
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function reactAction(sessionId: string, messageId: number, emoji: string): Promise<ActionResult> {
  try {
    await reactToMessage(str(sessionId), await requireUser(), Number(messageId), str(emoji, 4));
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function pinAction(sessionId: string, messageId: number): Promise<ActionResult> {
  try {
    await pinMessage(str(sessionId), await requireUser(), Number(messageId));
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function verdictAction(sessionId: string): Promise<ActionResult<{ final: number; rank: string; solved: boolean }>> {
  try {
    const r = await submitVerdict(str(sessionId), await requireUser());
    return { ok: true, ...r };
  } catch (e) {
    return actionError(e);
  }
}
