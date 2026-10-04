/**
 * The Blackwood Hotel (reference 6): a narrow nine-storey brick corner building, a red neon
 * sign on the roof, a fire escape, a blue blade sign for the Mercury Bar, and one lit window
 * on the third floor — Room 314. Drawn in a 200×520 box so it can sit in a skyline or alone.
 * No filters: neon glow is layered strokes.
 */
export function BlackwoodFacade({ lit314 = true, uid }: { lit314?: boolean; uid: string }) {
  const floors = 8; // above the lobby
  const cols = 4;
  const winW = 22;
  const winH = 30;
  const top = 70;
  const floorH = 46;
  const windows: React.ReactNode[] = [];
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const x = 22 + c * 42;
      const y = top + f * floorH;
      const storey = floors - f + 1; // lobby is 1
      const is314 = storey === 3 && c === 3;
      const dimLit = (f * 7 + c * 3) % 11 === 0;
      windows.push(
        <g key={`${f}-${c}`}>
          <rect x={x - 2} y={y - 3} width={winW + 4} height={4} fill="#2a211b" />
          <rect
            x={x}
            y={y}
            width={winW}
            height={winH}
            fill={is314 && lit314 ? "#ffcf7e" : dimLit ? "#8a6a3a" : "#0b0d10"}
            opacity={is314 && lit314 ? 1 : dimLit ? 0.55 : 1}
          />
          {is314 && lit314 && <rect x={x} y={y} width={winW / 2} height={winH} fill="#e7b065" opacity="0.6" />}
          <line x1={x + winW / 2} y1={y} x2={x + winW / 2} y2={y + winH} stroke="#1a1512" strokeWidth="1.5" />
        </g>,
      );
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-brick`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1c1612" />
          <stop offset="0.75" stopColor="#15110e" />
          <stop offset="1" stopColor="#0d0b09" />
        </linearGradient>
        <radialGradient id={`${uid}-314`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffcf7e" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffcf7e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* body, cornice and corner pilasters */}
      <rect x="0" y="40" width="200" height="480" fill={`url(#${uid}-brick)`} />
      <rect x="-6" y="34" width="212" height="10" fill="#211a15" />
      <rect x="0" y="40" width="8" height="480" fill="#120e0b" />
      <rect x="192" y="40" width="8" height="480" fill="#0b0907" />
      {/* brick courses */}
      {Array.from({ length: 30 }, (_, i) => (
        <line key={i} x1="8" x2="192" y1={56 + i * 15} y2={56 + i * 15} stroke="#000" strokeOpacity="0.18" />
      ))}
      {windows}
      {lit314 && <circle cx={22 + 3 * 42 + winW / 2} cy={top + 6 * floorH + winH / 2} r="34" fill={`url(#${uid}-314)`} />}
      {/* lobby: awning and door light */}
      <rect x="0" y="448" width="200" height="72" fill="#0e0b09" />
      <path d="M40 452 h120 l10 16 h-140 z" fill="#3b1416" />
      <rect x="84" y="470" width="32" height="50" fill="#e7b065" opacity="0.55" />
      <rect x="84" y="470" width="32" height="50" fill="none" stroke="#2a211b" strokeWidth="3" />
      {/* fire escape down the side */}
      <g stroke="#06070a" strokeWidth="2" fill="none">
        {Array.from({ length: 7 }, (_, i) => {
          const y = 104 + i * floorH;
          return (
            <g key={i}>
              <line x1="200" y1={y} x2="222" y2={y} />
              <line x1="222" y1={y} x2="222" y2={y - 12} />
              <line x1={i % 2 ? 200 : 222} y1={y} x2={i % 2 ? 222 : 200} y2={y + floorH} />
            </g>
          );
        })}
      </g>
      {/* roof sign: red neon */}
      <g fontFamily="var(--font-bodoni), serif" textAnchor="middle">
        <rect x="18" y="-6" width="164" height="40" fill="#0a0809" stroke="#1d1517" />
        {[
          { w: 7, o: 0.12 },
          { w: 3.5, o: 0.3 },
        ].map((g) => (
          <text key={g.w} x="100" y="24" fontSize="24" letterSpacing="3" fill="none" stroke="#ff3b4a" strokeWidth={g.w} strokeOpacity={g.o}>
            BLACKWOOD
          </text>
        ))}
        <text x="100" y="24" fontSize="24" letterSpacing="3" fill="#ffd0d4">
          BLACKWOOD
        </text>
        <text x="100" y="-12" fontSize="11" letterSpacing="6" fill="#ff8a94" opacity="0.9">
          HOTEL
        </text>
      </g>
      {/* Mercury Bar blade sign, blue */}
      <g transform="translate(-26 300)">
        <rect width="20" height="110" fill="#0a0c10" stroke="#1d2a3a" />
        <rect x="-6" y="-6" width="32" height="122" fill="#5fb4ff" opacity="0.06" />
        <text x="10" y="18" fontFamily="var(--font-plex-mono), monospace" fontSize="11" fill="#9fd2ff" textAnchor="middle" writingMode="tb" letterSpacing="2">
          MERCURY
        </text>
      </g>
    </g>
  );
}

/** The Blackwood alone on its corner at night: fog, one sodium lamp and its cone of light. */
export function BlackwoodHotel({ className, lit314 = true, bare = false }: { className?: string; lit314?: boolean; bare?: boolean }) {
  const uid = bare ? "bw-bare" : "bw-solo";
  return (
    <svg className={className} viewBox="0 0 420 640" role="img" aria-label="The Blackwood Hotel at night. One window on the third floor is lit.">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1416" />
          <stop offset="1" stopColor="#152427" />
        </linearGradient>
        <linearGradient id={`${uid}-cone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0ae55" stopOpacity="0.4" />
          <stop offset="1" stopColor="#f0ae55" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={`${uid}-fog`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7f9aa0" stopOpacity="0" />
          <stop offset="1" stopColor="#7f9aa0" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      {!bare && (
        <>
          <rect width="420" height="640" fill={`url(#${uid}-sky)`} />
          {/* neighbours */}
          <rect x="0" y="260" width="120" height="380" fill="#0c1214" />
          <rect x="350" y="300" width="70" height="340" fill="#0c1214" />
        </>
      )}
      <g transform="translate(150 80)">
        <BlackwoodFacade lit314={lit314} uid={uid} />
      </g>
      {/* street, lamp and cone */}
      {!bare && <rect y="600" width="420" height="40" fill="#07090b" />}
      <path d="M66 196 L-40 600 L200 600 L76 196 Z" fill={`url(#${uid}-cone)`} opacity="0.75" />
      <rect x="68" y="190" width="5" height="410" fill="#05070a" />
      <path d="M58 186 h26 l-5 -10 h-16 z" fill="#05070a" />
      <circle cx="71" cy="192" r="5" fill="#ffd9a0" />
      <circle cx="71" cy="192" r="28" fill="#ffc777" opacity="0.12" />
      <rect y="500" width="420" height="140" fill={`url(#${uid}-fog)`} />
      {/* wet street reflections */}
      <rect x="230" y="604" width="40" height="30" fill="#e7b065" opacity="0.12" />
      <rect x="62" y="604" width="18" height="34" fill="#f0ae55" opacity="0.2" />
    </svg>
  );
}
