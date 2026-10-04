import { mulberry32 } from "@/lib/random";
import { DetectivePath } from "./Detective";

interface Building {
  x: number;
  w: number;
  h: number;
  roof: "flat" | "step" | "spire" | "tank";
}

function skyline(seed: number, count: number, minH: number, maxH: number, width = 1600): Building[] {
  const r = mulberry32(seed);
  const out: Building[] = [];
  let x = -40;
  while (x < width + 40 && out.length < count) {
    const w = 60 + r() * 130;
    const h = minH + r() * (maxH - minH);
    const roofs: Building["roof"][] = ["flat", "flat", "step", "spire", "tank"];
    out.push({ x, w, h, roof: roofs[Math.floor(r() * roofs.length)] });
    x += w + (r() < 0.25 ? 6 + r() * 20 : 0);
  }
  return out;
}

function BuildingShape({ b, ground, fill }: { b: Building; ground: number; fill: string }) {
  const top = ground - b.h;
  return (
    <g fill={fill}>
      <rect x={b.x} y={top} width={b.w} height={b.h} />
      {b.roof === "step" && <rect x={b.x + b.w * 0.2} y={top - 26} width={b.w * 0.6} height={26} />}
      {b.roof === "spire" && (
        <path d={`M${b.x + b.w * 0.42} ${top} L${b.x + b.w * 0.5} ${top - 70} L${b.x + b.w * 0.58} ${top} Z`} />
      )}
      {b.roof === "tank" && (
        <>
          <rect x={b.x + b.w * 0.6} y={top - 30} width={22} height={22} />
          <rect x={b.x + b.w * 0.6 + 3} y={top - 8} width={2} height={8} />
          <rect x={b.x + b.w * 0.6 + 17} y={top - 8} width={2} height={8} />
        </>
      )}
    </g>
  );
}

function Windows({
  buildings,
  ground,
  seed,
  warm,
  cold,
  size,
}: {
  buildings: Building[];
  ground: number;
  seed: number;
  warm: number;
  cold: number;
  size: number;
}) {
  const r = mulberry32(seed);
  const rects: React.ReactNode[] = [];
  buildings.forEach((b, bi) => {
    const cols = Math.max(2, Math.floor((b.w - 16) / (size * 2.2)));
    const rows = Math.floor((b.h - 30) / (size * 2.4));
    const gx = (b.w - cols * size * 2.2) / 2 + size * 0.6;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const roll = r();
        if (roll > warm + cold) continue;
        const isWarm = roll < warm;
        rects.push(
          <rect
            key={`${bi}-${row}-${col}`}
            x={b.x + gx + col * size * 2.2}
            y={ground - b.h + 22 + row * size * 2.4}
            width={size}
            height={size * 1.3}
            fill={isWarm ? "#f0ae55" : "#8fa6b8"}
            opacity={isWarm ? 0.55 + r() * 0.4 : 0.18 + r() * 0.2}
          />,
        );
      }
    }
  });
  return <g>{rects}</g>;
}

/**
 * Original illustrated noir skyline: three depth layers, scattered lit windows,
 * one street lamp and a lone silhouette. Pure SVG, no raster art.
 */
export function NoirCity({
  className,
  seed = 47,
  showDetective = true,
  lampX = 1385,
  align = "xMidYMax",
}: {
  className?: string;
  seed?: number;
  showDetective?: boolean;
  lampX?: number;
  /** SVG preserveAspectRatio alignment; the scene is always cropped to fill. */
  align?: "xMidYMax" | "xMaxYMax" | "xMinYMax";
}) {
  const ground = 780;
  const uid = `nc-${seed}-${align}`;
  const ref = (name: string) => `url(#${uid}-${name})`;
  const far = skyline(seed, 40, 260, 520);
  const mid = skyline(seed + 1, 30, 180, 430);
  const near = skyline(seed + 2, 22, 90, 300);

  return (
    <svg
      className={className}
      viewBox="0 0 1600 900"
      preserveAspectRatio={`${align} slice`}
      role="img"
      aria-label="A rain-dark city at night. A lone figure stands under a street lamp."
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07090c" />
          <stop offset="0.55" stopColor="#111820" />
          <stop offset="0.85" stopColor="#1d2731" />
          <stop offset="1" stopColor="#141b22" />
        </linearGradient>
        <radialGradient id={`${uid}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6d9a6" stopOpacity="0.95" />
          <stop offset="0.12" stopColor="#f0ae55" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#d98a3a" stopOpacity="0.12" />
          <stop offset="1" stopColor="#d98a3a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#718493" stopOpacity="0" />
          <stop offset="1" stopColor="#718493" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`${uid}-street`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1116" />
          <stop offset="1" stopColor="#050607" />
        </linearGradient>
        <linearGradient id={`${uid}-reflect`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0ae55" stopOpacity="0.5" />
          <stop offset="1" stopColor="#f0ae55" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill={ref("sky")} />

      {/* Far layer */}
      {far.map((b, i) => (
        <BuildingShape key={`f${i}`} b={b} ground={ground - 40} fill="#18212a" />
      ))}
      <Windows buildings={far} ground={ground - 40} seed={seed + 10} warm={0.03} cold={0.05} size={4} />
      <rect y={ground - 340} width="1600" height="300" fill={ref("haze")} />

      {/* Mid layer */}
      {mid.map((b, i) => (
        <BuildingShape key={`m${i}`} b={b} ground={ground - 10} fill="#11171e" />
      ))}
      <Windows buildings={mid} ground={ground - 10} seed={seed + 11} warm={0.05} cold={0.04} size={6} />
      <rect y={ground - 200} width="1600" height="190" fill={ref("haze")} opacity="0.7" />

      {/* Near layer */}
      {near.map((b, i) => (
        <BuildingShape key={`n${i}`} b={b} ground={ground} fill="#0a0d11" />
      ))}
      <Windows buildings={near} ground={ground} seed={seed + 12} warm={0.08} cold={0.02} size={9} />

      {/* Street */}
      <rect y={ground} width="1600" height={900 - ground} fill={ref("street")} />
      <rect x={lampX - 70} y={ground + 2} width="140" height="118" fill={ref("reflect")} opacity="0.55" />
      <rect x={lampX - 4} y={ground + 2} width="8" height="110" fill="#f0ae55" opacity="0.25" />

      {/* Lamp */}
      <circle cx={lampX} cy={ground - 330} r="260" fill={ref("halo")} />
      <g fill="#07090b">
        <rect x={lampX - 4} y={ground - 320} width="8" height="320" />
        <rect x={lampX - 12} y={ground - 10} width="24" height="10" />
        <path d={`M${lampX - 22} ${ground - 320} h44 l-8 -18 h-28 z`} />
      </g>
      <ellipse cx={lampX} cy={ground - 330} rx="15" ry="12" fill="#fbe6bf" />

      {showDetective && (
        <g transform={`translate(${lampX - 175} ${ground - 262}) scale(1.02)`}>
          <DetectivePath fill="#040506" rim="#f0ae55" />
        </g>
      )}
    </svg>
  );
}
