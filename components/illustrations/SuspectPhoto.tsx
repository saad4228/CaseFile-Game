import { portraitArt } from "@/data/cases/case-047/portraits";
import type { Suspect } from "@/lib/game-engine/types";
import { SuspectPortrait } from "./SuspectPortrait";

/** A suspect's portrait: the painted image when one is on file, the drawn silhouette otherwise. */
export function SuspectPhoto({ suspect, className, tone }: { suspect: Suspect; className?: string; tone?: "cold" | "warm" }) {
  const art = portraitArt[suspect.id];
  if (art) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small local portraits, sized by the parent
      <img src={art} alt={suspect.name} className={`aspect-[4/5] object-cover ${className ?? ""}`} loading="lazy" decoding="async" />
    );
  }
  return <SuspectPortrait spec={suspect.portrait} label={suspect.name} tone={tone} className={className} />;
}
