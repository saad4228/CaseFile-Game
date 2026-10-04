import type { CaseMeta } from "@/lib/game-engine/types";

export const meta: CaseMeta = {
  id: "047",
  number: "047",
  title: "The Last Call",
  logline:
    "A journalist dies in a locked hotel room. His phone is gone. His last call lasted seven seconds.",
  classification: "RESTRICTED",
  status: "UNSOLVED",
  difficulty: 4,
  players: "1–4",
  estTime: "35–50 MIN",
  playable: true,
  date: "NOVEMBER 14",
  time: "23:47",
  setting: "Blackwood Hotel, Vesper City",
  victim: {
    name: "Daniel Mercer",
    age: 34,
    occupation: "Investigative journalist",
    bio: "Staff writer at Reed Media. For the last four months Daniel had been reopening old criminal cases built on evidence he believed was manipulated. He checked into the Blackwood two nights before he died.",
  },
  objective:
    "Determine what happened to Daniel Mercer between 11:00 PM and midnight.",
  brief: [
    "Daniel Mercer, 34, was found in Room 314 of the Blackwood Hotel at 00:31 by the night porter.",
    "The door was locked. There was no sign of forced entry and no weapon in the room.",
    "His phone has not been recovered.",
    "At 23:46:13 his phone placed a call to an unregistered number. It lasted seven seconds.",
    "Five people were close to Daniel that night. Four of them have given statements.",
  ],
  intro: [
    { lines: ["NOVEMBER 14", "11:47 PM"], emphasis: "whisper", hold: 2200 },
    { lines: ["BLACKWOOD HOTEL", "ROOM 314"], emphasis: "title", hold: 2400 },
    {
      lines: ["DANIEL MERCER", "34", "INVESTIGATIVE JOURNALIST"],
      emphasis: "title",
      hold: 2600,
    },
    { lines: ["FOUND DEAD"], emphasis: "alarm", hold: 2000 },
    {
      lines: ["NO SIGN OF FORCED ENTRY.", "NO MURDER WEAPON."],
      emphasis: "whisper",
      hold: 2400,
    },
    {
      lines: ["ONE FINAL CALL.", "7 SECONDS.", "UNKNOWN NUMBER."],
      emphasis: "whisper",
      hold: 2800,
    },
  ],
  counts: { suspects: 5, evidence: 34 },
};
