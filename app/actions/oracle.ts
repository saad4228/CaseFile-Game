"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { requireBundle } from "@/lib/game-engine/cases.server";
import { buildPlayView, sanitizeLocal } from "@/lib/game-engine/engine.server";
import { actionError } from "@/lib/http";
import { askOracle, type OracleAnswer } from "@/lib/oracle/oracle.server";
import { rateLimit } from "@/lib/rate-limit";
import { oracleContext } from "@/lib/sessions/service.server";
import { headers } from "next/headers";
import type { LocalClaims } from "./local";

type Res = ({ ok: true } & OracleAnswer) | { error: string };

const clean = (q: unknown) => String(q ?? "").replace(/\s+/g, " ").trim().slice(0, 400);

export async function oracleSessionAction(sessionId: string, question: string): Promise<Res> {
  try {
    const q = clean(question);
    if (!q) return { error: "Ask ORACLE something." };
    const user = await getCurrentUser();
    if (!user) return { error: "Sign in first." };
    await rateLimit(`oracle:${user.id}`, 20, 60);
    const ctx = await oracleContext(String(sessionId), user);
    return { ok: true, ...askOracle(ctx.bundle, ctx.evidence, ctx.conflicts, q) };
  } catch (e) {
    return actionError(e);
  }
}

export async function oracleLocalAction(caseId: string, claims: LocalClaims, question: string): Promise<Res> {
  try {
    const q = clean(question);
    if (!q) return { error: "Ask ORACLE something." };
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    await rateLimit(`oracle-local:${ip}`, 20, 60);
    const bundle = requireBundle(String(caseId));
    const { have, actions } = sanitizeLocal(bundle, claims?.discovered, claims?.interviews);
    const play = buildPlayView(bundle, { visible: have, followed: [], actions });
    return { ok: true, ...askOracle(bundle, play.evidence, play.conflicts, q) };
  } catch (e) {
    return actionError(e);
  }
}
