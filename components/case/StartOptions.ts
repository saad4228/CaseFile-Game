/** How this deployment can run the case: on a server (accounts, rooms) or on this device only. */
export interface StartOptions {
  online: boolean;
  error?: string;
  /** An unfinished investigation of this case to return to. */
  resume?: { code: string; mode: "SOLO" | "TEAM" } | null;
}
