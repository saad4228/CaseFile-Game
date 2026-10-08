import "server-only";
import type { InkDetail, PhotoScene } from "@/lib/game-engine/types";

export type StoryPicture = { scene: PhotoScene } | { detail: InkDetail };

export interface StoryBeat {
  title: string;
  when: string;
  lines: string[];
  /** Pictures that run alongside the chapter, in order. */
  pictures: StoryPicture[];
}

/**
 * The case told as a story, start to finish, once the verdict is in. The sequence above
 * gives the beats of the night; this gives the reason there was a night at all.
 */
export const story: StoryBeat[] = [
  {
    title: "Eleven years ago, a man went to prison",
    when: "2013",
    lines: [
      "Case 019 was a straightforward conviction. A man was charged, the evidence log held, and he went away for a long time. His name was Grant. His younger brother Noah was twenty-two and believed him.",
      "The log was not straightforward. Somewhere between the arrest and the trial it was rewritten — times adjusted, two items reordered, one removed. Small changes. Enough.",
      "Whoever did it made one decision that would cost them eleven years later: they did not destroy the originals. Destroying evidence is a crime with a name and a sentence. Filing it is just filing. The real boxes were sealed, labelled and sent into storage with everything else the county had finished with.",
      "That is the whole of Case 047, in the end. A man who could not bring himself to burn the thing that would hang him.",
    ],
    pictures: [
      { scene: "trial" },
      { scene: "brother" },
      { detail: "printout" },
    ],
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
    pictures: [
      { scene: "jarrow" },
      { scene: "bar" },
      { detail: "envelope" },
      { detail: "ring" },
    ],
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
    pictures: [
      { detail: "contract" },
      { scene: "lobby" },
      { scene: "archive" },
    ],
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
    pictures: [
      { scene: "b2-door" },
      { detail: "keycard" },
      { scene: "conservatory" },
      { detail: "monkshood" },
    ],
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
    pictures: [
      { scene: "daniel" },
      { detail: "ledger" },
      { scene: "mercer-office" },
      { scene: "room-desk" },
    ],
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
    pictures: [
      { detail: "handover" },
      { detail: "console" },
      { scene: "tray" },
      { detail: "glass" },
      { detail: "keycard" },
    ],
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
    pictures: [
      { detail: "dying-call" },
      { detail: "burner" },
      { detail: "door" },
      { scene: "garage" },
    ],
  },
  {
    title: "Everything she did in the next nine minutes",
    when: "23:47 – 01:06",
    lines: [
      "Daniel died at about 23:47. She swapped the tumbler on the desk for a clean one and wiped it, which is why the glass carried no fingerprints at all — not even his, which is the detail that should have given her away first.",
      "She took the tray, the phone, and the top sheet of his notepad, and went down Service Stair B at 23:49. At 23:52 the third-floor camera came back on from the same console that had switched it off. At 23:55 her car left the staff car park.",
      "At 23:58 Daniel's phone went into the Vesper from the River District embankment, which is the last place his handset ever reported from.",
      "He was found at 00:31 by the night porter, who let himself in with a passkey because a guest had not answered his room phone all evening. The Do Not Disturb card Daniel had hung on the handle was still there.",
      "At 01:06, called back to her own hotel by the police, she printed them a door report for Room 314 — filtered by hand to remove every entry made with a master card. She was helping. She stood there while they thanked her for it.",
    ],
    pictures: [
      { detail: "stairs" },
      { detail: "river" },
      { scene: "porter" },
      { scene: "police" },
      { detail: "printout" },
    ],
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
    pictures: [
      { scene: "garage" },
      { scene: "bar" },
      { scene: "garage-plate" },
    ],
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
    pictures: [
      { scene: "prison" },
      { scene: "archive" },
      { detail: "ring" },
    ],
  },
];
