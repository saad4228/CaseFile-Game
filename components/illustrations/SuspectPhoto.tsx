import { portraitArt, portraitArtTight } from "@/data/cases/case-047/portraits";
import type { PortraitSpec, Suspect } from "@/lib/game-engine/types";
import { SuspectPortrait } from "./SuspectPortrait";

/**
 * One portrait by id: the painted image when one is on file, the drawn silhouette otherwise.
 * Keyed by id rather than by suspect so the victim — who has no entry in suspects.ts — can
 * use the same path.
 */
export function PortraitImage({
  id,
  name,
  spec,
  className,
  tone,
  /** Rendered small (a list thumbnail, the lobby wall): prefer the head-and-shoulders crop. */
  tight,
}: {
  id: string;
  name: string;
  spec: PortraitSpec;
  className?: string;
  tone?: "cold" | "warm";
  tight?: boolean;
}) {
  const art = (tight && portraitArtTight[id]) || portraitArt[id];
  if (art) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small local portraits, sized by the parent
      <img src={art} alt={name} className={`aspect-[4/5] object-cover ${className ?? ""}`} loading="lazy" decoding="async" />
    );
  }
  return <SuspectPortrait spec={spec} label={name} tone={tone} className={className} />;
}

/** A suspect's portrait. */
export function SuspectPhoto({
  suspect,
  className,
  tone,
  tight,
}: {
  suspect: Suspect;
  className?: string;
  tone?: "cold" | "warm";
  tight?: boolean;
}) {
  return (
    <PortraitImage id={suspect.id} name={suspect.name} spec={suspect.portrait} className={className} tone={tone} tight={tight} />
  );
}
