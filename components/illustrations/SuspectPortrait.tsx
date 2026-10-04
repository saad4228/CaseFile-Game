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
  const bg = tone === "warm" ? ["#5a4630", "#2a2119"] : ["#4b5a66", "#1b232b"];
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
      {/* height chart lines, like a booking photo */}
      {[30, 50, 70, 90, 110, 130].map((y) => (
        <line key={y} x1="0" x2="120" y1={y} y2={y} stroke="#e7e2d8" strokeOpacity="0.07" />
      ))}
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
