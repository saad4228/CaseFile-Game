/** A player's standing on one case, as the archive shows it. */
export interface CaseProgress {
  state: "SOLVED" | "CLOSED" | "OPEN";
  rank?: string;
  score?: number;
  /** Server sessions: where to resume. */
  code?: string;
}
