import { useId } from "react";
import type { PortraitSpec } from "@/lib/game-engine/types";

/**
 * Original inked bust silhouette on photo stock. Identity comes from shape — hair,
 * collar, hat, glasses — never from a face.
 */
export function SuspectPortrait({
  spec,
  className,
  label,
  tone = "cold",
}: {
  spec: PortraitSpec;
  className?: string;
  label?: string;
  tone?: "cold" | "warm";
}) {
  const id = `p${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const bg = spec.backdrop
    ? BACKDROP_BG[spec.backdrop]
    : tone === "warm"
      ? ["#5a4630", "#2a2119"]
      : ["#4b5a66", "#1b232b"];
  return (
    <svg className={className} viewBox="0 0 120 150" role="img" aria-label={label ?? "Suspect photograph"}>
      <defs>
        <radialGradient id={`${id}-bg`} cx="0.65" cy="0.3" r="0.9">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#f0ae55" stopOpacity="0.9" />
          <stop offset="0.25" stopColor="#f0ae55" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="120" height="150" fill={`url(#${id}-bg)`} />
      {spec.backdrop ? (
        <Backdrop kind={spec.backdrop} id={id} />
      ) : (
        /* height chart lines, like a booking photo */
        [30, 50, 70, 90, 110, 130].map((y) => <line key={y} x1="0" x2="120" y1={y} y2={y} stroke="#e7e2d8" strokeOpacity="0.07" />)
      )}
      <g fill="#07090b">
        <Shoulders collar={spec.collar} />
        <ellipse cx="60" cy="62" rx="19" ry="23" />
        <rect x="52" y="78" width="16" height="16" />
        <Hair hair={spec.hair} />
        {spec.hat && (
          <path d="M30 50 C30 46 40 44 44 43 L45 28 C50 23 70 23 75 28 L76 43 C80 44 90 46 90 50 C90 54 75 55 60 55 C45 55 30 54 30 50 Z" />
        )}
      </g>
      {/* rim light */}
      <ellipse cx="60" cy="62" rx="19" ry="23" fill={`url(#${id}-rim)`} opacity="0.5" />
      {spec.glasses && (
        <g stroke="#9fb2c0" strokeOpacity="0.55" strokeWidth="1.2" fill="none">
          <rect x="45" y="58" width="12" height="7" />
          <rect x="63" y="58" width="12" height="7" />
          <line x1="57" y1="61" x2="63" y2="61" />
        </g>
      )}
      {spec.unknown && (
        <text
          x="60"
          y="78"
          textAnchor="middle"
          fontFamily="var(--font-bodoni), serif"
          fontSize="40"
          fill="#d4c5a5"
          opacity="0.85"
        >
          ?
        </text>
      )}
    </svg>
  );
}

function Shoulders({ collar }: { collar: PortraitSpec["collar"] }) {
  switch (collar) {
    case "coat":
      return <path d="M6 150 C8 118 22 100 46 92 L60 112 L74 92 C98 100 112 118 114 150 Z M46 92 L40 84 L54 96 Z M74 92 L80 84 L66 96 Z" />;
    case "suit":
      return (
        <>
          <path d="M8 150 C10 120 24 102 47 95 L60 118 L73 95 C96 102 110 120 112 150 Z" />
          <path d="M56 100 L60 118 L64 100 L60 96 Z" fill="#20262d" />
        </>
      );
    case "turtleneck":
      return <path d="M10 150 C12 120 26 104 48 98 L48 86 L72 86 L72 98 C94 104 108 120 110 150 Z" />;
    case "blouse":
      return <path d="M14 150 C16 122 30 106 50 99 L60 108 L70 99 C90 106 104 122 106 150 Z" />;
    case "hood":
      return <path d="M4 150 C6 116 20 98 38 92 C34 78 36 60 46 48 L74 48 C84 60 86 78 82 92 C100 98 114 116 116 150 Z" />;
  }
}

function Hair({ hair }: { hair: PortraitSpec["hair"] }) {
  switch (hair) {
    case "short":
      return <path d="M40 58 C38 40 48 34 60 34 C72 34 82 40 80 58 C76 48 70 44 60 44 C50 44 44 48 40 58 Z" />;
    case "long":
      return <path d="M38 62 C34 38 48 32 60 32 C74 32 86 38 82 62 L86 104 L74 100 L76 64 C72 50 66 46 60 46 C54 46 48 50 44 64 L46 100 L34 104 Z" />;
    case "bun":
      return (
        <>
          <circle cx="60" cy="33" r="9" />
          <path d="M40 60 C38 42 48 37 60 37 C72 37 82 42 80 60 C76 50 70 47 60 47 C50 47 44 50 40 60 Z" />
        </>
      );
    case "swept":
      return <path d="M40 56 C40 38 52 33 64 34 C76 35 84 44 80 58 C74 46 64 42 52 46 C47 48 43 51 40 56 Z" />;
    case "none":
      return null;
  }
}

const BACKDROP_BG: Record<NonNullable<PortraitSpec["backdrop"]>, [string, string]> = {
  newsroom: ["#6a5236", "#1f1812"],
  lobby: ["#7a5528", "#24170c"],
  skyline: ["#2c4560", "#0a121c"],
  street: ["#1f3c44", "#071014"],
  lamp: ["#4a3a26", "#0b0d10"],
};

