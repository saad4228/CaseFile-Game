import { SuspectPhoto } from "@/components/illustrations/SuspectPhoto";
import type { Suspect } from "@/lib/game-engine/types";

/**
 * Suspect card (reference 2): the portrait in its own scene above a torn paper label with the
 * name in typewriter capitals, "role | age" and a short line about them.
 */
export function SuspectCard({ suspect, className = "", short }: { suspect: Suspect; className?: string; short?: boolean }) {
  return (
    <figure className={`suspect-card relative ${className}`}>
      <div className="relative overflow-hidden border-[5px] border-[#16120e] shadow-[0_18px_28px_-12px_rgba(0,0,0,.85)]">
        <SuspectPhoto suspect={suspect} className="block w-full" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,.65)]" aria-hidden="true" />
      </div>
      <figcaption className="paper torn relative -mt-5 mx-1.5 px-3 pb-3 pt-4 text-center">
        <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1d1a14]">{suspect.name}</p>
        <p className="mt-0.5 font-mono text-[10px] text-[#1d1a14]/75">
          {suspect.role.split(",")[0]} | {suspect.age ?? "??"}
        </p>
        {!short && <p className="mt-2 line-clamp-3 font-mono text-[10.5px] leading-snug text-[#1d1a14]/80">{suspect.relation}.</p>}
      </figcaption>
    </figure>
  );
}
