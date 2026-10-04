"use client";

import { createContext, useContext } from "react";
import type { PersonalOp, PersonalState, SharedOp, SharedState } from "@/lib/game-engine/state";
import type {
  CaseMeta,
  ConflictView,
  Evidence,
  InterviewView,
  LeadView,
  Location,
  Role,
  Route,
  Suspect,
  VerdictOptions,
} from "@/lib/game-engine/types";
import type { MessageView, PlayerView, ResultView } from "@/lib/sessions/types";

export type GameMode = "LOCAL" | "SOLO" | "TEAM";
export type Result<T = object> = ({ ok: true } & T) | { ok?: false; error: string };

/** The static, public parts of a case every client needs. */
export interface CasePublic {
  meta: CaseMeta;
  suspects: Suspect[];
  locations: Location[];
  routes: Route[];
  verdictOptions: VerdictOptions;
}

export interface GameApi extends CasePublic {
  mode: GameMode;
  sessionId: string | null;
  code: string | null;
  me: { userId: string | null; codename: string; roles: Role[]; isHost: boolean; isGuest: boolean };
  players: PlayerView[];
  phase: "LOBBY" | "ACTIVE" | "RESOLVED";
  startedAt: number;
  budgetMin: number;

  shared: SharedState;
  personal: PersonalState;
  evidence: Evidence[];
  holders: Record<string, "team" | "me">;
  leads: LeadView[];
  followed: { id: string; label: string; by?: string }[];
  conflicts: ConflictView[];
  interviews: Record<string, InterviewView>;
  messages: MessageView[];
  result: ResultView | null;
  connection: "online" | "syncing" | "offline";

  dispatch: (op: SharedOp) => void;
  dispatchPersonal: (op: PersonalOp) => void;
  /** Follow a lead; returns the records it turned up (now on file for the player). */
  followLead: (leadId: string) => Promise<Result<{ found: { id: string; title: string }[] }>>;
  interview: (suspectId: string, kind: "ASK" | "PRESENT", ref: string) => Promise<Result<{ unlocks: string[] }>>;
  share: (ids: string[]) => Promise<Result>;
  sendMessage: (body: string) => Promise<Result>;
  react: (messageId: number, emoji: string) => Promise<Result>;
  pin: (messageId: number) => Promise<Result>;
  submitVerdict: () => Promise<Result>;
  askOracle: (question: string) => Promise<Result<{ text: string; refs: string[]; source: "search" | "claude" }>>;
  restart?: () => void;
  /** Team rooms only, before the investigation starts. */
  lobby?: {
    setRole: (role: Role | null) => Promise<Result>;
    setReady: (ready: boolean) => Promise<Result>;
    start: () => Promise<Result>;
    leave: () => Promise<Result>;
  };
  newId: () => string;
}

export const GameContext = createContext<GameApi | null>(null);

export function useGame(): GameApi {
  const g = useContext(GameContext);
  if (!g) throw new Error("useGame outside a game provider");
  return g;
}

let counter = 0;
export const makeId = (prefix = "x") =>
  `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
