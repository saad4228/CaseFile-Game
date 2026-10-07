import type { CaseMeta } from "@/lib/game-engine/types";
import { meta as case047 } from "./case-047/meta";

// Public case registry. Only case 047 is playable; the rest of Season 1 is sealed.
const sealed = (
  number: string,
  title: string,
  logline: string,
  difficulty: CaseMeta["difficulty"],
): CaseMeta => ({
  id: number,
  number,
  title,
  logline,
  classification: "CLASSIFIED",
  status: "SEALED",
  difficulty,
  players: "1–4",
  estTime: "40–60 MIN",
  playable: false,
  date: "",
  time: "",
  setting: "",
  victim: { name: "", age: 0, occupation: "", bio: "" },
  objective: "",
  brief: [],
  intro: [],
  counts: { suspects: 0, evidence: 0 },
});

// Season One as planned: the open case and the four it leads to. The sentence above the wall
// counts these, so adding or sealing a file keeps the page honest on its own.
export const cases: CaseMeta[] = [
  case047,
  sealed("052", "The Missing Witness", "A witness disappears the night before she testifies.", 4),
  sealed("061", "The Black Archive", "Case records that should not exist start turning up.", 5),
  sealed("073", "The Innocent", "A conviction everyone agreed on begins to come apart.", 4),
  sealed("089", "The Investigator", "Someone has been writing these cases all along.", 5),
];

export const getCaseMeta = (id: string) => cases.find((c) => c.id === id);
