import "server-only";
import type { CasePublic } from "@/components/game/GameContext";
import type { CaseBundle } from "./cases.server";

/** The parts of a case bundle that are safe to send to every client. */
export function casePublic(bundle: CaseBundle): CasePublic {
  return {
    meta: bundle.meta,
    suspects: bundle.suspects,
    locations: bundle.locations,
    routes: bundle.routes,
    verdictOptions: bundle.verdictOptions,
  };
}
