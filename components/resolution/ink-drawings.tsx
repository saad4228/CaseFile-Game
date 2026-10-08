import type { InkDetail as Kind } from "@/lib/game-engine/types";

// What each close-up looks like when no drawn panel is on file for it. Black ink on paper
// white, light as hatching, 400x240 — the same box a supplied panel is placed in.

const ink = "#0b0b0c";

/** Radiating hatch lines around a light source. */
function Hatch({ cx, cy, r0, r1, n = 36 }: { cx: number; cy: number; r0: number; r1: number; n?: number }) {
  return (
    <g stroke={ink} strokeWidth="1.2" opacity="0.85">
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const j = (i * 37) % 11;
        return <line key={i} x1={cx + Math.cos(a) * (r0 + j)} y1={cy + Math.sin(a) * (r0 + j)} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} />;
      })}
    </g>
  );
}

export const inkDrawings: Record<Kind, React.ReactNode> = {
  console: (
    <g>
      <rect x="0" y="150" width="400" height="90" fill={ink} />
      <rect x="40" y="30" width="150" height="100" fill={ink} />
      {Array.from({ length: 18 }, (_, i) => (
        <line key={i} x1="48" x2="182" y1={40 + i * 5} y2={40 + i * 5 + ((i * 7) % 3)} stroke="#f1ede4" strokeWidth={1 + (i % 3) * 0.6} opacity="0.7" />
      ))}
      <text x="50" y="124" fontFamily="var(--font-plex-mono), monospace" fontSize="11" fill="#f1ede4">3F-EAST · NO SIGNAL</text>
      {[230, 270, 310, 350].map((x, i) => (
        <g key={x}>
          <rect x={x - 10} y="160" width="20" height="40" fill="#f1ede4" />
          <rect x={x - 5} y={i === 1 ? 182 : 164} width="10" height="14" fill={ink} />
        </g>
      ))}
      <path d="M262 130 C250 118 250 98 268 92 L300 88 C312 86 320 96 314 106 L292 116 L284 166 C283 174 270 175 268 167 Z" fill="#f1ede4" stroke={ink} strokeWidth="3" />
    </g>
  ),
  glass: (
    <g>
      <rect width="400" height="240" fill={ink} />
      <ellipse cx="200" cy="124" rx="150" ry="96" fill="#f1ede4" />
      <ellipse cx="200" cy="124" rx="150" ry="96" fill="none" stroke={ink} strokeWidth="4" />
      <circle cx="160" cy="124" r="40" fill="none" stroke={ink} strokeWidth="4" />
      <circle cx="160" cy="124" r="32" fill="#9c2929" />
      <ellipse cx="148" cy="112" rx="10" ry="6" fill="#f1ede4" opacity="0.5" />
      <rect x="226" y="104" width="58" height="40" rx="4" fill={ink} transform="rotate(-12 255 124)" />
      <path d="M232 140 l50 -10" stroke="#f1ede4" strokeWidth="2" />
      <text x="200" y="210" textAnchor="middle" fontFamily="var(--font-plex-mono), monospace" fontSize="10" letterSpacing="3" fill={ink}>
        WITH THE COMPLIMENTS OF THE MANAGEMENT
      </text>
    </g>
  ),
  keycard: (
    <g>
      <rect x="120" y="0" width="200" height="240" fill="#d8d3c8" />
      <rect x="120" y="0" width="200" height="240" fill="none" stroke={ink} strokeWidth="4" />
      <rect x="190" y="70" width="70" height="120" rx="8" fill={ink} />
      <circle cx="245" cy="88" r="5" fill="#f1ede4" />
      <rect x="168" y="120" width="120" height="44" fill="#f1ede4" stroke={ink} strokeWidth="4" transform="rotate(-8 228 142)" />
      <text x="180" y="148" fontFamily="var(--font-plex-mono), monospace" fontSize="14" fontWeight="700" fill={ink} transform="rotate(-8 228 142)">MGR-01</text>
      <text x="168" y="40" fontFamily="var(--font-bodoni), serif" fontSize="28" fill={ink}>314</text>
      <rect x="250" y="20" width="56" height="28" fill={ink} />
      <text x="278" y="38" textAnchor="middle" fontFamily="var(--font-plex-mono), monospace" fontSize="8" fill="#f1ede4">DO NOT</text>
      <text x="278" y="46" textAnchor="middle" fontFamily="var(--font-plex-mono), monospace" fontSize="8" fill="#f1ede4">DISTURB</text>
    </g>
  ),
  door: (
    <g>
      <rect width="400" height="240" fill={ink} />
      <path d="M150 20 L250 20 L250 240 L150 240 Z" fill="#1d1d1f" />
      <path d="M150 20 L196 34 L196 240 L150 240 Z" fill="#f1ede4" />
      <Hatch cx={175} cy={120} r0={40} r1={140} n={40} />
      <text x="292" y="80" fontFamily="var(--font-display), serif" fontSize="34" fontStyle="italic" fill="#f1ede4" transform="rotate(-8 300 80)">ting—</text>
      <text x="300" y="120" fontFamily="var(--font-display), serif" fontSize="34" fontStyle="italic" fill="#f1ede4" transform="rotate(-8 300 120)">tong</text>
    </g>
  ),
  window: <g />, // drawn by the Blackwood illustration in the reveal panel
  stairs: (
    <g>
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <rect x={i * 70 - 20} y={40 + i * 34} width="130" height="34" fill={i % 2 ? "#d8d3c8" : "#c9c3b6"} stroke={ink} strokeWidth="2" />
        </g>
      ))}
      <path d="M120 96 C120 80 150 76 178 82 L206 92 C214 96 210 108 200 108 L130 108 C122 108 120 104 120 96 Z" fill={ink} />
      <path d="M210 150 C210 134 240 130 268 136 L296 146 C304 150 300 162 290 162 L220 162 C212 162 210 158 210 150 Z" fill={ink} />
      {[0, 1, 2].map((k) => (
        <line key={k} x1={330 + k * 14} y1="40" x2={300 + k * 14} y2="200" stroke={ink} strokeWidth="2" opacity="0.6" />
      ))}
      <text x="64" y="30" fontFamily="var(--font-plex-mono), monospace" fontSize="10" letterSpacing="2" fill={ink}>SERVICE STAIR B</text>
    </g>
  ),
  river: (
    <g>
      <rect width="400" height="240" fill={ink} />
      {[0, 1, 2, 3].map((k) => (
        <ellipse key={k} cx="200" cy="190" rx={30 + k * 34} ry={8 + k * 7} fill="none" stroke="#f1ede4" strokeWidth={2 - k * 0.35} opacity={0.9 - k * 0.2} />
      ))}
      <rect x="186" y="110" width="28" height="50" rx="5" fill="#f1ede4" transform="rotate(18 200 135)" />
      <rect x="190" y="116" width="20" height="36" rx="2" fill={ink} transform="rotate(18 200 135)" />
      <path d="M220 20 C230 40 236 60 228 76 L210 96 C204 100 196 96 198 88 L206 62" fill="none" stroke="#f1ede4" strokeWidth="3" />
      <text x="20" y="226" fontFamily="var(--font-plex-mono), monospace" fontSize="10" letterSpacing="2" fill="#f1ede4" opacity="0.7">THE VESPER · 23:58</text>
    </g>
  ),
  printout: (
    <g>
      <rect x="40" y="150" width="320" height="90" fill={ink} />
      <rect x="110" y="10" width="180" height="170" fill="#f8f5ee" stroke={ink} strokeWidth="3" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x="126" y={28 + i * 16} width={110 + ((i * 23) % 40)} height="5" fill={ink} opacity="0.75" />
      ))}
      {[3, 5].map((i) => (
        <rect key={i} x="120" y={24 + i * 16} width="160" height="12" fill={ink} />
      ))}
      <rect x="250" y="64" width="110" height="10" rx="4" fill={ink} transform="rotate(-24 300 70)" />
      <text x="128" y="172" fontFamily="var(--font-plex-mono), monospace" fontSize="9" fill={ink}>DOOR REPORT · ROOM 314 · 01:06</text>
    </g>
  ),
  monkshood: (
    <g>
      <rect y="150" width="400" height="90" fill={ink} />
      {/* glasshouse bars behind a tall hooded stem */}
      {[60, 140, 260, 340].map((x) => <rect key={x} x={x} y="10" width="3" height="140" fill={ink} opacity="0.5" />)}
      <path d="M200 236 L200 70" stroke={ink} strokeWidth="4" />
      {[80, 108, 136].map((y, i) => (
        <path key={y} d={`M200 ${y} q${i % 2 ? 26 : -26} -14 ${i % 2 ? 30 : -30} 10 q${i % 2 ? -8 : 8} 18 ${i % 2 ? -30 : 30} 8 Z`} fill={ink} />
      ))}
      {[170, 196].map((y) => (
        <path key={y} d={`M200 ${y} l-48 22 M200 ${y} l48 22`} stroke={ink} strokeWidth="3" fill="none" />
      ))}
      <rect x="250" y="190" width="94" height="34" fill="none" stroke={ink} strokeWidth="3" />
    </g>
  ),
  handover: (
    <g>
      <rect y="150" width="400" height="90" fill={ink} />
      <rect x="0" y="86" width="400" height="18" fill={ink} />
      {/* two hands meeting below the table edge */}
      <path d="M40 184 C40 162 80 154 118 162 L176 176 C190 180 186 198 172 198 L56 198 C46 198 40 192 40 184 Z" fill="none" stroke={ink} strokeWidth="3" />
      <path d="M360 190 C360 168 320 160 282 168 L224 182 C210 186 214 204 228 204 L344 204 C354 204 360 198 360 190 Z" fill="none" stroke={ink} strokeWidth="3" />
      <rect x="182" y="176" width="36" height="14" rx="2" fill={ink} />
    </g>
  ),
  ledger: (
    <g>
      <rect y="150" width="400" height="90" fill={ink} />
      {/* a statement, four identical rows, a ruler held under one */}
      <rect x="40" y="24" width="300" height="190" fill="none" stroke={ink} strokeWidth="3" />
      <line x1="56" y1="58" x2="324" y2="58" stroke={ink} strokeWidth="3" />
      {[84, 112, 140, 168].map((y) => (
        <g key={y}>
          <line x1="56" y1={y} x2="324" y2={y} stroke={ink} strokeWidth="1.5" />
          <rect x="250" y={y - 12} width="60" height="8" fill={ink} />
        </g>
      ))}
      <rect x="30" y="186" width="330" height="16" rx="2" fill={ink} />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1={44 + i * 30} y1="186" x2={44 + i * 30} y2="194" stroke="#f1ede4" strokeWidth="1.5" />
      ))}
    </g>
  ),
  contract: (
    <g>
      <rect y="150" width="400" height="90" fill={ink} />
      {/* a county document, a pen finishing a signature */}
      <path d="M24 164 L250 140 L276 226 L50 240 Z" fill="none" stroke={ink} strokeWidth="3" />
      <circle cx="74" cy="176" r="13" fill="none" stroke={ink} strokeWidth="2.5" />
      {[192, 202, 212].map((y) => <line key={y} x1="64" y1={y} x2="250" y2={y - 6} stroke={ink} strokeWidth="1.5" />)}
      <path d="M186 186 q22 -14 36 2" fill="none" stroke={ink} strokeWidth="2.5" />
      <path d="M232 112 L268 164" stroke={ink} strokeWidth="5" />
      {/* the resting hand, and the ring on it */}
      <path d="M296 196 C296 172 334 164 364 172 L396 182 L396 220 L310 220 C300 220 296 206 296 196 Z" fill="none" stroke={ink} strokeWidth="3" />
      <circle cx="332" cy="192" r="11" fill="none" stroke={ink} strokeWidth="3" />
      <line x1="332" y1="179" x2="332" y2="205" stroke={ink} strokeWidth="3" />
    </g>
  ),
  envelope: (
    <g>
      <rect y="150" width="400" height="90" fill={ink} />
      {/* envelope mid-slide, a ringed hand behind it */}
      <path d="M120 186 L280 170 L300 206 L140 222 Z" fill="none" stroke={ink} strokeWidth="3" />
      <path d="M120 186 L214 202 L280 170" fill="none" stroke={ink} strokeWidth="2" />
      <path d="M300 182 C300 160 338 152 366 160 L396 170 L396 206 L312 206 C302 206 300 192 300 182 Z" fill="none" stroke={ink} strokeWidth="3" />
      <circle cx="336" cy="180" r="11" fill="none" stroke={ink} strokeWidth="3" />
      <line x1="336" y1="167" x2="336" y2="193" stroke={ink} strokeWidth="3" />
    </g>
  ),
  burner: (
    <g>
      <rect y="150" width="400" height="90" fill={ink} />
      {/* windscreen, garage pillars beyond */}
      <path d="M40 20 L360 20 L330 120 L70 120 Z" fill="none" stroke={ink} strokeWidth="3" />
      {[110, 200, 290].map((x) => (
        <rect key={x} x={x} y={34} width="18" height="76" fill={ink} opacity="0.85" />
      ))}
      {/* the seat and the phone on it, lit and unanswered */}
      <path d="M60 240 C60 180 120 164 200 164 L340 164 L340 240 Z" fill="none" stroke={ink} strokeWidth="3" />
      <rect x="208" y="176" width="44" height="60" rx="5" fill={ink} />
      <rect x="214" y="182" width="32" height="26" fill="none" stroke="#f1ede4" strokeWidth="2" />
    </g>
  ),
  "dying-call": (
    <g>
      <rect y="150" width="400" height="90" fill={ink} />
      {/* an opening hand on the carpet */}
      <path d="M96 196 C96 170 132 160 168 168 L246 186 C262 190 258 212 242 212 L112 212 C100 212 96 206 96 196 Z" fill="none" stroke={ink} strokeWidth="3" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${120 + i * 26} 212 q-8 14 2 22`} fill="none" stroke={ink} strokeWidth="2.5" />
      ))}
      {/* the phone, still lit */}
      <rect x="150" y="150" width="96" height="52" rx="6" fill={ink} />
      <rect x="158" y="158" width="80" height="36" rx="3" fill="none" stroke="#f1ede4" strokeWidth="2" />
      <circle cx="198" cy="176" r="8" fill="#f1ede4" />
    </g>
  ),
  ring: (
    <g>
      <rect y="150" width="400" height="90" fill={ink} />
      {/* hand resting on a bar table, glass beside it */}
      <path d="M60 150 C60 128 96 120 130 126 L200 140 C214 144 210 162 196 162 L74 162 C64 162 60 158 60 150 Z" fill="none" stroke={ink} strokeWidth="3" />
      <rect x="250" y="96" width="62" height="66" rx="3" fill="none" stroke={ink} strokeWidth="3" />
      <path d="M250 128 L312 128" stroke={ink} strokeWidth="2" />
      {/* the mark itself */}
      <circle cx="128" cy="150" r="13" fill="none" stroke={ink} strokeWidth="3" />
      <line x1="128" y1="135" x2="128" y2="165" stroke={ink} strokeWidth="3" />
    </g>
  ),
};
