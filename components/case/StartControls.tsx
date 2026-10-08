"use client";

import Link from "next/link";
import { createRoomAction, startSoloAction } from "@/app/actions/session";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { CaseMeta } from "@/lib/game-engine/types";
import type { StartOptions } from "./StartOptions";

// The ways into the case: alone on this device, alone with an account, or a team room.

export function StartControls({ meta, start }: { meta: CaseMeta; start: StartOptions }) {
  if (!start.online) {
    return (
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Link href={`/investigation/${meta.id}`} className="btn btn-primary">
          Begin investigation
        </Link>
        <p className="label normal-case tracking-[0.08em]">Estimated {meta.estTime.toLowerCase()} · progress saves on this device</p>
      </div>
    );
  }
  return (
    <div>
      {start.error && (
        <p role="alert" className="mb-5 max-w-xl border-l-4 border-crimson-600 bg-crimson-600/10 px-4 py-3 text-sm">
          {start.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {start.resume ? (
          <Link href={`/play/${start.resume.code}`} className="btn btn-primary">
            Resume investigation
          </Link>
        ) : (
          <form action={startSoloAction}>
            <input type="hidden" name="caseId" value={meta.id} />
            <SubmitButton className="btn btn-primary" pendingText="Opening the file…">
              Begin investigation
            </SubmitButton>
          </form>
        )}
        <form action={createRoomAction}>
          <input type="hidden" name="caseId" value={meta.id} />
          <SubmitButton className="btn btn-ghost" pendingText="Opening a room…">
            Investigate as a team
          </SubmitButton>
        </form>
        {start.resume && (
          <form action={startSoloAction}>
            <input type="hidden" name="caseId" value={meta.id} />
            <SubmitButton className="label hover:text-bone-100" pendingText="Opening…">
              Start over in a new file
            </SubmitButton>
          </form>
        )}
      </div>
      <p className="label mt-4 normal-case tracking-[0.08em]">
        Estimated {meta.estTime.toLowerCase()} · solo, or 2–4 investigators with an invite link · progress saves to your detective file
      </p>
    </div>
  );
}
