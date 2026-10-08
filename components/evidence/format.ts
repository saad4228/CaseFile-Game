import type { EvidenceCategory, Reliability } from "@/lib/game-engine/types";

export const categoryLabel: Record<EvidenceCategory, string> = {
  CCTV: "CCTV",
  PHONE: "Phone",
  MESSAGES: "Messages",
  BANK: "Bank",
  HOTEL: "Hotel records",
  PHOTO: "Photograph",
  AUDIO: "Audio",
  DOCUMENT: "Document",
  INTERVIEW: "Interview",
  LOCATION: "Location data",
  FORENSIC: "Forensic",
  NEWS: "News",
  DIGITAL: "Digital",
};

/** Reliability is always shown as text; the border style is a second, non-colour cue. */
export const reliabilityStyle: Record<Reliability, string> = {
  VERIFIED: "border-solid text-[#3d5a3a]",
  LIKELY: "border-solid text-[#4f4636]",
  UNVERIFIED: "border-dashed text-[#4f4636]",
  DISPUTED: "border-dashed text-crimson-600",
  CORRUPTED: "border-dotted text-[#4f4636]",
  FABRICATED: "border-double text-crimson-600",
};

/**
 * What a reliability stamp actually means, in plain words. The stamp is the source's own
 * claim about its record, not the truth — a reader new to case files has no reason to know
 * that "unverified" is an invitation rather than a warning.
 */
export const reliabilityPlain: Record<Reliability, string> = {
  VERIFIED: "Checked and confirmed by the people who filed it.",
  LIKELY: "Probably right, but nobody has confirmed it.",
  UNVERIFIED: "Nobody has checked this. It may still be wrong.",
  DISPUTED: "Someone has said this is wrong.",
  CORRUPTED: "Damaged or incomplete — parts are missing.",
  FABRICATED: "Known to have been made up.",
};

export const evidenceCode = (n: number) => `#${String(n).padStart(3, "0")}`;
