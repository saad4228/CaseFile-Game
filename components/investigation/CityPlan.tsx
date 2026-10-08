// Vesper City itself: the blocks, the avenues cut through them, the river, the district
// names and the road north. None of it moves or responds — it is the paper the case is
// drawn on, so it lives apart from the pins and routes that do.

const W = 1000;
const H = 680;

/** District names sit where nothing else does, so they never cross a pin or its label. */
const DISTRICTS: { name: string; x: number; y: number }[] = [
  { name: "SIGNAL HILL", x: 150, y: 196 },
  { name: "PRINTWORKS", x: 790, y: 160 },
  { name: "CIVIC CENTRE", x: 700, y: 268 },
  { name: "OLD QUARTER", x: 400, y: 432 },
  { name: "WESTBANK", x: 112, y: 556 },
];

export function CityPlan({
  blocks,
  hotel,
}: {
  blocks: { x: number; y: number; w: number; h: number; tone: number }[];
  hotel: { x: number; y: number };
}) {
  return (
    <>

          <rect width={W} height={H} fill="url(#map-glow)" />
          <rect width={W} height={H} fill="url(#map-tooth)" />

          {/* the blocks, and the streets that are the gaps between them */}
          {blocks.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx="1.5"
              fill={b.tone > 0.86 ? "#1b242d" : "#141c24"}
              stroke="#1e2831"
              strokeWidth="1"
            />
          ))}

          {/* two avenues cut across the grid */}
          <path d="M-20 300 L1020 232" stroke="#0c1015" strokeWidth="13" fill="none" />
          <path d="M300 -20 L470 700" stroke="#0c1015" strokeWidth="13" fill="none" />

          {/* the Vesper */}
          <path d="M-20 596 C180 556 340 638 520 600 C690 564 800 650 1020 628 L1020 700 L-20 700 Z" fill="#0d1a24" />
          <path d="M-20 596 C180 556 340 638 520 600 C690 564 800 650 1020 628" fill="none" stroke="#28404f" strokeWidth="2" />
          <path d="M452 566 L470 650" stroke="#2c3842" strokeWidth="7" />
          <text x="446" y="676" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="2" fill="#4a6273">
            CALDER BRIDGE
          </text>
          <text x="120" y="652" fontFamily="var(--font-display)" fontStyle="italic" fontSize="21" fill="#3d5a70">
            River Vesper
          </text>

          {DISTRICTS.map((d) => (
            <text
              key={d.name}
              x={d.x}
              y={d.y}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="10"
              letterSpacing="4.5"
              fill="#36434f"
            >
              {d.name}
            </text>
          ))}

          {/* the road out of town */}
          <path d={`M${hotel.x} ${hotel.y} L520 54 L520 18`} stroke="#1a222a" strokeWidth="7" fill="none" />
          <text x="534" y="34" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.5" fill="#56656f">
            ↑ HWY 9 · LAKEMOOR, 2 H
          </text>
    </>
  );
}