/** The place behind a suspect — drawn as flat shapes, behind the silhouette. */
function Backdrop({ kind, id }: { kind: NonNullable<PortraitSpec["backdrop"]>; id: string }) {
  switch (kind) {
    case "newsroom":
      // a wall of pinned clippings, warm desk light from the left
      return (
        <g>
          {[
            [6, 10, 26, 18, -4],
            [36, 6, 22, 28, 3],
            [64, 12, 30, 20, -2],
            [96, 8, 20, 26, 5],
            [8, 34, 20, 24, 2],
            [86, 40, 28, 18, -3],
          ].map(([x, y, w, h, r], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="#e8dcc0" opacity="0.28" transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`} />
          ))}
          {[[18, 12], [46, 8], [78, 14], [104, 10]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.6" fill="#b3282a" />
          ))}
          <ellipse cx="0" cy="40" rx="60" ry="50" fill="#f0ae55" opacity="0.18" />
        </g>
      );
    case "lobby":
      // two table lamps and a brass sign
      return (
        <g>
          <rect x="36" y="8" width="48" height="12" fill="#2a1a0c" stroke="#c9a46a" strokeOpacity="0.7" strokeWidth="0.8" />
          <text x="60" y="16.5" textAnchor="middle" fontSize="5.5" letterSpacing="1.2" fill="#c9a46a" fontFamily="var(--font-bodoni), serif">
            BLACKWOOD
          </text>
          {[14, 106].map((x) => (
            <g key={x}>
              <circle cx={x} cy="44" r="22" fill={`url(#${id}-lamp)`} />
              <path d={`M${x - 8} 48 L${x + 8} 48 L${x + 5} 38 L${x - 5} 38 Z`} fill="#f5d39a" opacity="0.85" />
            </g>
          ))}
          <defs>
            <radialGradient id={`${id}-lamp`}>
              <stop offset="0" stopColor="#ffcf86" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffcf86" stopOpacity="0" />
            </radialGradient>
          </defs>
        </g>
      );
    case "skyline":
      // an office window onto the night city
      return (
        <g>
          {[
            [4, 40, 16, 110],
            [22, 22, 14, 128],
            [40, 52, 18, 98],
            [66, 30, 12, 120],
            [82, 46, 18, 104],
            [102, 26, 16, 124],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="#0b1420" />
          ))}
          {Array.from({ length: 34 }, (_, i) => (
            <rect key={i} x={6 + ((i * 37) % 108)} y={30 + ((i * 53) % 70)} width="2" height="2.4" fill="#f0c27a" opacity={0.35 + ((i * 7) % 5) / 10} />
          ))}
          <path d="M0 0 H120 M0 75 H120 M60 0 V150" stroke="#05080d" strokeWidth="3" />
          <text x="112" y="10" textAnchor="end" fontSize="4.5" letterSpacing="1" fill="#9fb2c0" opacity="0.6" fontFamily="var(--font-plex-mono), monospace">
            REED MEDIA
          </text>
        </g>
      );
    case "street":
      // rain and a cyan neon strip on a wet street
      return (
        <g>
          <rect x="104" y="14" width="5" height="64" fill="#5fe0e6" opacity="0.75" />
          <rect x="98" y="10" width="17" height="72" fill="#5fe0e6" opacity="0.12" />
          {Array.from({ length: 26 }, (_, i) => (
            <line key={i} x1={(i * 29) % 120} y1={(i * 41) % 110} x2={((i * 29) % 120) - 3} y2={((i * 41) % 110) + 12} stroke="#bfe9ef" strokeOpacity="0.22" strokeWidth="0.6" />
          ))}
          <rect x="0" y="126" width="120" height="24" fill="#5fe0e6" opacity="0.05" />
        </g>
      );
    case "lamp":
      // a street lamp in fog
      return (
        <g>
          <circle cx="100" cy="22" r="26" fill={`url(#${id}-halo)`} />
          <rect x="98.5" y="24" width="3" height="126" fill="#05070a" />
          <path d="M93 20 h14 l-3 -8 h-8 z" fill="#05070a" />
          <circle cx="100" cy="22" r="3.5" fill="#ffd9a0" />
          <defs>
            <radialGradient id={`${id}-halo`}>
              <stop offset="0" stopColor="#ffc777" stopOpacity="0.6" />
              <stop offset="1" stopColor="#ffc777" stopOpacity="0" />
            </radialGradient>
          </defs>
        </g>
      );
  }
}

/** Just the silhouette (head, hair, hat, shoulders) in the portrait's 120×150 space. */
export function PortraitShape({ spec, fill = "#07090b" }: { spec: PortraitSpec; fill?: string }) {
  return (
    <g fill={fill}>
      <Shoulders collar={spec.collar} />
      <ellipse cx="60" cy="62" rx="19" ry="23" />
      <rect x="52" y="78" width="16" height="16" />
      <Hair hair={spec.hair} />
      {spec.hat && (
        <path d="M30 50 C30 46 40 44 44 43 L45 28 C50 23 70 23 75 28 L76 43 C80 44 90 46 90 50 C90 54 75 55 60 55 C45 55 30 54 30 50 Z" />
      )}
    </g>
  );
}
