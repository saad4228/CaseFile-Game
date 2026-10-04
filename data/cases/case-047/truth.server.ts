import "server-only";
import type {
  ConflictId,
  InkDetail,
  EdgeKind,
  EvidenceId,
  LeadId,
  PhotoScene,
  ProofSlot,
  Reliability,
  SuspectId,
  VerdictField,
} from "@/lib/game-engine/types";

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  SPOILERS. The solution to Case 047. Server-only: never serialize to the │
// │  client except inside the post-verdict resolution.                        │
// └──────────────────────────────────────────────────────────────────────────┘

export interface SuspectProfile {
  truthfulness: number; // 0–1
  fear: number;
  motive: number;
  knowledge: number;
  confidence: number;
  alibiStrength: number;
  relationship: string;
  secrets: string[];
  whyTheyLie: string | null;
}

/** A meaningful connection between two board items (evidence id or "suspect:<id>"). */
export interface Relation {
  a: string;
  b: string;
  /** Edge kinds that correctly describe a → b (temporal kinds are direction-aware). */
  kinds: EdgeKind[];
  /** "conflict" relations make SUPPORTS wrong; "support" relations make CONTRADICTS wrong. */
  nature: "conflict" | "support" | "clears";
}

const conflict = (a: string, b: string): Relation => ({ a, b, kinds: ["CONTRADICTS", "DISPROVES"], nature: "conflict" });
const support = (a: string, b: string, extra: EdgeKind[] = []): Relation => ({
  a,
  b,
  kinds: ["SUPPORTS", "ASSOCIATED_WITH", ...extra],
  nature: "support",
});
const clears = (evidence: string, suspect: string): Relation => ({
  a: evidence,
  b: `suspect:${suspect}`,
  kinds: ["DISPROVES", "CONTRADICTS"],
  nature: "clears",
});
const implicates = (evidence: string): Relation => ({
  a: evidence,
  b: "suspect:elena_cross",
  kinds: ["SUSPECTED", "SUPPORTS", "ASSOCIATED_WITH"],
  nature: "support",
});

