import type { Suspect } from "@/lib/game-engine/types";

export const suspects: Suspect[] = [
  {
    id: "sarah_vale",
    code: "S-01",
    name: "Sarah Vale",
    age: 33,
    role: "Freelance journalist",
    relation: "Former reporting partner",
    summary:
      "Co-wrote Daniel's first investigations. The partnership ended badly two years ago. Was at the Blackwood on the night of the 14th.",
    statements: [
      {
        topic: "Contact",
        quote: "I haven't spoken to Daniel in months. We didn't part as friends.",
      },
      {
        topic: "That night",
        quote:
          "I was at the hotel bar to meet a friend. Not him. I left the hotel at about 11:20.",
      },
      {
        topic: "The body",
        quote:
          "I called the front desk because… I had a feeling. That's all. I'm a journalist; I have feelings about doors.",
      },
    ],
    portrait: { hair: "long", collar: "coat" },
  },
  {
    id: "marcus_reed",
    code: "S-02",
    name: "Marcus Reed",
    age: 52,
    role: "Publisher, Reed Media",
    relation: "Daniel's employer",
    summary:
      "Owns the outlet Daniel wrote for. Signed off on the corruption series — then started asking for it to be delayed.",
    statements: [
      {
        topic: "Contact",
        quote: "I didn't speak to Daniel that night. Why would I? It was a Thursday.",
      },
      {
        topic: "Alibi",
        quote:
          "I was at the Mercury Bar from about eleven with a client. Ask the bartender. I tip well enough to be remembered.",
      },
      {
        topic: "The story",
        quote:
          "Daniel's series was months from publication. I had no reason to stop it. I had every reason to sell it.",
      },
    ],
    portrait: { hair: "swept", collar: "suit", glasses: true },
  },
  {
    id: "elena_cross",
    code: "S-03",
    name: "Elena Cross",
    age: 46,
    role: "General Manager, Blackwood Hotel",
    relation: "Ran the hotel Daniel was staying in",
    summary:
      "Eleven years at the Blackwood. Handled the police on the night and supplied the hotel's records herself.",
    statements: [
      {
        topic: "Room 314",
        quote: "I never entered Room 314. I had no reason to. The guest asked not to be disturbed.",
      },
      {
        topic: "That night",
        quote:
          "I was in my office running the night audit from eleven until after midnight. It's tedious. It's also my job.",
      },
      {
        topic: "The camera",
        quote:
          "The third-floor camera failed. It happens. The fault was reported to our vendor the next morning.",
      },
    ],
    portrait: { hair: "bun", collar: "blouse" },
  },
  {
    id: "noah_grant",
    code: "S-04",
    name: "Noah Grant",
    age: 35,
    role: "Civil engineer",
    relation: "Daniel's closest friend since school",
    summary:
      "Grew up two streets from Daniel. Says he was two hours away when it happened. His phone agrees.",
    statements: [
      {
        topic: "Alibi",
        quote: "I was in Lakemoor visiting my mother. Two hours away. Check my phone.",
      },
      {
        topic: "Contact",
        quote: "I hadn't heard from Daniel in a week. He went quiet when he was working.",
      },
      {
        topic: "Case 019",
        quote: "I don't know what that is. Should I?",
      },
    ],
    portrait: { hair: "short", collar: "hood" },
  },
  {
    id: "j",
    code: "S-05",
    name: "“J”",
    age: null,
    role: "Unidentified",
    relation: "Named in Daniel's notes",
    summary:
      "No confirmed identity. Appears in Daniel's notebook more than once. No statement.",
    statements: [],
    portrait: { hair: "none", collar: "coat", hat: true, unknown: true },
  },
];

export const suspectById = (id: string) => suspects.find((s) => s.id === id);
