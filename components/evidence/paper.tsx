import { RecordIcon } from "@/components/ui/RecordIcon";
import { mulberry32 } from "@/lib/random";
import type { Evidence } from "@/lib/game-engine/types";
import { evidenceCode } from "./format";

// The stationery an evidence record is printed on: seals, barcodes, tape, punch holes and
// the objects a record arrives as. Presentation only — nothing here knows the case.

/** Seal letters from the issuer's capitals: "Vesper City PD" reads VCPD. */
export function sealInitials(source: string) {
  const body = source.split("—")[0];
  return (body.match(/[A-Z]/g) ?? ["V"]).join("").slice(0, 4);
}

/** The issuing body's seal, embossed at the head of a form. */
export function AgencySeal({ initials }: { initials: string }) {
  return (
    <svg viewBox="0 0 56 56" className="h-11 w-11 shrink-0" aria-hidden="true">
      <circle cx="28" cy="28" r="26" fill="none" stroke="#1d1a14" strokeOpacity="0.55" strokeWidth="1.4" />
      <circle cx="28" cy="28" r="21" fill="none" stroke="#1d1a14" strokeOpacity="0.45" strokeWidth="0.7" />
      {Array.from({ length: 36 }).map((_, i) => (
        <line
          key={i}
          x1="28"
          y1="3.5"
          x2="28"
          y2="6.5"
          stroke="#1d1a14"
          strokeOpacity="0.35"
          strokeWidth="0.8"
          transform={`rotate(${i * 10} 28 28)`}
        />
      ))}
      <text
        x="28"
        y="33"
        textAnchor="middle"
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="13"
        fontWeight="600"
        letterSpacing="0.5"
        fill="#1d1a14"
        fillOpacity="0.7"
      >
        {initials}
      </text>
    </svg>
  );
}

/** Filing barcode, seeded by record number so a record always looks the same. */
export function Barcode({ seed }: { seed: number }) {
  const rand = mulberry32(seed * 977 + 13);
  let x = 0;
  const bars: { x: number; w: number }[] = [];
  while (x < 158) {
    const w = 0.8 + Math.floor(rand() * 3) * 0.8;
    bars.push({ x, w });
    x += w + 0.8 + Math.floor(rand() * 2) * 0.8;
  }
  return (
    <svg viewBox="0 0 160 30" className="block h-7 w-full" aria-hidden="true">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="30" fill="#1d1a14" fillOpacity="0.8" />
      ))}
    </svg>
  );
}

/** One ruled row of a filled-in form. */
export function Field({ label, value, strong, last }: { label: string; value: string; strong?: boolean; last?: boolean }) {
  return (
    <div className={`grid grid-cols-[112px_1fr] ${last ? "" : "border-b border-[#1d1a14]/30"}`}>
      <dt className="border-r border-[#1d1a14]/30 px-2.5 py-1.5 uppercase tracking-[0.12em] text-[#1d1a14]/55">{label}</dt>
      <dd className={`px-2.5 py-1.5 ${strong ? "font-semibold" : ""}`}>{value}</dd>
    </div>
  );
}

/** A torn strip of gummed tape holding a photograph to the page. */
export function Tape({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute z-10 h-5 w-14 bg-[#ded3ac]/75 shadow-[0_1px_2px_rgba(0,0,0,.3)] ${className}`}
      style={{ clipPath: "polygon(4% 0%, 96% 5%, 100% 95%, 2% 100%)" }}
    />
  );
}

/** Two inked fingerprints for the intake form. */
export function Fingerprints() {
  return (
    <svg viewBox="0 0 96 46" className="block h-10 w-full" aria-hidden="true">
      {[26, 70].map((cx, n) => (
        <g key={cx} fill="none" stroke="#1d1a14" strokeOpacity="0.5" strokeWidth="0.7">
          {[4, 7, 10, 13, 16, 19].map((r, i) => (
            <ellipse key={r} cx={cx} cy="23" rx={r * 0.7} ry={r} transform={`rotate(${(i % 2 ? -5 : 5) + (n ? 3 : -3)} ${cx} 23)`} />
          ))}
          <path d={`M${cx - 4} 23 q4 -6 8 0`} strokeWidth="0.9" />
        </g>
      ))}
    </svg>
  );
}

export function FormHeader({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#1d1a14] px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#e9e4d8] md:px-10">
      <span className="truncate">{left}</span>
      <span className="shrink-0 text-[#e9e4d8]/70">{right}</span>
    </div>
  );
}

export function RubberStamp({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`stamp pointer-events-none absolute text-sm text-crimson-600 md:text-base ${className}`} style={{ transform: undefined }}>
      {children}
    </span>
  );
}

export function PunchHoles() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-1.5 flex flex-col justify-center gap-28" aria-hidden="true">
      <span className="h-3 w-3 rounded-full bg-ink-950/80 shadow-[inset_0_1px_2px_rgba(0,0,0,.8)]" />
      <span className="h-3 w-3 rounded-full bg-ink-950/80 shadow-[inset_0_1px_2px_rgba(0,0,0,.8)]" />
    </div>
  );
}

