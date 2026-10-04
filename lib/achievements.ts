// Public catalogue of achievements. Earned on the server when a verdict is filed.
export const ACHIEVEMENTS = {
  case_closed: { title: "Case Closed", description: "Solve a case: right culprit, right method, proof in at least three slots." },
  rank_s: { title: "Clean Sheet", description: "Close a case with rank S." },
  contradiction_hunter: { title: "Contradiction Hunter", description: "Classify every conflict in a case as a contradiction." },
  nothing_unread: { title: "Nothing Left Unread", description: "Discover every record in a case." },
  straight_line: { title: "Straight Line", description: "Solve a case following eight leads or fewer." },
  before_the_rain_stops: { title: "Before the Rain Stops", description: "Solve a case in under 35 minutes." },
  partners: { title: "Partners", description: "Solve a case as a team." },
  pressure: { title: "Pressure", description: "Get every suspect to revise their statement." },
  the_ring: { title: "The Ring", description: "Notice the man in the grey overcoat." },
  red_thread: { title: "Red Thread", description: "Make eight correct connections on the board without a wrong one." },
} as const;

export type AchievementKey = keyof typeof ACHIEVEMENTS;

export const RANKS = [
  { min: 0, title: "Rookie" },
  { min: 1, title: "Investigator" },
  { min: 3, title: "Detective" },
  { min: 6, title: "Inspector" },
  { min: 10, title: "Chief Inspector" },
];

export function rankTitle(casesSolved: number) {
  return [...RANKS].reverse().find((r) => casesSolved >= r.min)!.title;
}
