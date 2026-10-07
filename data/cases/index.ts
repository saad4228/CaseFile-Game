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

// One case open and two to come reads as a season getting started. Five folders with four
// sealed read as four IOUs, and made the archive look emptier than it is.
export const cases: CaseMeta[] = [
  case047,
  sealed("052", "The Missing Witness", "A witness disappears the night before she testifies.", 4),
  sealed("061", "The Black Archive", "Case records that should not exist start turning up.", 5),
];

export const getCaseMeta = (id: string) => cases.find((c) => c.id === id);