/** A Blackwood Hotel master keycard, drawn above the keycard register. */
export function KeycardArt() {
  return (
    <svg viewBox="0 0 340 214" className="mx-auto mb-6 block w-64 -rotate-6 drop-shadow-[0_18px_20px_rgba(0,0,0,.6)]" role="img" aria-label="A Blackwood Hotel keycard">
      <defs>
        <linearGradient id="kc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#23262b" />
          <stop offset="0.55" stopColor="#15171a" />
          <stop offset="1" stopColor="#0c0d0f" />
        </linearGradient>
        <linearGradient id="kc-glare" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="338" height="212" rx="16" fill="url(#kc)" stroke="#3a3328" />
      <rect x="1" y="80" width="338" height="34" fill="url(#kc-glare)" />
      <text x="170" y="92" textAnchor="middle" fontFamily="var(--font-bodoni), serif" fontSize="34" fill="#c9a46a" fontStyle="italic">
        Blackwood
      </text>
      <text x="170" y="116" textAnchor="middle" fontFamily="var(--font-plex-mono), monospace" fontSize="10" letterSpacing="5" fill="#c9a46a" opacity="0.8">
        HOTEL · VESPER CITY
      </text>
      <path d="M26 40 l18 -14 v28 z" fill="#c9a46a" opacity="0.85" />
      <text x="52" y="44" fontFamily="var(--font-plex-mono), monospace" fontSize="8" fill="#c9a46a" opacity="0.7">
        INSERT THIS END
      </text>
      <text x="314" y="190" textAnchor="end" fontFamily="var(--font-plex-mono), monospace" fontSize="12" letterSpacing="3" fill="#e7e2d8" opacity="0.75">
        MASTER · MGR
      </text>
    </svg>
  );
}

/** Voicemail as a cassette in an evidence player (reference 4B). */
export function Cassette({ label, duration }: { label: string; duration: string }) {
  return (
    <div className="panel px-5 py-6 md:px-8">
      <svg viewBox="0 0 320 200" className="mx-auto block w-full max-w-sm" role="img" aria-label={`Cassette: ${label}`}>
        <rect x="4" y="4" width="312" height="192" rx="12" fill="#1a1c20" stroke="#3a3f47" strokeWidth="2" />
        <rect x="26" y="20" width="268" height="96" rx="6" fill="#e9e1c9" />
        <rect x="26" y="20" width="268" height="18" fill="#c24a3f" />
        <text x="40" y="33" fontFamily="var(--font-plex-mono), monospace" fontSize="9" letterSpacing="2" fill="#fff">
          VCPD EVIDENCE · AUDIO
        </text>
        <text x="40" y="62" fontFamily="var(--font-reenie), cursive" fontSize="22" fill="#1f2c55">
          {label.length > 28 ? `${label.slice(0, 27)}…` : label}
        </text>
        <rect x="80" y="74" width="160" height="34" rx="17" fill="#121417" />
        <circle cx="112" cy="91" r="12" fill="#e9e1c9" />
        <circle cx="208" cy="91" r="12" fill="#e9e1c9" />
        <circle cx="112" cy="91" r="5" fill="#121417" />
        <circle cx="208" cy="91" r="5" fill="#121417" />
        <path d="M70 196 l18 -42 h144 l18 42" fill="#24272c" stroke="#3a3f47" />
        <circle cx="108" cy="178" r="5" fill="#0c0d0f" />
        <circle cx="212" cy="178" r="5" fill="#0c0d0f" />
      </svg>
      <div className="mt-5 flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-amber-500 text-amber-300" aria-hidden="true">
          ▶
        </span>
        <Waveform />
        <span className="font-mono text-sm text-steel-300">{duration}</span>
      </div>
      <p className="label mt-4">Recording held by the lab — transcript and analyst note below</p>
    </div>
  );
}

/** Manila evidence tag tied to the record (every record). */
export function EvidenceTag({ e }: { e: Evidence }) {
  return (
    <div className="pointer-events-none absolute -right-2 -top-6 z-10 hidden rotate-[8deg] sm:block" aria-hidden="true">
      <svg viewBox="0 0 40 30" className="absolute -left-8 top-3 h-8 w-10">
        <path d="M2 4 C14 2 20 18 38 16" fill="none" stroke="#c9b48a" strokeWidth="1.4" />
      </svg>
      <div className="paper-aged relative w-32 px-3 pb-2 pt-3 [clip-path:polygon(12%_0,100%_0,100%_100%,0_100%,0_18%)]">
        <span className="absolute left-2.5 top-2 h-2.5 w-2.5 rounded-full bg-ink-950/80" />
        <p className="pl-3 font-mono text-[8px] uppercase tracking-[0.2em] text-[#1d1a14]/70">VCPD Evidence</p>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold text-[#1d1a14]">
          <RecordIcon category={e.category} className="h-3.5 w-3.5" />
          {evidenceCode(e.number)}
        </p>
        <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#1d1a14]/60">Case 047</p>
      </div>
    </div>
  );
}

export function Waveform() {
  const bars = [3, 6, 4, 9, 14, 8, 5, 11, 16, 12, 7, 4, 10, 18, 9, 6, 13, 7, 3, 5, 8, 4, 2, 3];
  return (
    <svg viewBox="0 0 120 24" className="h-8 flex-1" aria-hidden="true">
      {bars.map((h, i) => (
        <rect key={i} x={i * 5} y={12 - h / 2} width="3" height={h} fill="#d98a3a" opacity={0.4 + (h / 18) * 0.6} />
      ))}
    </svg>
  );
}
