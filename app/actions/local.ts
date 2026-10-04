"use server";

import { requireBundle } from "@/lib/game-engine/cases.server";
import { buildPlayView, followLead, interviewAct, sanitizeLocal } from "@/lib/game-engine/engine.server";
import { normalizeShared } from "@/lib/game-engine/state";
import type { InterviewAction, PlayView } from "@/lib/game-engine/types";
import { actionError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { buildResolution } from "@/lib/scoring/resolution.server";
import { scoreVerdict } from "@/lib/scoring/score.server";
import type { ResultView } from "@/lib/sessions/types";
import { headers } from "next/headers";

// Single-device ("demo") mode: the browser keeps the state; every call re-derives what the
// player could legitimately have reached, so hidden records and the truth stay server-side.

export interface LocalClaims {
  discovered: string[];
  interviews: InterviewAction[];
}

export interface LocalSnapshot {
  play: PlayView;
  discovered: string[];
  interviews: InterviewAction[];
  followed: string[];
}

const ip = async () => (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

function snapshot(caseId: string, claims: LocalClaims): LocalSnapshot {
  const bundle = requireBundle(caseId);
  const { have, actions, followed } = sanitizeLocal(bundle, claims?.discovered, claims?.interviews);
  return {
    play: buildPlayView(bundle, { visible: have, followed: [...followed].map((id) => ({ id })), actions }),
    discovered: [...have],
    interviews: actions,
    followed: [...followed],
  };
}

export async function localRestore(caseId: string, claims: LocalClaims) {
  try {
    return { ok: true as const, ...snapshot(String(caseId), claims) };
  } catch (e) {
    return actionError(e);
  }
}

export async function localFollowLead(caseId: string, leadId: string, claims: LocalClaims) {
  try {
    await rateLimit(`local-lead:${await ip()}`, 120, 60);
    const bundle = requireBundle(String(caseId));
    const { have, followed } = sanitizeLocal(bundle, claims?.discovered, claims?.interviews);
    const found = followLead(bundle, String(leadId), have, followed, have);
    const next = snapshot(caseId, { discovered: [...have, ...found], interviews: claims?.interviews ?? [] });
    return { ok: true as const, found, ...next, followed: [...new Set([...next.followed, String(leadId)])] };
  } catch (e) {
    return actionError(e);
  }
}

export async function localInterview(
  caseId: string,
  suspectId: string,
  kind: "ASK" | "PRESENT",
  ref: string,
  claims: LocalClaims,
) {
  try {
    await rateLimit(`local-interview:${await ip()}`, 240, 60);
    const bundle = requireBundle(String(caseId));
    const { have, actions } = sanitizeLocal(bundle, claims?.discovered, claims?.interviews);
    const { action, unlocks } = interviewAct(bundle, String(suspectId), { kind, ref: String(ref) }, have, actions, have);
    const next = snapshot(caseId, { discovered: [...have, ...unlocks], interviews: [...actions, action] });
    return { ok: true as const, unlocks, ...next };
  } catch (e) {
    return actionError(e);
  }
}

export async function localVerdict(
  caseId: string,
  claims: LocalClaims & { shared: unknown; startedAt: number; followed: string[] },
): Promise<{ ok: true; result: ResultView } | { error: string }> {
  try {
    await rateLimit(`local-verdict:${await ip()}`, 20, 60);
    const bundle = requireBundle(String(caseId));
    const { have, followed } = sanitizeLocal(bundle, claims?.discovered, claims?.interviews);
    const shared = normalizeShared(claims?.shared);
    if (!shared.verdict.who || !shared.verdict.how) return { error: "Name who and how before you file." };
    const durationSec = Math.max(60, Math.round((Date.now() - Number(claims?.startedAt || Date.now())) / 1000));
    const interviewUnlocks = new Set(
      Object.values(bundle.interviews).flatMap((s) => s.reactions.flatMap((r) => r.unlocks ?? [])).filter((id) => have.has(id)),
    );
    const score = scoreVerdict(bundle, {
      shared,
      discovered: have,
      followedLeads: [...followed],
      interviewUnlocks,
      durationSec,
      budgetMin: 50,
      mode: "LOCAL",
    });
    return { ok: true, result: buildResolution(bundle, shared.verdict, score, have, new Date(), "You") };
  } catch (e) {
    return actionError(e);
  }
}
