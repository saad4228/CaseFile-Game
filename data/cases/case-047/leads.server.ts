import "server-only";
import type { ConflictId, EvidenceId, LeadId } from "@/lib/game-engine/types";

export interface Lead {
  id: LeadId;
  label: string;
  detail: string;
  /** Lead becomes available when the player has discovered these. */
  requires: EvidenceId[];
  /** "all" (default) or "any" of `requires`. */
  mode?: "all" | "any";
  unlocks: EvidenceId[];
}

export const leads: Lead[] = [
  {
    id: "L-01",
    label: "Trace the unregistered number",
    detail: "Ask the carrier for everything it holds on +1 555 0143.",
    requires: ["E-004"],
    unlocks: ["E-016"],
  },
  {
    id: "L-02",
    label: "Request garage footage, level P2",
    detail: "The garage runs its own cameras, separate from the hotel's.",
    requires: ["E-012", "E-014"],
    mode: "any",
    unlocks: ["E-017"],
  },
  {
    id: "L-03",
    label: "Request the raw lock-server export",
    detail: "Go to the lock vendor directly instead of through hotel management.",
    requires: ["E-005", "E-013"],
    unlocks: ["E-018"],
  },
  {
    id: "L-04",
    label: "Obtain the staff keycard register",
    detail: "Find out who holds each staff card.",
    requires: ["E-018"],
    unlocks: ["E-019"],
  },
  {
    id: "L-05",
    label: "Identify console BW-ADM-02",
    detail: "Ask the hotel's IT contractor for the asset register.",
    requires: ["E-013"],
    unlocks: ["E-020"],
  },
  {
    id: "L-06",
    label: "Pull room-service and minibar records for 314",
    detail: "Kitchen tickets and a housekeeping inventory of the room.",
    requires: ["E-003"],
    unlocks: ["E-021", "E-022"],
  },
  {
    id: "L-07",
    label: "Request a full toxicology panel",
    detail: "The examiner recommended it. The lab needs a day.",
    requires: ["E-002"],
    unlocks: ["E-023"],
  },
  {
    id: "L-08",
    label: "Look for a local source of aconitine",
    detail: "Monkshood is a garden plant. Someone grows it.",
    requires: ["E-023"],
    unlocks: ["E-024"],
  },
  {
    id: "L-09",
    label: "Request the mailbox on +1 555 0143",
    detail: "The number had voicemail enabled.",
    requires: ["E-016"],
    unlocks: ["E-025"],
  },
  {
    id: "L-10",
    label: "Request Daniel's handset location history",
    detail: "Where has his phone been since 23:47?",
    requires: ["E-004"],
    unlocks: ["E-026"],
  },
  {
    id: "L-11",
    label: "Check the staff car park gate",
    detail: "Staff park behind the hotel, under a permit barrier.",
    requires: ["E-008"],
    unlocks: ["E-027"],
  },
  {
    id: "L-12",
    label: "Subpoena Reed Media's accounts",
    detail: "“H.H. pays for quiet.” Follow the money.",
    requires: ["E-010"],
    unlocks: ["E-028"],
  },
  {
    id: "L-13",
    label: "Search the corporate registry for HH Consulting",
    detail: "Who is behind the company paying Reed Media?",
    requires: ["E-028"],
    unlocks: ["E-029"],
  },
  {
    id: "L-14",
    label: "Verify Marcus Reed's alibi at the Mercury Bar",
    detail: "Bartender, till, booth camera.",
    requires: ["E-007"],
    unlocks: ["E-030"],
  },
];

export interface Conflict {
  id: ConflictId;
  number: number;
  a: EvidenceId;
  b: EvidenceId;
  prompt: string;
}

// Neutral prompts. They name what disagrees, never what it means.
export const conflicts: Conflict[] = [
  { id: "C-01", number: 1, a: "E-006", b: "E-012", prompt: "A statement and a door log disagree about a departure time." },
  { id: "C-02", number: 2, a: "E-006", b: "E-004", prompt: "A statement and phone records disagree about contact with the victim." },
  { id: "C-03", number: 3, a: "E-007", b: "E-004", prompt: "A statement and phone records disagree about contact on the night." },
  { id: "C-04", number: 4, a: "E-009", b: "E-014", prompt: "A statement and a plate read disagree about whereabouts." },
  { id: "C-05", number: 5, a: "E-008", b: "E-013", prompt: "A statement and a vendor ticket disagree about a camera outage." },
  { id: "C-06", number: 6, a: "E-005", b: "E-018", prompt: "Two access records for Room 314 do not match." },
  { id: "C-07", number: 7, a: "E-008", b: "E-018", prompt: "A statement and a lock record disagree about Room 314." },
  { id: "C-08", number: 8, a: "E-008", b: "E-027", prompt: "A statement and a gate log disagree about whereabouts after 23:00." },
  { id: "C-09", number: 9, a: "E-022", b: "E-023", prompt: "An inventory and a lab report disagree about a drink." },
];
