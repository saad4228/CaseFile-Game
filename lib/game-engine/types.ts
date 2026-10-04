// Shared, client-safe types for the CASEFILE game engine.
// Nothing in this file describes a solution; truth types live in truth.ts (server-only).

export type CaseId = string;
export type EvidenceId = string;
export type SuspectId = string;
export type LocationId = string;
export type LeadId = string;
export type ConflictId = string;

export type Reliability =
  | "VERIFIED"
  | "LIKELY"
  | "UNVERIFIED"
  | "DISPUTED"
  | "CORRUPTED"
  | "FABRICATED";

export type EvidenceCategory =
  | "CCTV"
  | "PHONE"
  | "MESSAGES"
  | "BANK"
  | "HOTEL"
  | "PHOTO"
  | "AUDIO"
  | "DOCUMENT"
  | "INTERVIEW"
  | "LOCATION"
  | "FORENSIC"
  | "NEWS"
  | "DIGITAL";

export type Role = "DETECTIVE" | "ANALYST" | "FORENSICS" | "CYBER" | "FIELD";

/** A row in a log-style record: call logs, access logs, gate logs. */
export interface LogRow {
  time: string;
  cells: string[];
}

/** The typed body of an evidence item — how it renders in the inspection view. */
export type EvidenceBody =
  | { kind: "statement"; speaker: string; takenAt: string; quotes: string[] }
  | { kind: "document"; heading?: string; lines: string[]; footer?: string }
  | { kind: "handwritten"; lines: string[] }
  | { kind: "log"; columns: string[]; rows: LogRow[]; note?: string }
  | { kind: "photo"; scene: PhotoScene; caption: string; inFrame: string[] }
  | { kind: "audio"; duration: string; transcript: string[]; note?: string }
  | { kind: "messages"; thread: { from: string; time: string; text: string }[] };

/** Which original illustration a photo evidence item renders. */
export type PhotoScene =
  | "room-desk"
  | "lobby"
  | "garage"
  | "garage-plate"
  | "bar"
  | "conservatory";

export interface Evidence {
  id: EvidenceId;
  number: number;
  title: string;
  category: EvidenceCategory;
  source: string;
  /** "23:43" style, or null when the record has no single timestamp. */
  time: string | null;
  location: LocationId | null;
  /** Reliability as filed by the source — not necessarily the truth. */
  reliability: Reliability;
  summary: string;
  body: EvidenceBody;
  suspects: SuspectId[];
  locations: LocationId[];
  related: EvidenceId[];
  /** Which multiplayer role holds this item at the start (asymmetric information). */
  role: Role;
}

export interface Statement {
  topic: string;
  quote: string;
}

export interface Suspect {
  id: SuspectId;
  code: string;
  name: string;
  age: number | null;
  role: string;
  relation: string;
  summary: string;
  statements: Statement[];
  portrait: PortraitSpec;
}

/** Drives the original SVG portrait silhouette for a suspect. */
export interface PortraitSpec {
  hair: "short" | "long" | "bun" | "swept" | "none";
  collar: "coat" | "suit" | "turtleneck" | "blouse" | "hood";
  hat?: boolean;
  glasses?: boolean;
  unknown?: boolean;
}

export interface Location {
  id: LocationId;
  name: string;
  district: string;
  description: string;
  /** Position on the illustrated map, 0–100 on each axis. */
  x: number;
  y: number;
}

export interface Route {
  from: LocationId;
  to: LocationId;
  minutes: number;
  mode: "walk" | "drive";
}

export interface IntroBeat {
  lines: string[];
  emphasis?: "title" | "whisper" | "alarm";
  hold?: number;
}

export interface CaseMeta {
  id: CaseId;
  number: string;
  title: string;
  logline: string;
  classification: "RESTRICTED" | "CONFIDENTIAL" | "CLASSIFIED";
  status: "UNSOLVED" | "ACTIVE" | "SOLVED" | "SEALED";
  difficulty: 1 | 2 | 3 | 4 | 5;
  players: string;
  estTime: string;
  playable: boolean;
  date: string;
  time: string;
  setting: string;
  victim: { name: string; age: number; occupation: string; bio: string };
  objective: string;
  brief: string[];
  intro: IntroBeat[];
  counts: { suspects: number; evidence: number };
}

/** A lead as the client sees it: a label and nothing about what it unlocks. */
export interface LeadView {
  id: LeadId;
  label: string;
  detail: string;
}

/** A conflict as the client sees it: two record ids and a neutral prompt. */
export interface ConflictView {
  id: ConflictId;
  number: number;
  a: EvidenceId;
  b: EvidenceId;
  prompt: string;
}

export type ConflictMark = "contradiction" | "explained" | "ignored";

export type EdgeKind =
  | "SUPPORTS"
  | "CONTRADICTS"
  | "CAUSES"
  | "ASSOCIATED_WITH"
  | "OCCURRED_BEFORE"
  | "OCCURRED_AFTER"
  | "DISPROVES"
  | "SUSPECTED";
