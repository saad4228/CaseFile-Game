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

/** One chapter of the case told back to the player, once the verdict is filed. */
export interface StoryBeat {
  title: string;
  when: string;
  lines: string[];
  scene?: PhotoScene;
  detail?: InkDetail;
}

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
    // Near miss: the stair is how she left 314. The garage is the trap and earns nothing.
    where: { stairs: 0.3 },
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

  /**
   * The case told as a story, start to finish, once the verdict is in. The sequence above
   * gives the beats of the night; this gives the reason there was a night at all.
   */
  story: [
    {
      title: "Eleven years ago, a man went to prison",
      when: "2013",
      lines: [
        "Case 019 was a straightforward conviction. A man was charged, the evidence log held, and he went away for a long time. His name was Grant. His younger brother Noah was twenty-two and believed him.",
        "The log was not straightforward. Somewhere between the arrest and the trial it was rewritten — times adjusted, two items reordered, one removed. Small changes. Enough.",
        "Whoever did it made one decision that would cost them eleven years later: they did not destroy the originals. Destroying evidence is a crime with a name and a sentence. Filing it is just filing. The real boxes were sealed, labelled and sent into storage with everything else the county had finished with.",
        "That is the whole of Case 047, in the end. A man who could not bring himself to burn the thing that would hang him.",
      ],
      detail: "printout",
    },
    {
      title: "The man in the grey overcoat",
      when: "the answer to the last line in Daniel's notebook",
      lines: [
        "The last thing Daniel Mercer ever wrote was two words long. J knows.",
        "J is Alan Jarrow. He was the detective who built Case 019 and the man who rewrote its evidence log. The conviction made his career: he was promoted within the year and finished as Deputy Commissioner of Vesper County.",
        "He is also the second man in the Mercury Bar photograph — booth four, grey overcoat, face turned away from the camera for forty-five straight minutes, pushing an envelope across the table to Daniel's editor. On his little finger, the only part of him the camera ever got clearly: a signet ring, a circle cut by a single vertical line.",
        "Noah Grant is not frightened of a company. He is frightened of the man who put his brother away and still has the reach to do it to him.",
      ],
      scene: "bar",
    },
    {
      title: "How you hide a box without burning it",
      when: "2014 – 2015",
      lines: [
        "In 2014 Vesper County decided its overflow storage for closed cases cost too much to keep in county hands, and contracted it out. The decision was signed by the Deputy Commissioner.",
        "In 2015 he retired. That same year a company called Halden Holdings S.A. — registered offshore, beneficial owner undisclosed — bought the Blackwood Hotel. A second Halden company, Calder Street Storage Ltd, won the county contract and registered its premises as sub-basement B2 of that same hotel.",
        "Halden is not a conspiracy. It is a filing arrangement. It is the legal structure a careful man builds so that the evidence which could convict him sits in a basement he owns, under a hotel he owns, guarded by a manager he pays, and every piece of paper in the chain is perfectly in order.",
        "A third Halden company, HH Consulting, would later become useful for something else.",
      ],
      scene: "archive",
    },
    {
      title: "The keeper",
      when: "2015 – 2024",
      lines: [
        "Elena Cross has run the Blackwood since Halden bought it. She holds the master card. She controls the camera system. She signs the storage leases. For nine years her real job was to make sure nobody went down to B2 and nobody thought to ask why a hotel has a records vault underneath it.",
        "She was paid well, and she was never asked to break a law. That is the clever part. A keeper who has done nothing wrong has nothing to confess, and no reason to leave.",
        "She also kept a garden. The rooftop conservatory is staff-only, keycard access, and the hotel's own guest newsletter ran a piece on it in September with photographs — rosemary, lavender, foxglove, and, hand-lettered on its own label, Aconitum napellus. Monkshood.",
        "She had the thing that killed Daniel Mercer growing on her roof for years before she ever needed it, and a magazine article telling anyone who looked that it was there.",
      ],
      scene: "conservatory",
    },
    {
      title: "The reporter",
      when: "August – November",
      lines: [
        "Daniel Mercer spent four months reopening old convictions built on evidence he thought had been handled. Case 019 was the fourth in the series and the first that went anywhere.",
        "From August, HH Consulting began paying Reed Media forty thousand dollars a month as an advisory retainer. No invoices were ever filed for it. Marcus Reed was the sole signatory on the account, and his reporter's series began to slip — a week here, a month there, always for a reason that sounded editorial.",
        "Daniel kept going anyway. Sarah Vale, his former partner, worked it with him off the books: fourteen calls in twelve days. Noah Grant fed him Case 019 from the inside, because the man it convicted was his brother.",
        "Two nights before he died Daniel checked into the Blackwood, Room 314, third floor, east wing, beside Service Stair B. He had worked out where the boxes were. His notebook says it in his own shorthand: boxes went to overflow in 2014, overflow equals under Blackwood, the keeper has every key.",
      ],
      scene: "mercer-office",
    },
    {
      title: "The night it stopped working",
      when: "14 November, 22:47",
      lines: [
        "At 22:47, in the hotel bar, Daniel handed Sarah a USB drive: scans of the original Case 019 evidence log, to be passed to Noah.",
        "A sealed basement survives almost anything except a copy leaving the building. For nine years the arrangement had held because the only version that mattered was the one nobody could reach. The moment that drive went into Sarah's bag, nine years of keeping a door shut stopped working.",
        "At 23:29 the third-floor camera went dark, switched off from the console in Elena's own office. At 23:35 she signed out a turndown tray from management: a chocolate, and a whisky she had laced with aconitine cut from her own monkshood.",
        "At 23:41 her master card opened 314 past the Do Not Disturb card hanging on the handle. She apologised for the camera being down. Daniel took the drink from her, because why would he not.",
      ],
      detail: "glass",
    },
    {
      title: "Seven seconds",
      when: "23:46",
      lines: [
        "Aconitine is fast. It takes the mouth first, then the heart.",
        "At 23:46, dying, Daniel called the last number that had texted him. It was Noah's prepaid burner, two floors below him in the garage. Noah did not pick up. It went to the mailbox.",
        "The mailbox recorded seven seconds. A two-tone door chime, and then a woman's voice, very close to the handset: “Shh. Give it to me, Daniel.”",
        "That is Elena Cross, letting herself back into Room 314 to take the phone off him. It is the only recording of the killer anywhere in the file, and it exists because a dying man called his friend instead of the police.",
        "Noah has still never played it.",
      ],
      detail: "door",
    },
    {
      title: "Everything she did in the next nine minutes",
      when: "23:47 – 01:06",
      lines: [
        "Daniel died at about 23:47. She swapped the tumbler on the desk for a clean one and wiped it, which is why the glass carried no fingerprints at all — not even his, which is the detail that should have given her away first.",
        "She took the tray, the phone, and the top sheet of his notepad, and went down Service Stair B at 23:49. At 23:52 the third-floor camera came back on from the same console that had switched it off. At 23:55 her car left the staff car park.",
        "At 23:58 Daniel's phone went into the Vesper from the River District embankment, which is the last place his handset ever reported from.",
        "At 01:06, called back to her own hotel by the police, she printed them a door report for Room 314 — filtered by hand to remove every entry made with a master card. She was helping. She stood there while they thanked her for it.",
      ],
      detail: "river",
    },
    {
      title: "The three people who lied and did not kill him",
      when: "the same night",
      lines: [
        "Sarah Vale said she was never upstairs. She was in the garage, handing Noah the drive, and she lied to keep him out of it.",
        "Marcus Reed said he was working late. He was in booth four of the Mercury Bar from 23:05 to 23:50, taking an envelope from a man he could not name, and he lied because the payments would end his career. That meeting is also the single thread that leads to the registry, and the registry is the only route to the motive.",
        "Noah Grant said he was in Lakemoor. He left his phone there and drove down on a burner so that nothing would place him at the Blackwood, and he lied because he was afraid of Jarrow.",
        "Three people with something to hide on the same night in the same building, and not one of them a killer. That is what made it so hard to read — and it is exactly what the arrangement was built to produce.",
      ],
      scene: "garage",
    },
    {
      title: "What this actually changes",
      when: "after",
      lines: [
        "The murder closes. Elena Cross poisoned Daniel Mercer in Room 314 to stop him reaching an archive underneath the hotel she runs, and the file now holds her own voice doing it.",
        "The conviction does not close. Noah's brother is still serving a sentence built on a log that was rewritten. What Sarah passed him is a set of scans — enough to file an appeal, not enough to win one, because an appeal needs the originals and the originals are still sealed in B2, in a building owned by the man the appeal would accuse.",
        "And Alan Jarrow has not been charged with anything, because nothing in this case touches him. He paid an editor through a company, which is not a crime anyone has proved. He signed a storage contract eleven years ago, which is not a crime at all. He was in a bar. The strongest thing anyone ever wrote about him is two words in a dead man's notebook, and a notebook is not evidence.",
        "He is still wearing the ring.",
      ],
      detail: "ring",
    },
  ] as StoryBeat[],

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

  /**
   * Leads that move the investigation towards the truth (Efficiency score).
   * L-12 counts: the money is the only route to the registry, and so to the motive.
   * L-14 doesn't: verifying Marcus's alibi clears him, which is useful but not the way in.
   */
  relevantLeads: ["L-01", "L-02", "L-03", "L-04", "L-05", "L-06", "L-07", "L-08", "L-09", "L-10", "L-11", "L-12", "L-13"] as LeadId[],

  /**
   * Accepted proof per slot: proven with at least `min` of `accepted`. Include anything a
   * careful player could defensibly attach, since they get no feedback while choosing.
   */
  proof: {
    motive: { min: 2, accepted: ["E-010", "E-029", "E-028", "E-032", "E-033"] },
    opportunity: { min: 2, accepted: ["E-018", "E-019", "E-013", "E-020", "E-021", "E-034"] },
    // E-003: the emptied tumbler, unused second coaster and untouched chocolate.
    means: { min: 2, accepted: ["E-023", "E-024", "E-021", "E-022", "E-034", "E-003"] },
    // E-002 fixes the window; E-004 is the 23:46 call inside it.
    timeline: { min: 2, accepted: ["E-018", "E-025", "E-026", "E-027", "E-017", "E-012", "E-034", "E-013", "E-002", "E-004"] },
    // E-027: her own car, through the staff barrier, eight minutes after he died.
    identity: { min: 2, accepted: ["E-025", "E-019", "E-018", "E-020", "E-034", "E-027"] },
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
