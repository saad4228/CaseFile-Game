import "server-only";
import type { DialogueLine, InterviewScript } from "@/lib/game-engine/types";

// Interview scripts. Server-only: answers to presented evidence give away what matters.
// Suspects never confess. They evade, redirect, give technically true answers, and only
// move when a record leaves them nowhere to stand.

const s = (text: string): DialogueLine => ({ who: "suspect", text });
const n = (text: string): DialogueLine => ({ who: "note", text });

export const interviews: Record<string, InterviewScript> = {
  sarah_vale: {
    suspectId: "sarah_vale",
    setting: "Interview Room 2, Vesper City PD — 09:40, Nov 15",
    opening: [n("She keeps her coat on. Her phone is face down on the table."), s("I already gave a statement. Happy to give it again, slower.")],
    questions: [
      {
        id: "sv-know",
        text: "How did you know Daniel Mercer?",
        answer: [s("We worked together. Four years, two awards, one very loud ending."), n("She says “ending” like a word she has practised."), s("That was two years ago.")],
      },
      {
        id: "sv-last",
        text: "When did you last speak to him?",
        answer: [s("Months ago. I told the officer.")],
      },
      {
        id: "sv-why",
        text: "Why were you at the Blackwood last night?",
        answer: [s("To meet a friend at the bar. Is that a crime in Vesper now?")],
      },
      {
        id: "sv-friend",
        text: "Who was the friend?",
        after: ["sv-why"],
        answer: [s("Someone who'd rather not be in your file. That's rather the point of friends.")],
      },
      {
        id: "sv-left",
        text: "When did you leave the hotel?",
        answer: [s("About twenty past eleven. I took a cab home.")],
      },
      {
        id: "sv-desk",
        text: "Why did you call the front desk at 00:20?",
        answer: [s("He wasn't answering."), n("A beat too late, she adds:"), s("I mean — everyone knew he was staying there. I had a feeling. I'm a journalist; I have feelings about doors.")],
      },
      {
        id: "sv-019",
        text: "What is Case 019?",
        requires: ["E-010"],
        answer: [s("A case number. There are thousands of those."), n("Her hand moves towards her coat pocket, then stops.")],
      },
      {
        id: "sv-usb",
        text: "What was on the drive you gave Noah?",
        after: ["sv-r-garage"],
        answer: [
          s("Copies. Scans of the original 019 evidence log — from before somebody rewrote it."),
          s("Daniel made two. One for him, and one for whoever outlived him."),
        ],
      },
      {
        id: "sv-close",
        text: "Who else knew Daniel was getting close?",
        after: ["sv-r-garage"],
        answer: [
          s("Marcus knew he was close to something. Marcus always knows."),
          s("And Daniel thought the hotel knew. He said someone there “kept the keys”. I thought he was being dramatic. He usually was. He was usually right."),
        ],
      },
    ],
    reactions: [
      {
        id: "sv-r-calls",
        evidence: ["E-004"],
        answer: [
          n("She turns the page face down."),
          s("Fine. We talked. He called me, I called him. It's not a crime to work with someone you can't stand."),
          s("He'd found something in an old case and needed someone who reads court records faster than he does. That's all I'll say about it."),
        ],
      },
      {
        id: "sv-r-exit",
        evidence: ["E-012"],
        answer: [
          s("Twenty past, quarter to. I wasn't wearing a watch, Detective."),
          n("She is. It's on her wrist now."),
          s("It says I left. That's what I told you. I left."),
        ],
      },
      {
        id: "sv-r-lobby",
        evidence: ["E-011"],
        answer: [s("So I took the lift. The garage is part of the hotel."), n("Her statement says she took a cab.")],
      },
      {
        id: "sv-r-garage",
        evidence: ["E-017"],
        answer: [
          s("All right."),
          n("She takes her coat off."),
          s("Noah. It was Noah. Daniel asked me to bring him a copy of everything, in case. I gave it to him on P2 and walked out the Calder Street door."),
          s("I never went upstairs. I didn't see Daniel after twenty past eleven."),
          s("I lied because Noah's frightened. When Noah's frightened, he's usually right."),
        ],
        unlocks: ["E-031"],
      },
      {
        id: "sv-r-burner",
        evidence: ["E-016"],
        answer: [s("If you've traced that number, you know whose it is. Ask him, not me.")],
      },
      {
        id: "sv-r-voicemail",
        evidence: ["E-025"],
        answer: [
          n("She reads the transcript twice."),
          s("That's not my voice. And that chime — that's the hotel. Their staff doors do that, two notes. Daniel used to imitate it."),
        ],
      },
      {
        id: "sv-r-elena",
        evidence: ["E-018", "E-019", "E-034"],
        answer: [s("The manager? I've never spoken to her. Daniel said the hotel “kept the keys”. I thought it was a figure of speech.")],
      },
    ],
    deflections: [
      [s("I don't see what that has to do with me.")],
      [s("You're showing me paper, Detective. Show me a question.")],
      [s("Daniel would have known what to make of that. I don't.")],
    ],
    repeat: [s("We've been through that one.")],
  },

  marcus_reed: {
    suspectId: "marcus_reed",
    setting: "Reed Media, 6th floor — 10:05, Nov 15. His lawyer is reading a phone.",
    opening: [n("He shakes your hand like he's closing a deal."), s("Ask what you need. I've cleared my morning, which tells you how seriously I take this.")],
    questions: [
      {
        id: "mr-work",
        text: "What was Daniel working on?",
        answer: [s("A series on old convictions. Lab errors, sloppy chains of custody. Good, worthy, slow."), s("The kind of journalism that wins prizes and loses advertisers.")],
      },
      {
        id: "mr-spoke",
        text: "Did you speak to him that night?",
        answer: [s("No. I told your sergeant.")],
      },
      {
        id: "mr-where",
        text: "Where were you between eleven and midnight?",
        answer: [s("The Mercury Bar, with a client. Booth four. The bartender will remember the tip.")],
      },
      {
        id: "mr-client",
        text: "Who was the client?",
        after: ["mr-where"],
        answer: [s("Someone who consults for us. I don't hand my clients' names to the police over coffee."), n("His lawyer looks up for the first time.")],
      },
      {
        id: "mr-run",
        text: "Was the series going to run?",
        answer: [s("Everything Daniel wrote ran. Eventually.")],
      },
      {
        id: "mr-j",
        text: "Who is J?",
        requires: ["E-010"],
        answer: [s("Nobody I know."), n("He answers before you've finished the question.")],
      },
    ],
    reactions: [
      {
        id: "mr-r-call",
        evidence: ["E-004"],
        answer: [
          n("He smiles."),
          s("Four minutes. That isn't a conversation, Detective, it's a courtesy. I told him to get some sleep. He'd been living in that hotel for two days."),
          s("If I'd known it was the last time I'd speak to him, I'd have said something better."),
        ],
      },
      {
        id: "mr-r-bank",
        evidence: ["E-028"],
        answer: [
          n("The lawyer puts his phone down."),
          s("HH Consulting advises us. Strategy. Audience growth."),
          n("There are no invoices. He knows you know."),
          s("Fine. They paid us to slow the series. Not kill it — slow it. Daniel never knew."),
          s("I told myself I was buying him time. I was buying them time."),
        ],
        unlocks: ["E-033"],
      },
      {
        id: "mr-r-registry",
        evidence: ["E-029"],
        answer: [
          s("Halden. I didn't know that's who was behind it."),
          n("He did."),
          s("They own the hotel? Daniel was sleeping in their hotel."),
          n("For the first time, he looks afraid."),
        ],
      },
      {
        id: "mr-r-bar",
        evidence: ["E-030"],
        answer: [
          s("There. Booth four, all night. You have your alibi."),
          s("The man across from me calls himself a consultant. I've met him four times. He has never once told me his name."),
          s("The ring? He turns it when he's thinking. A circle with a line through it. I've made a point of not asking."),
        ],
      },
      {
        id: "mr-r-notebook",
        evidence: ["E-010"],
        answer: [s("“M.R. on the list.” Daniel thought everyone was on a list."), s("Usually he was right. That was the problem with him.")],
      },
    ],
    deflections: [
      [s("My lawyer would like to know where you're going with this.")],
      [s("I read documents like that for a living, Detective. It doesn't move me.")],
      [s("Interesting. Irrelevant, but interesting.")],
    ],
    repeat: [s("Asked and answered.")],
  },

  elena_cross: {
    suspectId: "elena_cross",
    setting: "Blackwood Hotel, General Manager's office — 01:30, Nov 15",
    opening: [n("Everything on her desk sits at right angles. A cup of tea, untouched."), s("A terrible night. Ask me anything. The Blackwood has nothing to hide from you.")],
    questions: [
      {
        id: "ec-where",
        text: "Where were you between eleven and midnight?",
        answer: [s("Here. The night audit — ledgers, room charges, the minibar reconciliation. Glamorous work.")],
      },
      {
        id: "ec-saw",
        text: "Did you see Daniel Mercer that night?",
        answer: [s("No. He'd asked not to be disturbed and we respect that. It's rather the point of a hotel.")],
      },
      {
        id: "ec-camera",
        text: "What happened to the third-floor camera?",
        answer: [s("It failed. That system fails twice a month. I'll report it to the vendor in the morning.")],
      },
      {
        id: "ec-keys",
        text: "Who holds master keys?",
        answer: [s("Myself, the duty manager, the night porters. Housekeeping have floor cards, restricted after ten.")],
      },
      {
        id: "ec-owner",
        text: "Who owns the Blackwood?",
        answer: [s("A holding company. I report to their asset manager. They've never once visited, which suits me.")],
      },
      {
        id: "ec-basement",
        text: "What is stored in sub-basement B2?",
        requires: ["E-029"],
        answer: [s("Plant rooms. Leased storage — records, I'm told. Not hotel business."), n("It's the first answer she gives without looking at you.")],
      },
      {
        id: "ec-garden",
        text: "You keep a garden on the roof?",
        requires: ["E-024"],
        answer: [
          s("The conservatory. My one indulgence. Guests adore it."),
          s("If you're asking whether I know what monkshood is — yes. Every gardener does. It's beautiful, and you don't eat it."),
        ],
      },
      {
        id: "ec-drive",
        text: "Where did you go at 23:55?",
        requires: ["E-027"],
        answer: [s("Out. I needed air. I drove along the river for twenty minutes. I wasn't aware that was a crime.")],
      },
    ],
    reactions: [
      {
        id: "ec-r-ticket",
        evidence: ["E-013"],
        answer: [s("Then the vendor is mistaken. Or someone used my console — the office isn't locked during the audit."), n("Her voice stays exactly level.")],
      },
      {
        id: "ec-r-asset",
        evidence: ["E-020"],
        requiresAlso: ["E-013"],
        answer: [s("It's my office. A great many people walk through my office.")],
      },
      {
        id: "ec-r-rawlog",
        evidence: ["E-018"],
        answer: [
          n("A long pause."),
          s("Yes. All right. I went up. The camera was down and I was worried about the guest — I'm responsible for that floor."),
          s("I knocked, I apologised, I left him a complimentary drink and a chocolate. He was perfectly well when I left. Quarter to, perhaps."),
          s("I didn't mention it because I didn't want the hotel associated with — this."),
        ],
        unlocks: ["E-034"],
      },
      {
        id: "ec-r-printout",
        evidence: ["E-005"],
        requiresAlso: ["E-018"],
        answer: [s("The report hides staff cards by default. It's a setting. I didn't write the software."), n("The audit trail says the filter was applied by hand, at 01:06.")],
      },
      {
        id: "ec-r-keys",
        evidence: ["E-019"],
        answer: [s("MGR-02 is Raymond's. He's on leave this week."), n("She doesn't say what that leaves.")],
      },
      {
        id: "ec-r-voicemail",
        evidence: ["E-025"],
        answer: [
          n("She reads the transcript once and slides it back across the desk."),
          s("Anyone can carry a two-tone card. Anyone can say “give it to me”."),
          s("I'd like to stop now. I'd like a lawyer."),
        ],
      },
      {
        id: "ec-r-tox",
        evidence: ["E-023"],
        requiresAlso: ["E-024"],
        answer: [s("Monkshood grows in half the gardens in the Old Quarter."), n("She doesn't look at the newsletter.")],
      },
      {
        id: "ec-r-tray",
        evidence: ["E-022", "E-021"],
        requiresAlso: ["E-034"],
        answer: [s("Then housekeeping cleared it. Or he put it outside the door. I really couldn't say what a guest does with a tray.")],
      },
      {
        id: "ec-r-gate",
        evidence: ["E-027"],
        answer: [s("I told you. I drove along the river. I needed air.")],
      },
      {
        id: "ec-r-phone",
        evidence: ["E-026"],
        answer: [s("The river is long, Detective. A great many people drive along it."), n("Her hand lies flat on the desk. It is very still.")],
      },
    ],
    deflections: [
      [s("I'm not sure what you'd like me to say about that.")],
      [s("That's a matter for whoever produced it. Not for me.")],
      [s("The Blackwood keeps excellent records. I'm sure that one is in order.")],
    ],
    repeat: [s("We've discussed that, I believe.")],
  },

  noah_grant: {
    suspectId: "noah_grant",
    setting: "Interview Room 1, Vesper City PD — 14:00, Nov 15. He drove back from Lakemoor when you asked.",
    opening: [n("He hasn't slept. He keeps looking at the door."), s("Is it true? About his phone? That nobody's found it?")],
    questions: [
      {
        id: "ng-where",
        text: "Where were you last night?",
        answer: [s("Lakemoor. My mother's. I told the officer on the phone.")],
      },
      {
        id: "ng-last",
        text: "When did you last hear from Daniel?",
        answer: [s("A week ago. He goes quiet when he's working.")],
      },
      {
        id: "ng-019",
        text: "What is Case 019?",
        answer: [s("I don't know."), n("He knows.")],
      },
      {
        id: "ng-phone",
        text: "Why do you care about his phone?",
        answer: [s("Because everything was on it. His notes. Photos. If someone has it, they know what he knew.")],
      },
      {
        id: "ng-brother",
        text: "Tell me about your brother.",
        after: ["ng-r-notebook"],
        answer: [
          s("Eli. Twelve years for a robbery he didn't do. The evidence log said the gun was found in his car. The original log didn't say that."),
          s("Daniel found out the original boxes were never destroyed. They were moved — “overflow storage”. He thought they were under that hotel."),
        ],
      },
    ],
    reactions: [
      {
        id: "ng-r-plate",
        evidence: ["E-014"],
        answer: [
          n("He closes his eyes."),
          s("Okay. I drove down. I left my phone at my mother's so it would look like I was there — Daniel said they can follow phones."),
          s("I picked something up from Sarah in the garage and drove straight back. I never went into the hotel. I swear I never went in."),
        ],
        unlocks: ["E-032"],
      },
      {
        id: "ng-r-location",
        evidence: ["E-015"],
        answer: [s("Exactly. Lakemoor, all night. See?"), n("He doesn't sound as if he believes it either.")],
      },
      {
        id: "ng-r-burner",
        evidence: ["E-016"],
        answer: [
          s("It's mine. Daniel made me buy it. “One number, one person, cash.”"),
          s("He called it. I know when. I was on the ramp, paying the barrier, and I couldn't answer. When I called back it just rang."),
          s("I haven't listened to the message. I can't."),
        ],
        unlocks: ["E-032"],
      },
      {
        id: "ng-r-garage",
        evidence: ["E-017"],
        answer: [s("That's me. That's Sarah. She gave me the drive and I left. I was through the barrier at quarter to. Check it.")],
        unlocks: ["E-032"],
      },
      {
        id: "ng-r-notebook",
        evidence: ["E-010"],
        answer: [s("“N driving down Thursday.” That's me. Fine."), s("Case 019 is my brother.")],
      },
      {
        id: "ng-r-voicemail",
        evidence: ["E-025"],
        answer: [
          n("He reads it, then puts his hand over his mouth."),
          s("Twenty-three forty-six. That's when I was at the barrier. If I'd answered —"),
          s("That chime. The doors there do that — the staff cards. Daniel told me: listen for the double chime, that's the people who have every key."),
        ],
      },
      {
        id: "ng-r-hotel",
        evidence: ["E-018", "E-034"],
        answer: [s("I don't know her. Daniel said someone at the hotel “kept” something. The keeper. He never told me a name.")],
      },
    ],
    deflections: [
      [s("I don't know what that is. I'm sorry.")],
      [s("Can I — could I get some water?")],
      [s("Daniel would know. He always knew what things meant.")],
    ],
    repeat: [s("You showed me that already.")],
  },
};
