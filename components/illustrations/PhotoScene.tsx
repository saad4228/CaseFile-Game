import { sceneArt } from "@/data/cases/case-047/scenes";
import type { PhotoScene as Scene } from "@/lib/game-engine/types";

// Inked 400x300 scenes for photo evidence: monochrome, cold, high contrast. A photographed
// scene is placed inside the same box rather than replacing it, so the burn-in and source
// stamp still draw on top.

const INK = "#0b0e12";
const MID = "#28323b";
const LIGHT = "#56656f";
const PALE = "#8c9aa3";

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
        scenes[scene]
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
};

const scenes: Record<Scene, React.ReactNode> = {
  "room-desk": (
    <g>
      {/* wall + window light */}
      <rect width="400" height="190" fill="#222b33" />
      <path d="M250 0 L330 0 L300 190 L190 190 Z" fill="#2e3943" opacity="0.6" />
      <rect y="190" width="400" height="110" fill="#151b20" />
      {/* bed */}
      <rect x="230" y="150" width="170" height="70" fill={MID} />
      <path d="M230 150 L400 150 L400 166 L262 166 Z" fill={LIGHT} />
      <path d="M330 150 L400 150 L400 190 L360 190 Z" fill={PALE} opacity="0.5" />
      <rect x="350" y="128" width="46" height="22" rx="5" fill={PALE} />
      <rect x="366" y="133" width="10" height="7" fill="#3a2c22" />
      {/* desk */}
      <rect x="20" y="168" width="190" height="10" fill={LIGHT} />
      <rect x="28" y="178" width="8" height="80" fill={INK} />
      <rect x="194" y="178" width="8" height="80" fill={INK} />
      {/* laptop closed */}
      <rect x="40" y="160" width="62" height="8" fill="#3b4650" />
      {/* notepad, top sheet torn */}
      <rect x="110" y="162" width="28" height="6" fill={PALE} />
      <path d="M110 162 l4 -1 l3 1 l4 -1 l3 1 l4 -1 l3 1 l4 -1 l3 1" stroke={PALE} fill="none" strokeWidth="1" />
      <rect x="140" y="164" width="18" height="2" fill={INK} />
      {/* coasters + tumbler */}
      <ellipse cx="170" cy="167" rx="9" ry="2.5" fill="#6d5a45" />
      <ellipse cx="190" cy="167" rx="9" ry="2.5" fill="#6d5a45" />
      <path d="M164 152 L176 152 L174 166 L166 166 Z" fill="#9fb0bb" opacity="0.55" />
      {/* ice bucket */}
      <path d="M60 140 L84 140 L81 160 L63 160 Z" fill={LIGHT} />
      {/* chair + jacket */}
      <rect x="70" y="190" width="56" height="8" fill={INK} />
      <rect x="118" y="130" width="8" height="70" fill={INK} />
      <path d="M100 132 L132 132 L136 196 L96 196 Z" fill="#1b2025" />
      {/* bedside charger */}
      <rect x="210" y="138" width="16" height="30" fill={INK} />
      <path d="M218 138 C218 128 226 126 228 122" stroke={PALE} strokeWidth="1.2" fill="none" />
      {/* door ajar with card */}
      <rect x="0" y="40" width="16" height="190" fill={INK} />
      <rect x="16" y="40" width="6" height="190" fill={LIGHT} />
      <rect x="4" y="128" width="9" height="20" fill="#c9bb9c" />
      <rect x="6" y="133" width="5" height="1.5" fill={INK} />
      <rect x="6" y="137" width="5" height="1.5" fill={INK} />
      {/* minibar */}
      <rect x="290" y="226" width="44" height="40" fill="#1d242b" stroke={LIGHT} strokeWidth="1" />
    </g>
  ),
  lobby: (
    <g>
      <rect width="400" height="170" fill="#232c34" />
      {/* checker floor */}
      {Array.from({ length: 10 }).map((_, r) =>
        Array.from({ length: 16 }).map((__, c) =>
          (r + c) % 2 === 0 ? (
            <rect key={`${r}-${c}`} x={c * 25} y={170 + r * 13} width="25" height="13" fill="#141a1f" />
          ) : null,
        ),
      )}
      {/* reception */}
      <rect x="40" y="120" width="170" height="54" fill={INK} />
      <rect x="40" y="116" width="170" height="6" fill={LIGHT} />
      {/* clock */}
      <circle cx="125" cy="62" r="18" fill={PALE} />
      <line x1="125" y1="62" x2="125" y2="50" stroke={INK} strokeWidth="2" />
      <line x1="125" y1="62" x2="134" y2="64" stroke={INK} strokeWidth="2" />
      {/* lifts */}
      <rect x="300" y="60" width="40" height="112" fill="#384550" />
      <rect x="345" y="60" width="40" height="112" fill="#384550" />
      <line x1="320" y1="60" x2="320" y2="172" stroke={INK} />
      <line x1="365" y1="60" x2="365" y2="172" stroke={INK} />
      <circle cx="342" cy="50" r="3" fill="#f0ae55" opacity="0.7" />
      {/* doors to street (left) */}
      <rect x="0" y="50" width="26" height="124" fill="#3d4a55" />
      {/* figure in coat walking toward lifts */}
      <g fill={INK}>
        <ellipse cx="258" cy="122" rx="7" ry="8" />
        <path d="M246 134 C250 130 266 130 270 134 L276 200 L240 200 Z" />
        <path d="M250 134 C246 126 252 114 258 113 C264 114 270 126 266 134 Z" />
        <rect x="248" y="200" width="6" height="20" />
        <rect x="262" y="200" width="6" height="20" />
      </g>
    </g>
  ),
  garage: (
    <g>
      <rect width="400" height="300" fill="#1c2329" />
      <rect y="190" width="400" height="110" fill="#14191d" />
      {/* fluorescent tube */}
      <rect x="140" y="20" width="120" height="5" fill="#d8e3e8" />
      <path d="M120 25 L280 25 L360 190 L40 190 Z" fill="#9fb0bb" opacity="0.08" />
      {/* pillars */}
      <rect x="40" y="30" width="34" height="200" fill="#2a333b" />
      <rect x="330" y="30" width="34" height="200" fill="#2a333b" />
      <text x="57" y="70" textAnchor="middle" fontFamily="var(--font-plex-mono), monospace" fontSize="12" fill={PALE}>
        P2
      </text>
      {/* bay lines */}
      {[100, 190, 280].map((x) => (
        <line key={x} x1={x} y1="200" x2={x - 30} y2="300" stroke={PALE} strokeOpacity="0.4" />
      ))}
      <text x="145" y="290" fontFamily="var(--font-plex-mono), monospace" fontSize="10" fill={PALE} opacity="0.7">
        14
      </text>
      {/* sedan */}
      <path d="M110 230 L118 200 C124 188 136 182 150 182 L230 182 C246 182 256 190 262 200 L284 206 C292 208 296 214 296 222 L296 236 L110 236 Z" fill="#4a555e" />
      <path d="M140 196 L150 186 L200 186 L204 200 Z" fill="#1c2329" />
      <path d="M210 200 L208 186 L232 186 C242 186 250 192 254 200 Z" fill="#1c2329" />
      <circle cx="146" cy="238" r="13" fill={INK} />
      <circle cx="262" cy="238" r="13" fill={INK} />
      {/* two figures */}
      <g fill={INK}>
        <ellipse cx="312" cy="168" rx="7" ry="8" />
        <path d="M300 180 C304 176 320 176 324 180 L328 246 L296 246 Z" />
        <ellipse cx="88" cy="172" rx="7" ry="8" />
        <path d="M80 160 C84 152 92 152 96 160 L96 176 L80 176 Z" />
        <path d="M76 184 C80 180 96 180 100 184 L102 246 L74 246 Z" />
      </g>
    </g>
  ),
  "garage-plate": (
    <g>
      <rect width="400" height="300" fill="#161b20" />
      <path d="M40 300 L80 120 L320 120 L360 300 Z" fill="#1f262c" />
      {/* barrier arm */}
      <rect x="10" y="80" width="260" height="10" fill="#c9bb9c" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={20 + i * 36} y="80" width="16" height="10" fill="#9c2929" />
      ))}
      <rect x="270" y="70" width="24" height="120" fill="#2a333b" />
      {/* car rear */}
      <path d="M70 280 L84 170 C88 150 104 140 124 140 L276 140 C296 140 312 150 316 170 L330 280 Z" fill="#59656e" />
      <path d="M100 172 L116 150 L284 150 L300 172 Z" fill="#1a2027" />
      <rect x="86" y="196" width="40" height="14" fill="#7a2020" />
      <rect x="274" y="196" width="40" height="14" fill="#7a2020" />
      <rect x="150" y="226" width="100" height="26" fill="#d9d4c6" />
      <text x="200" y="245" textAnchor="middle" fontFamily="var(--font-plex-mono), monospace" fontSize="16" fontWeight="600" fill="#111">
        7KD-R219
      </text>
      {/* hooded driver silhouette through rear glass */}
      <path d="M176 172 C176 158 186 152 196 152 C206 152 214 158 214 172 Z" fill={INK} />
      <rect x="152" y="256" width="96" height="2" fill={INK} opacity="0.5" />
    </g>
  ),
  bar: (
    <g>
      <rect width="400" height="300" fill="#1e1a17" />
      <path d="M0 0 L400 0 L400 120 L0 120 Z" fill="#241f1b" />
      {/* pendant lamp */}
      <line x1="200" y1="0" x2="200" y2="70" stroke={INK} />
      <path d="M184 70 L216 70 L208 82 L192 82 Z" fill={INK} />
      <ellipse cx="200" cy="150" rx="150" ry="80" fill="#f0ae55" opacity="0.08" />
      {/* table */}
      <rect x="120" y="190" width="160" height="10" fill="#5b4a3a" />
      <rect x="196" y="200" width="8" height="70" fill={INK} />
      {/* booth backs */}
      <rect x="0" y="130" width="90" height="170" fill="#2c231d" />
      <rect x="310" y="130" width="90" height="170" fill="#2c231d" />
      {/* man left, facing right (Reed-like build, glasses glint) */}
      <g fill={INK}>
        <ellipse cx="108" cy="140" rx="17" ry="20" />
        <path d="M70 230 C72 186 86 168 108 164 C130 168 142 186 144 230 Z" />
      </g>
      <rect x="114" y="136" width="12" height="4" fill="#9fb2c0" opacity="0.5" />
      {/* man right, face turned away from camera */}
      <g fill={INK}>
        <ellipse cx="292" cy="138" rx="17" ry="20" />
        <path d="M252 230 C254 184 270 166 292 162 C314 166 328 184 330 230 Z" />
        <path d="M262 196 L232 186 L228 194 L258 206 Z" />
      </g>
      {/* ring */}
      <circle cx="230" cy="190" r="3.5" fill="none" stroke="#c9bb9c" strokeWidth="1.5" />
      <line x1="230" y1="186.5" x2="230" y2="193.5" stroke="#c9bb9c" strokeWidth="1" />
      {/* glasses on table */}
      <path d="M150 176 L160 176 L158 190 L152 190 Z" fill="#9fb0bb" opacity="0.4" />
      <path d="M240 178 L250 178 L248 190 L242 190 Z" fill="#9fb0bb" opacity="0.4" />
    </g>
  ),
  conservatory: (
    <g>
      <rect width="400" height="300" fill="#26302f" />
      {/* glass panes */}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="180" stroke="#101615" strokeWidth="3" />
      ))}
      <line x1="0" y1="90" x2="400" y2="90" stroke="#101615" strokeWidth="3" />
      <rect y="180" width="400" height="120" fill="#161c1b" />
      {/* planters */}
      {[30, 130, 250, 330].map((x, i) => (
        <g key={x}>
          <rect x={x} y="200" width="60" height="40" fill="#3a2f28" />
          <path d={`M${x + 6} 200 C${x + 4} 170 ${x + 20} 160 ${x + 18} 140 M${x + 30} 200 C${x + 30} 170 ${x + 40} 158 ${x + 36} 132 M${x + 50} 200 C${x + 54} 176 ${x + 46} 164 ${x + 54} 150`} stroke={i === 2 ? "#3d4e6b" : "#3f5245"} strokeWidth="5" fill="none" />
          <rect x={x + 22} y="244" width="16" height="10" fill="#c9bb9c" />
        </g>
      ))}
      {/* woman, hair in a bun */}
      <g fill={INK}>
        <circle cx="210" cy="104" r="7" />
        <ellipse cx="210" cy="122" rx="12" ry="14" />
        <path d="M188 240 C190 170 198 140 210 138 C222 140 230 170 232 240 Z" />
      </g>
      {/* door sign */}
      <rect x="360" y="40" width="32" height="12" fill="#c9bb9c" />
    </g>
  ),
  "mercer-office": (
    <g>
      <rect width="400" height="300" fill="#141a1f" />
      {/* pinned wall */}
      <rect x="10" y="10" width="230" height="170" fill="#232c33" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect
          key={i}
          x={18 + (i % 5) * 44}
          y={20 + Math.floor(i / 5) * 52}
          width={30 + (i % 3) * 8}
          height={34 + (i % 2) * 10}
          fill="#cfc8b8"
          opacity={0.75}
          transform={`rotate(${((i % 3) - 1) * 2} ${33 + (i % 5) * 44} ${37 + Math.floor(i / 5) * 52})`}
        />
      ))}
      <rect x="86" y="16" width="86" height="20" fill="#e7e2d8" />
      {/* desk and floor litter */}
      <rect y="186" width="400" height="114" fill="#0f1317" />
      <rect x="0" y="180" width="250" height="40" fill="#1d252b" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={`p${i}`} x={(i * 53) % 390} y={226 + ((i * 29) % 60)} width="30" height="20" fill="#9aa39a" opacity="0.5" />
      ))}
      {/* the one lit lamp */}
      <circle cx="330" cy="206" r="26" fill="#f0ae55" opacity="0.18" />
      <circle cx="330" cy="206" r="8" fill="#ffd79a" />
    </g>
  ),
  archive: (
    <g>
      <rect width="400" height="300" fill="#0d1115" />
      {/* shelving receding down a corridor */}
      {[0, 1].map((side) =>
        Array.from({ length: 5 }, (_, i) => {
          const x = side ? 400 - (30 + i * 26) : 30 + i * 26;
          const h = 210 - i * 28;
          return <rect key={`${side}-${i}`} x={side ? x - 24 : x} y={150 - h / 2} width="24" height={h} fill="#1b222a" stroke="#2a333c" />;
        }),
      )}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={`b${i}`} x={i < 5 ? 32 + i * 26 : 400 - (54 + (i - 5) * 26)} y={70 + (i % 5) * 34} width="20" height="22" fill="#b9b2a1" opacity="0.6" />
      ))}
      {/* caged bulb and wet floor */}
      <circle cx="200" cy="52" r="20" fill="#f0e3c0" opacity="0.2" />
      <circle cx="200" cy="52" r="6" fill="#ffeec4" />
      <rect y="232" width="400" height="68" fill="#121820" />
      <ellipse cx="200" cy="262" rx="70" ry="10" fill="#f0e3c0" opacity="0.12" />
    </g>
  ),
};
