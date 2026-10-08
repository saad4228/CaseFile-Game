import { sceneArt } from "@/data/cases/case-047/scenes";
import type { PhotoScene as Scene } from "@/lib/game-engine/types";
import { sceneDrawings } from "./scene-drawings";

// Inked 400x300 scenes for photo evidence: monochrome, cold, high contrast. A photographed
// scene is placed inside the same box rather than replacing it, so the burn-in and source
// stamp still draw on top.


export function PhotoScene({
  scene,
  className,
  cctv,
  stamp,
  slice,
}: {
  scene: Scene;
  className?: string;
  /** Crop to fill the box instead of fitting it. */
  slice?: boolean;
  /** Overlay a CCTV timestamp/camera burn-in. */
  cctv?: { cam: string; time: string };
  stamp?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 400 300" preserveAspectRatio={slice ? "xMidYMid slice" : undefined} role="img" aria-label={labels[scene]}>
      <rect width="400" height="300" fill="#1a2128" />
      {sceneArt[scene] ? (
        <image href={sceneArt[scene]} x="0" y="0" width="400" height="300" preserveAspectRatio="xMidYMid slice" />
      ) : (
        sceneDrawings[scene]
      )}
      {cctv && (
        <g fontFamily="var(--font-plex-mono), monospace" fontSize="11" fill="#e7e2d8" opacity="0.85">
          {/* camera viewfinder corner brackets */}
          <path
            d="M6 34V26h10 M384 26h10v8 M394 266v8h-10 M16 274H6v-8"
            fill="none"
            stroke="#e7e2d8"
            strokeWidth="1.5"
            opacity="0.7"
            transform="translate(0 0)"
          />
          <text x="10" y="18">{cctv.cam}</text>
          <text x="390" y="18" textAnchor="end">
            NOV 14 {cctv.time}
          </text>
          <circle cx="12" cy="288" r="3.5" fill="#c24a3f" />
          <text x="20" y="292" fontSize="9">REC</text>
        </g>
      )}
      {stamp && (
        <text x="390" y="292" textAnchor="end" fontFamily="var(--font-plex-mono), monospace" fontSize="9" fill="#e7e2d8" opacity="0.6">
          {stamp}
        </text>
      )}
    </svg>
  );
}

const labels: Record<Scene, string> = {
  "room-desk": "Room 314: a writing desk with a laptop and a single tumbler, a turned-down bed, a chair with a jacket, and the door ajar.",
  lobby: "Hotel lobby: reception desk under a wall clock, a woman crossing the floor toward the lifts.",
  garage: "Underground garage level P2: a grey sedan in bay 14, two figures beside it.",
  "garage-plate": "A grey sedan stopped at a garage entry barrier, one occupant, plate 7KD-R219.",
  bar: "A bar booth: two men facing each other, one turned away from the camera.",
  conservatory: "A rooftop glasshouse with planters and hand-lettered labels; a woman among the plants.",
  "mercer-office": "A ransacked rented room: a wall of pinned clippings headed CASE 019, papers across the floor, one desk lamp still lit.",
  archive: "A sub-basement corridor of steel shelving packed with numbered evidence boxes, behind a padlocked gate marked CALDER STREET STORAGE.",
  jarrow: "A police press conference: a composed man in late middle age at a Vesper County podium, a signet ring on his little finger.",
  porter: "A hotel corridor at night: the night porter in the open doorway of 314, his hand still on the handle, the Do Not Disturb card hanging beside it.",
  brother: "A creased police booking photograph from 2013, clipped to a file card: a tired man holding a Vesper County board.",
  prison: "A prison visiting room: a man alone at a long table, barred light across it, the chair opposite him empty.",
  trial: "A courtroom at the moment of a verdict, seen from the public gallery: the defendant standing with his back to the room.",
  "b2-door": "A basement service corridor under the hotel, ending at a steel door stencilled B2 with a keycard reader beside it.",
  daniel: "A journalist working alone at a cluttered desk late at night, writing in a pocket notebook under one lamp.",
  tray: "A hotel corridor: the manager walking away from the camera with a turndown tray, one glass and one chocolate on it.",
  police: "Room 314 photographed from the corridor: officers inside, evidence markers on the carpet, one tumbler on the desk.",
};
