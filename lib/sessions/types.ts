// Client-safe shapes for live sessions. Nothing here carries hidden case data; the
// ResultView only exists once a verdict has been filed.

import type { PersonalState, SharedState } from "@/lib/game-engine/state";
import type { Evidence, InkDetail, PhotoScene, PlayView, Role, VerdictField } from "@/lib/game-engine/types";
import type { ScoreResult } from "@/lib/scoring/types";

export const ROLES: Role[] = ["DETECTIVE", "ANALYST", "FORENSICS", "CYBER", "FIELD"];

export const ROLE_INFO: Record<Role, { title: string; brief: string }> = {
  DETECTIVE: { title: "Detective", brief: "Statements and the incident report." },
  ANALYST: { title: "Analyst", brief: "Documents, notes and paper trails." },
  FORENSICS: { title: "Forensics", brief: "The body, the room and the lab." },
  CYBER: { title: "Cyber", brief: "Phones, logs and digital records." },
  FIELD: { title: "Field Investigator", brief: "Cameras, doors and vehicles." },
};

export type SessionMode = "SOLO" | "TEAM";
export type SessionPhase = "LOBBY" | "ACTIVE" | "RESOLVED";

export interface PlayerView {
  userId: string;
  codename: string;
  roles: Role[];
  isHost: boolean;
  ready: boolean;
  online: boolean;
  privateCount: number;
}

export interface MessageRef {
  id: string;
  number: number;
  title: string | null;
  /** "team" = everyone can open it; "private" = only its holder. */
  access: "team" | "mine" | "private" | "unknown";
  holder?: string;
}

export interface MessageView {
  id: number;
  userId: string | null;
  codename: string;
  kind: "TEXT" | "SYSTEM";
  body: string;
  refs: MessageRef[];
  pinned: boolean;
  reactions: { emoji: string; count: number; mine: boolean }[];
  createdAt: number;
}

export interface ResultView {
  caseId: string;
  number: string;
  title: string;
  filedAt: number;
  filedBy: string;
  score: ScoreResult;
  given: Record<VerdictField, { id: string; label: string } | null>;
  truth: {
    answers: Record<VerdictField, { id: string; label: string }>;
    summary: Record<VerdictField, string>;
    sequence: { time: string; scene: PhotoScene; caption: string; detail?: InkDetail }[];
    conflicts: { id: string; number: number; prompt: string; explanation: string; implicates: string }[];
    redHerrings: { suspect: string; name: string; looksLike: string; actually: string }[];
    /** What each person was actually holding back, and why — revealed only after the verdict. */
    hiding: { suspect: string; name: string; role: string; secrets: string[]; whyTheyLie: string | null }[];
    falsified: { id: string; number: number; title: string; filed: string; actual: string }[];
    missedKey: { id: string; number: number; title: string }[];
    metaClue: { symbol: string; teaser: string; nextCase: string };
  };
}

export interface SessionView {
  id: string;
  code: string;
  caseId: string;
  mode: SessionMode;
  phase: SessionPhase;
  version: number;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  budgetMin: number;
  me: { userId: string; codename: string; roles: Role[]; isHost: boolean; isGuest: boolean };
  players: PlayerView[];
  shared: SharedState;
  personal: PersonalState;
  play: Omit<PlayView, "evidence"> & { evidenceIds: string[] };
  /** Full records the client asked for (it already holds the rest). */
  evidence: Evidence[];
  messages: MessageView[];
  result: ResultView | null;
}

export interface SyncResponse {
  changed: boolean;
  version: number;
  players: PlayerView[];
  view?: SessionView;
}