export const truth = {
  /** The correct answer for each verdict question. */
  answers: {
    who: "elena_cross",
    how: "poison",
    when: "w3",
    where: "room314",
    why: "archive",
  } as Record<VerdictField, string>,
  /** Partly-right answers earn some credit (fraction of that question's points). */
  partial: {
    when: { w2: 0.4, w4: 0.4 },
    why: { phone: 0.25, source: 0.25 },
  } as Partial<Record<VerdictField, Record<string, number>>>,

  culprit: "elena_cross" as SuspectId,
  summary: {
    who: "Elena Cross, General Manager of the Blackwood Hotel.",
    how: "Aconitine — from monkshood she grows in the rooftop conservatory — in a complimentary whisky on a turndown tray.",
    when: "She served the drink at 23:41. Daniel died at about 23:47.",
    where: "Room 314.",
    why: "The original Case 019 evidence boxes are stored in sub-basement B2, leased by a Halden Holdings company. Elena is their keeper. Daniel had found the archive.",
  },

  /** What actually happened, in order. Revealed as comic panels after the verdict. */
  sequence: [
    { time: "22:41", scene: "lobby" as PhotoScene, caption: "Sarah Vale arrives. At 22:47 Daniel gives her a drive: copies of the original Case 019 evidence log, for Noah." },
    { time: "22:53", scene: "bar" as PhotoScene, caption: "Marcus Reed calls Daniel and tells him to stop. Halden money has been slowing the series since August." },
    { time: "23:12", scene: "garage-plate" as PhotoScene, caption: "Noah Grant drives into the garage and texts Daniel from a burner: he's on P2." },
    { time: "23:29", scene: "room-desk" as PhotoScene, detail: "console" as InkDetail, caption: "From her office console, Elena Cross switches off the third-floor camera." },
    { time: "23:35", scene: "conservatory" as PhotoScene, detail: "glass" as InkDetail, caption: "She signs out a turndown tray “from management”: a chocolate and a whisky laced with aconitine from her own monkshood." },
    { time: "23:41", scene: "room-desk" as PhotoScene, detail: "keycard" as InkDetail, caption: "Her master card opens 314 past the Do Not Disturb. She apologises for the camera. Daniel accepts the drink." },
    { time: "23:41", scene: "garage" as PhotoScene, caption: "Two floors down, Sarah has handed Noah the drive and is walking to the Calder Street door." },
    { time: "23:46", scene: "room-desk" as PhotoScene, detail: "door" as InkDetail, caption: "The poison works fast. Elena lets herself back in — two-tone chime. Daniel calls the last number that texted him. Seven seconds: “Shh. Give it to me, Daniel.”" },
    { time: "23:47", scene: "room-desk" as PhotoScene, detail: "window" as InkDetail, caption: "Daniel Mercer dies. She swaps the tumbler for a clean one, wiped of prints, and takes the tray, his phone, and the top sheet of his notepad." },
    { time: "23:49", scene: "garage" as PhotoScene, detail: "stairs" as InkDetail, caption: "Service Stair B. At 23:52 the camera comes back on. At 23:55 her car leaves the staff car park." },
    { time: "23:58", scene: "conservatory" as PhotoScene, detail: "river" as InkDetail, caption: "Daniel's phone goes into the Vesper from the River District embankment." },
    { time: "01:06", scene: "lobby" as PhotoScene, detail: "printout" as InkDetail, caption: "Called back to the hotel, she prints the police a door report — filtered to hide her own card." },
  ],

  /** Records filed with the wrong reliability, and what they really are. */
  evidenceTruth: {
    "E-005": "FABRICATED",
    "E-006": "DISPUTED",
    "E-007": "DISPUTED",
    "E-008": "FABRICATED",
    "E-009": "DISPUTED",
    "E-034": "DISPUTED",
  } as Partial<Record<EvidenceId, Reliability>>,

  /** Every surfaced conflict is a genuine contradiction; some point away from the culprit. */
  conflictTruth: {
    "C-01": { genuine: true, implicates: "sarah_vale", explanation: "Sarah lied to hide that she met Noah on P2. She was in the garage, not upstairs." },
    "C-02": { genuine: true, implicates: "sarah_vale", explanation: "Sarah and Daniel were working on Case 019 together again." },
    "C-03": { genuine: true, implicates: "marcus_reed", explanation: "Marcus called at 22:53 to warn Daniel off — he was being paid to delay the story." },
    "C-04": { genuine: true, implicates: "noah_grant", explanation: "Noah left his phone in Lakemoor and drove down with a burner. He was afraid of J." },
    "C-05": { genuine: true, implicates: "elena_cross", explanation: "The camera was switched off from Elena's own console." },
    "C-06": { genuine: true, implicates: "elena_cross", explanation: "The hotel printout was filtered by hand to remove master-card entries." },
    "C-07": { genuine: true, implicates: "elena_cross", explanation: "MGR-01 opened Room 314 at 23:41 and again at 23:46." },
    "C-08": { genuine: true, implicates: "elena_cross", explanation: "Elena left the hotel at 23:55, towards the River District." },
    "C-09": { genuine: true, implicates: "elena_cross", explanation: "The whisky came from outside the room — the turndown tray." },
    "C-10": { genuine: true, implicates: "elena_cross", explanation: "She says she never went back. The lock opened for her card again at 23:46, the moment of the voicemail." },
    "C-11": { genuine: true, implicates: "elena_cross", explanation: "She says she left the tray. No tray was found: she took it back, with the poisoned glass." },
  } as Record<ConflictId, { genuine: boolean; implicates: SuspectId; explanation: string }>,

  /** Evidence that matters to the solution (Evidence score). */
  keyEvidence: [
    "E-013", "E-017", "E-018", "E-019", "E-020", "E-021", "E-022", "E-023",
    "E-024", "E-025", "E-026", "E-027", "E-029", "E-034",
  ] as EvidenceId[],

  /** Leads that move the investigation towards the truth (Efficiency score). */
  relevantLeads: ["L-01", "L-02", "L-03", "L-04", "L-05", "L-06", "L-07", "L-08", "L-09", "L-10", "L-11", "L-13"] as LeadId[],

  /** Accepted proof per verdict slot: proven with at least `min` items from `accepted`. */
  proof: {
    motive: { min: 2, accepted: ["E-010", "E-029", "E-028", "E-032", "E-033"] },
    opportunity: { min: 2, accepted: ["E-018", "E-019", "E-013", "E-020", "E-021", "E-034"] },
    means: { min: 2, accepted: ["E-023", "E-024", "E-021", "E-022", "E-034"] },
    timeline: { min: 2, accepted: ["E-018", "E-025", "E-026", "E-027", "E-017", "E-012", "E-034", "E-013"] },
    identity: { min: 2, accepted: ["E-025", "E-019", "E-018", "E-020", "E-034"] },
  } as Record<ProofSlot, { min: number; accepted: EvidenceId[] }>,
  /** Records that, offered as proof *for* the solution, show a misreading (cost points). */
  misleadingProof: ["E-015"] as EvidenceId[],

  /** Correct board connections (Logic score). */
  relations: [
    conflict("E-006", "E-012"),
    conflict("E-006", "E-004"),
    conflict("E-007", "E-004"),
    conflict("E-009", "E-014"),
    conflict("E-008", "E-013"),
    conflict("E-005", "E-018"),
    conflict("E-008", "E-018"),
    conflict("E-008", "E-027"),
    conflict("E-022", "E-023"),
    conflict("E-034", "E-018"),
    conflict("E-034", "E-022"),
    conflict("E-009", "E-015"),
    conflict("E-006", "E-011"),
    support("E-018", "E-019"),
    support("E-013", "E-020"),
    support("E-023", "E-024", ["CAUSES"]),
    support("E-021", "E-022"),
    support("E-021", "E-023", ["CAUSES"]),
    support("E-025", "E-019"),
    support("E-025", "E-018"),
    support("E-026", "E-027"),
    support("E-016", "E-014"),
    support("E-016", "E-025"),
    support("E-017", "E-012"),
    support("E-017", "E-014"),
    support("E-028", "E-029"),
    support("E-029", "E-010"),
    support("E-030", "E-007"),
    support("E-021", "E-034"),
    { a: "E-011", b: "E-012", kinds: ["OCCURRED_BEFORE"], nature: "support" },
    { a: "E-021", b: "E-018", kinds: ["OCCURRED_BEFORE", "CAUSES"], nature: "support" },
    { a: "E-018", b: "E-027", kinds: ["OCCURRED_BEFORE"], nature: "support" },
    { a: "E-027", b: "E-026", kinds: ["OCCURRED_BEFORE"], nature: "support" },
    clears("E-017", "sarah_vale"),
    clears("E-017", "noah_grant"),
    clears("E-030", "marcus_reed"),
    clears("E-031", "sarah_vale"),
    implicates("E-018"),
    implicates("E-019"),
    implicates("E-020"),
    implicates("E-024"),
    implicates("E-027"),
    implicates("E-034"),
    implicates("E-013"),
    implicates("E-029"),
  ] as Relation[],

  redHerrings: [
    {
      suspect: "sarah_vale",
      looksLike: "Lied about when she left, and exited at 23:43 — minutes before the death.",
      actually: "She was on P2 with Noah until 23:41, four minutes from the third floor, and left by the garage door. She lied to protect him.",
    },
    {
      suspect: "marcus_reed",
      looksLike: "$160,000 from a shell company and a lie about calling Daniel.",
      actually: "He was being paid to slow the story, and sat in the Mercury Bar from 23:05 to 23:50. The money leads to Halden Holdings — and the archive.",
    },
    {
      suspect: "noah_grant",
      looksLike: "A false alibi, a burner phone, and Daniel's last call.",
      actually: "He collected the Case 019 copy from Sarah and was through the garage barrier at 23:45. His burner's mailbox recorded the killer's voice.",
    },
  ],

  suspects: {
    sarah_vale: {
      truthfulness: 0.45, fear: 0.6, motive: 0.2, knowledge: 0.7, confidence: 0.65, alibiStrength: 0.8,
      relationship: "Former partner, working with Daniel again in secret",
      secrets: ["Met Daniel at the bar", "Gave Noah a USB copy of the Case 019 files on P2", "Spoke to Daniel 14 times in two weeks"],
      whyTheyLie: "Protecting Noah, Daniel's source.",
    },
    marcus_reed: {
      truthfulness: 0.4, fear: 0.7, motive: 0.8, knowledge: 0.5, confidence: 0.8, alibiStrength: 0.9,
      relationship: "Employer",
      secrets: ["Paid $40,000 a month by HH Consulting", "Called Daniel at 22:53 to warn him off", "Met a Halden go-between at the Mercury Bar"],
      whyTheyLie: "The payments would end his career.",
    },
    elena_cross: {
      truthfulness: 0.15, fear: 0.5, motive: 0.95, knowledge: 0.9, confidence: 0.9, alibiStrength: 0.2,
      relationship: "Hotel manager; keeper of the B2 archive",
      secrets: ["Disabled camera 3F-East", "Entered 314 twice with MGR-01", "Grows monkshood on the roof", "Filtered the access report", "Threw Daniel's phone in the river"],
      whyTheyLie: "She killed him.",
    },
    noah_grant: {
      truthfulness: 0.5, fear: 0.9, motive: 0.05, knowledge: 0.6, confidence: 0.3, alibiStrength: 0.85,
      relationship: "Closest friend; Daniel's source on Case 019",
      secrets: ["Drove down with a Lakemoor burner", "Collected the drive on P2", "Received Daniel's last call and hasn't listened to it"],
      whyTheyLie: "Afraid of J.",
    },
    j: {
      truthfulness: 0, fear: 0, motive: 0.6, knowledge: 1, confidence: 1, alibiStrength: 0,
      relationship: "Unknown",
      secrets: ["Behind Halden Holdings", "Wears the circle-and-line signet ring (E-030)"],
      whyTheyLie: null,
    },
  } as Record<SuspectId, SuspectProfile>,

  /** The quiet link to the next case. */
  metaClue: {
    symbol: "a circle cut by a single vertical line",
    seenIn: "E-030",
    nextCase: "052",
    teaser: "Case 052 — The Missing Witness. A witness disappears the night before she testifies. Her last visitor wore a signet ring.",
  },
};
