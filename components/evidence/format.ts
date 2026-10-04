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

export const evidenceCode = (n: number) => `#${String(n).padStart(3, "0")}`;

/** "23:46:13" or "23:46" → minutes since 22:00, wrapping past midnight. */
export function minutesFrom22(time: string): number | null {
  const m = time.match(/^(\d{2}):(\d{2})/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 12) h += 24;
  return (h - 22) * 60 + min;
}

export const formatMinutes = (mins: number) => {
  const total = (22 * 60 + Math.round(mins)) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
