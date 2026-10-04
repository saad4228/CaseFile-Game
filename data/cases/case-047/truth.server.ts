import "server-only";
import type {
  ConflictId,
  EvidenceId,
  Reliability,
  SuspectId,
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

export const truth = {
  culprit: "elena_cross" as SuspectId,
  method: "poison",
  methodDetail:
    "Aconitine from monkshood grown in the rooftop conservatory, in a complimentary whisky on a turndown tray.",
  motive: "protect_archive",
  motiveDetail:
    "The original Case 019 evidence boxes are stored in sub-basement B2 under the hotel by a Halden Holdings company. Elena Cross is their keeper. Daniel had found the archive.",
  window: { from: "23:41", to: "23:47" },
  location: "blackwood_hotel",

  /** What actually happened, in order. Revealed after the verdict. */
  sequence: [
    { time: "22:41", text: "Sarah Vale arrives. She and Daniel talk in the bar; she has a copy of the Case 019 files on a USB drive." },
    { time: "22:53", text: "Marcus Reed calls Daniel and tells him to drop the series. He has been paid by HH Consulting since August to slow it down." },
    { time: "23:12", text: "Noah Grant drives into the garage and texts Daniel from a burner bought in Lakemoor: he is on P2, waiting for Sarah." },
    { time: "23:20", text: "Sarah leaves Daniel and takes the east lift down to P2." },
    { time: "23:29", text: "From her office console, Elena Cross disables the third-floor camera." },
    { time: "23:35", text: "Elena orders a turndown tray for 314 'from management' — chocolate and a complimentary whisky — and collects it herself." },
    { time: "23:41", text: "Elena opens 314 with her master card, past the Do Not Disturb, and apologizes for the 'camera fault'. Daniel accepts the drink. She leaves the chocolate." },
    { time: "23:41", text: "On P2, Sarah has handed Noah the USB and is walking to the Calder Street door." },
    { time: "23:44", text: "Daniel feels the aconitine. Noah's car is leaving the garage." },
    { time: "23:46", text: "Elena re-enters with MGR-01 (two-tone chime). Daniel, failing, calls the last number that texted him. Seven seconds: “Shh. Give it to me, Daniel.”" },
    { time: "23:47", text: "Daniel Mercer dies. Elena swaps the poisoned tumbler for a clean, wiped one, takes his phone and the tray, and tears the top sheet off his notepad." },
    { time: "23:49", text: "She leaves by Service Stair B. The door locks itself behind her." },
    { time: "23:52", text: "She re-enables the camera from her console." },
    { time: "23:55", text: "She drives out of the staff car park. At 23:58 Daniel's phone goes into the river from the embankment." },
    { time: "00:38", text: "Called back about a 'welfare check', she returns, attends the scene at 00:44 and at 01:06 prints the police a door report filtered to hide her card." },
  ],

  /** The true reliability of every record whose filed reliability is wrong. */
  evidenceTruth: {
    "E-005": "FABRICATED",
    "E-006": "DISPUTED",
    "E-007": "DISPUTED",
    "E-008": "FABRICATED",
    "E-009": "DISPUTED",
  } as Partial<Record<EvidenceId, Reliability>>,

  /** Every surfaced conflict is a genuine contradiction; some point away from the culprit. */
  conflictTruth: {
    "C-01": { genuine: true, implicates: "sarah_vale", explanation: "Sarah lied to hide that she met Noah on P2. She was in the garage, not upstairs." },
    "C-02": { genuine: true, implicates: "sarah_vale", explanation: "Sarah and Daniel were working together again on Case 019." },
    "C-03": { genuine: true, implicates: "marcus_reed", explanation: "Marcus warned Daniel off at 22:53 because he was being paid to delay the story." },
    "C-04": { genuine: true, implicates: "noah_grant", explanation: "Noah left his phone in Lakemoor and drove down with a burner. He was afraid of J." },
    "C-05": { genuine: true, implicates: "elena_cross", explanation: "The camera was switched off from Elena's own console." },
    "C-06": { genuine: true, implicates: "elena_cross", explanation: "The hotel printout was filtered to remove master-card entries." },
    "C-07": { genuine: true, implicates: "elena_cross", explanation: "MGR-01 opened Room 314 at 23:41 and 23:46." },
    "C-08": { genuine: true, implicates: "elena_cross", explanation: "Elena left the hotel at 23:55, toward the River District." },
    "C-09": { genuine: true, implicates: "elena_cross", explanation: "The whisky came from outside the room — the turndown tray." },
  } as Record<ConflictId, { genuine: boolean; implicates: SuspectId; explanation: string }>,

  /** Evidence that matters to the solution (for the Evidence and Efficiency scores). */
  keyEvidence: [
    "E-003", "E-013", "E-017", "E-018", "E-019", "E-020", "E-021",
    "E-022", "E-023", "E-024", "E-025", "E-026", "E-027", "E-029",
  ] as EvidenceId[],

  /**
   * Accepted proof per verdict slot. A slot is proven when the player attaches at least
   * `min` items from `accepted`.
   */
  proof: {
    motive: { min: 2, accepted: ["E-010", "E-029", "E-028"] },
    opportunity: { min: 2, accepted: ["E-018", "E-019", "E-013", "E-020", "E-021"] },
    means: { min: 2, accepted: ["E-023", "E-024", "E-021", "E-022"] },
    timeline: { min: 2, accepted: ["E-018", "E-025", "E-026", "E-027", "E-017", "E-012"] },
    identity: { min: 2, accepted: ["E-025", "E-019", "E-018", "E-017", "E-020"] },
  } as Record<string, { min: number; accepted: EvidenceId[] }>,

  redHerrings: [
    { suspect: "sarah_vale", looksLike: "Lied about leaving; exited at 23:43, minutes before the death.", actually: "She was on P2 with Noah until 23:41 (E-017) — four minutes from the third floor — and left by the garage door." },
    { suspect: "marcus_reed", looksLike: "Paid $160,000 by a mystery company; lied about calling Daniel.", actually: "Bribed to slow the story, in a booth at the Mercury Bar from 23:05 to 23:50 (E-030), seven minutes' drive away. The money leads to Halden Holdings and the archive." },
    { suspect: "noah_grant", looksLike: "False alibi, a burner phone, received the last call.", actually: "Collected the Case 019 copy from Sarah and left the garage at 23:45. His burner's mailbox recorded the killer's voice." },
  ],

  suspects: {
    sarah_vale: {
      truthfulness: 0.45, fear: 0.6, motive: 0.2, knowledge: 0.7, confidence: 0.65, alibiStrength: 0.8,
      relationship: "Former partner, working with Daniel again in secret",
      secrets: ["Met Daniel at the bar", "Gave Noah a USB copy of the Case 019 files on P2", "Has spoken to Daniel 14 times in two weeks"],
      whyTheyLie: "Protecting Noah, who is Daniel's source.",
    },
    marcus_reed: {
      truthfulness: 0.4, fear: 0.7, motive: 0.8, knowledge: 0.5, confidence: 0.8, alibiStrength: 0.9,
      relationship: "Employer",
      secrets: ["Paid $40,000 a month by HH Consulting", "Called Daniel at 22:53 to warn him off", "Met a Halden representative at the Mercury Bar"],
      whyTheyLie: "The bribe would end his career.",
    },
    elena_cross: {
      truthfulness: 0.15, fear: 0.5, motive: 0.95, knowledge: 0.9, confidence: 0.9, alibiStrength: 0.2,
      relationship: "Hotel manager; keeper of the B2 archive",
      secrets: ["Disabled camera 3F-East", "Entered 314 twice with MGR-01", "Grows monkshood in the rooftop conservatory", "Filtered the access report", "Threw Daniel's phone in the river"],
      whyTheyLie: "She killed him.",
    },
    noah_grant: {
      truthfulness: 0.5, fear: 0.9, motive: 0.05, knowledge: 0.6, confidence: 0.3, alibiStrength: 0.85,
      relationship: "Closest friend; Daniel's source on Case 019",
      secrets: ["Drove down with a Lakemoor burner", "Collected the USB on P2", "Received Daniel's last call and has not listened to the voicemail"],
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
  },
};
