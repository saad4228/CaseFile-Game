"use client";

import { PhotoScene } from "@/components/illustrations/PhotoScene";
import { SuspectPhoto } from "@/components/illustrations/SuspectPhoto";
import { RecordIcon } from "@/components/ui/RecordIcon";
import { mulberry32 } from "@/lib/random";
import type { Evidence, Suspect } from "@/lib/game-engine/types";
import { evidenceCode } from "./format";

/**
 * Renders a record as the physical object it is: a police statement form, a lab report on
 * letterhead, a ticket stub, a tractor-feed printout, a CCTV monitor, a cassette, a phone.
 *
 * `speaker` is the person a statement was taken from, so the form can carry their photograph.
 */
export function EvidenceBody({
  e,
  zoom = 1,
  rotate = 0,
  compact = false,
  speaker,
  place,
}: {
  e: Evidence;
  zoom?: number;
  rotate?: number;
  compact?: boolean;
  speaker?: Suspect;
  place?: string;
}) {
  return (
    <div className="relative">
      <Body e={e} zoom={zoom} rotate={rotate} compact={compact} speaker={speaker} place={place} />
      {!compact && <EvidenceTag e={e} />}
    </div>
  );
}

function Body({
  e,
  zoom,
  rotate,
  compact,
  speaker,
  place,
}: {
  e: Evidence;
  zoom: number;
  rotate: number;
  compact: boolean;
  speaker?: Suspect;
  place?: string;
}) {
  const b = e.body;
  switch (b.kind) {
    case "statement": {
      const revised = /revised/i.test(e.title);
      return (
        <div className="paper relative mx-auto max-w-2xl overflow-hidden pb-8">
          <FormHeader left="Vesper City PD" right={`Witness statement · ${evidenceCode(e.number)}`} />
          <div className="px-6 pt-6 md:px-10">
            {/* Ruled intake block: the particulars on the left, the photograph taped alongside. */}
            <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
              <dl className="self-start border border-[#1d1a14]/50 font-mono text-[12px] text-[#1d1a14]">
                <Field label="Name" value={b.speaker} strong />
                <Field label="Age" value={speaker?.age != null ? String(speaker.age) : "—"} />
                <Field label="Occupation" value={speaker?.role ?? "—"} />
                <Field label="Relation" value={speaker?.relation ?? "—"} />
                <Field label="Taken" value={b.takenAt} />
                <Field label="Taken by" value={e.source.replace(/^.*?—\s*/, "")} />
                <Field label="Case" value="047 — Blackwood Hotel, Room 314" />
                <Field label="Ref" value={evidenceCode(e.number)} last />
              </dl>
              {speaker && (
                <figure className="mx-auto w-36 shrink-0 sm:mx-0">
                  {/* Tape belongs to the photograph, not to the whole column — anchored to the
                      figure it sat across the caption below. */}
                  <div className="relative">
                    <Tape className="-top-2 left-1/2 -translate-x-1/2 -rotate-2" />
                    <div className="photo-print rotate-1">
                      <SuspectPhoto suspect={speaker} tight className="block w-full" />
                    </div>
                    <Tape className="-bottom-2 left-1/2 -translate-x-1/2 rotate-1" />
                  </div>
                  <figcaption className="mt-6 border border-[#1d1a14]/50 px-2 py-1.5">
                    <Fingerprints />
                    <p className="mt-1 text-center font-mono text-[8px] uppercase tracking-[0.18em] text-[#1d1a14]/55">
                      Prints on file
                    </p>
                  </figcaption>
                </figure>
              )}
            </div>
            <div className="mt-6 space-y-4 border-t-2 border-[#1d1a14]/70 pt-5">
              {b.quotes.map((q, i) => (
                <p key={i} className="font-mono text-[13px] leading-relaxed text-[#1d1a14] md:text-sm">
                  <span className="mr-3 text-[#1d1a14]/45">Q{i + 1}</span>“{q}”
                </p>
              ))}
            </div>
            <div className="mt-8 flex items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="font-hand text-3xl leading-none text-[#1f2c55]">{b.speaker}</p>
                <p className="mt-1 border-t border-[#1d1a14]/40 pt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#1d1a14]/55">
                  Signature of witness
                </p>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1d1a14]/55">{e.source}</p>
            </div>
          </div>
          {revised && <RubberStamp className="right-6 top-16 rotate-[-12deg]">Revised</RubberStamp>}
        </div>
      );
    }
    case "document": {
      if (/ticket/i.test(e.title)) return <TicketStub e={e} heading={b.heading} lines={b.lines} footer={b.footer} />;
      return (
        <AgencyForm
          e={e}
          office={OFFICE[e.category] ?? "Records office"}
          initials={sealInitials(e.source)}
          heading={b.heading}
          lines={b.lines}
          footer={b.footer}
          place={place}
        />
      );
    }
    case "handwritten":
      return (
        <div className="relative mx-auto max-w-xl">
          <div className="paper-aged aged-edges relative px-8 py-10">
            <div className="space-y-2" style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 37px, rgba(40,60,110,.22) 37px 38px)" }}>
              {b.lines.map((l, i) => (
                <p key={i} className="font-hand text-[30px] leading-[38px] text-[#1f2c55]" style={{ transform: `rotate(${((i % 3) - 1) * 0.4}deg)` }}>
                  {l}
                </p>
              ))}
            </div>
            {/* a fold crease across the page */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[#1d1a14]/15 shadow-[0_1px_0_rgba(255,255,255,.25)]" aria-hidden="true" />
          </div>
        </div>
      );
    case "log": {
      const printout = e.category === "HOTEL" || e.category === "DIGITAL" || e.category === "LOCATION";
      const table = (
        <table className={`w-full font-mono text-[#1d1a14] ${compact ? "text-[11px]" : "min-w-[520px] text-[12px]"}`}>
          <thead>
            <tr className="border-b-2 border-[#1d1a14]/40 text-left">
              {b.columns.map((c) => (
                <th key={c} scope="col" className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.15em]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i} className={`align-top ${printout ? (i % 2 ? "" : "bg-[#9bb89a]/25") : "border-b border-[#1d1a14]/15"}`}>
                {r.cells.map((c, j) => (
                  <td key={j} className="px-2 py-2 tabular-nums">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      return (
        <div className="mx-auto max-w-3xl">
          {/keycard/i.test(e.title) && <KeycardArt />}
          {printout ? (
            <div className="printout relative mx-auto overflow-x-auto px-9 py-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1d1a14]/60">
                {e.source} · printed {e.time ?? "—"}
              </p>
              {table}
              {b.note && <p className="mt-4 font-mono text-[11px] leading-relaxed text-[#1d1a14]/80">{b.note}</p>}
            </div>
          ) : (
            <div className="paper relative overflow-x-auto pb-6">
              <FormHeader left={e.category === "BANK" ? "Statement of account" : e.source} right={evidenceCode(e.number)} />
              <div className="px-4 pt-4 md:px-8">{table}</div>
              {b.note && <p className="mt-4 px-4 font-mono text-[11px] leading-relaxed text-[#1d1a14]/80 md:px-8">{b.note}</p>}
            </div>
          )}
        </div>
      );
    }
    case "photo": {
      const cctv = e.category === "CCTV";
      const scene = (
        <PhotoScene
          scene={b.scene}
          className="block w-full"
          cctv={cctv && e.time ? { cam: `CAM ${e.source.match(/camera ([A-Z0-9][A-Z0-9-]*)/)?.[1] ?? "BOOTH"}`, time: `${e.time}:00` } : undefined}
          stamp={!cctv ? `${e.source.toUpperCase()}` : undefined}
        />
      );
      return (
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden">
            <div className="mx-auto max-w-2xl transition-transform duration-300" style={{ transform: `scale(${zoom}) rotate(${rotate}deg)`, transformOrigin: "center" }}>
              {cctv ? (
                <div className="crt">
                  <div className="crt-glass scanlines">{scene}</div>
                  <div className="mt-2 flex items-center justify-between px-1 font-mono text-[9px] uppercase tracking-[0.25em] text-steel-400">
                    <span>Vesper Security Systems</span>
                    <span className="flex items-center gap-1.5">
                      <span className="rec-dot h-2 w-2 rounded-full bg-crimson-400" /> Playback
                    </span>
                  </div>
                </div>
              ) : (
                <div className="photo-print">
                  {scene}
                  <p className="mt-2 text-center font-hand text-2xl leading-none text-[#3a3428]">{b.caption}</p>
                </div>
              )}
            </div>
          </div>
          {cctv && <p className="mt-3 text-center font-mono text-[11px] text-steel-300">{b.caption}</p>}
          <div className="paper mx-auto mt-6 max-w-2xl px-6 py-5">
            <p className="label-ink">In frame</p>
            <ul className="mt-3 space-y-2">
              {b.inFrame.map((l, i) => (
                <li key={i} className="font-mono text-[12.5px] leading-relaxed text-[#1d1a14]">
                  — {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    case "audio":
      return (
        <div className="mx-auto max-w-2xl">
          <Cassette label={e.title} duration={b.duration} />
          <div className="paper mt-6 px-6 py-6">
            <p className="label-ink">Transcript</p>
            <ul className="mt-3 space-y-2">
              {b.transcript.map((l, i) => (
                <li key={i} className="font-mono text-[13px] leading-relaxed text-[#1d1a14]">
                  {l}
                </li>
              ))}
            </ul>
            {b.note && <p className="mt-5 border-t border-[#1d1a14]/20 pt-3 font-mono text-[11px] text-[#1d1a14]/75">{b.note}</p>}
          </div>
        </div>
      );
    case "messages":
      return (
        <div className="phone mx-auto w-full max-w-[320px]">
          <div className="phone-screen space-y-3 px-4 py-5">
            <p className="text-center font-mono text-[9px] uppercase tracking-[0.25em] text-steel-400">{e.source}</p>
            {b.thread.map((m, i) => (
              <div key={i} className={i % 2 ? "ml-8" : "mr-8"}>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-steel-400">
                  {m.from} · {m.time}
                </p>
                <p className={`mt-1 rounded-xl px-3 py-2 text-[13px] ${i % 2 ? "bg-[#2b4b6f] text-bone-100" : "bg-ink-700 text-bone-100"}`}>{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
  }
}

/** Black header bar of an official form. */
/** Which desk inside the issuing body a record came off, by the kind of record it is. */
const OFFICE: Partial<Record<Evidence["category"], string>> = {
  DOCUMENT: "Records office",
  FORENSIC: "Forensic services",
  HOTEL: "Internal records",
  PHONE: "Subscriber services",
  DIGITAL: "Technical services",
  BANK: "Accounts division",
  NEWS: "Editorial",
};

/** Seal letters, taken from the capitals of the issuing body: "Vesper City PD" reads VCPD. */
function sealInitials(source: string) {
  const body = source.split("—")[0];
  return (body.match(/[A-Z]/g) ?? ["V"]).join("").slice(0, 4);
}

/** The issuing body's seal, embossed at the head of a form. */
function AgencySeal({ initials }: { initials: string }) {
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

/** A filing barcode. Deterministic from the record number, so a record always looks the same. */
function Barcode({ seed }: { seed: number }) {
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

/**
 * A record that arrived as an agency form rather than loose prose: seal and letterhead, the
 * particulars ruled off, the filing status boxed, a case-file panel, and the body typed in
 * underneath as notes.
 */
function AgencyForm({
  e,
  office,
  initials,
  heading,
  lines,
  footer,
  place,
}: {
  e: Evidence;
  office: string;
  initials: string;
  heading?: string;
  lines: string[];
  footer?: string;
  place?: string;
}) {
  return (
    <div className="paper-sheet relative mx-auto max-w-2xl">
    <div className="paper-form worn-edge relative overflow-hidden pb-8">
      {/* letterhead */}
      <div className="flex items-start gap-3 border-b-2 border-[#1d1a14]/70 px-6 py-4 md:px-9">
        <AgencySeal initials={initials} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[13px] font-semibold uppercase leading-tight tracking-[0.1em] text-[#1d1a14] md:text-[15px]">
            {e.source.split("—")[0].trim()}
          </p>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#1d1a14]/60">{office}</p>
        </div>
        <div className="shrink-0 border border-[#1d1a14]/60 text-center">
          <p className="border-b border-[#1d1a14]/40 px-3 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-[#1d1a14]/60">
            Form {evidenceCode(e.number).replace("#", "VC-")}
          </p>
          <p className="px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-crimson-600">Restricted</p>
        </div>
      </div>

      <div className="px-6 pt-5 md:px-9">
        {heading && (
          <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1d1a14]">
            {heading} <span className="text-crimson-600">{evidenceCode(e.number)}</span>
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
          <dl className="self-start border border-[#1d1a14]/50 font-mono text-[12px] text-[#1d1a14]">
            <Field label="Issued by" value={e.source} />
            <Field label="Location" value={place ?? "—"} />
            <Field label="Time" value={e.time ?? "—"} />
            <Field label="Case" value="047" last />
          </dl>
          <div className="shrink-0 border border-[#1d1a14]/50 px-3 py-2 text-center">
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#1d1a14]/60">Case file</p>
            <div className="mt-1 w-40">
              <Barcode seed={e.number} />
            </div>
            <p className="mt-1 font-mono text-[10px] tracking-[0.1em] text-[#1d1a14]">
              VCPD-047-{String(e.number).padStart(3, "0")}
            </p>
          </div>
        </div>

        {/* filing status, as the source declared it */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1d1a14]/60">Status</p>
          <p className="bg-[#1d1a14] px-4 py-1 font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-[#e9e4d8]">
            {e.reliability}
          </p>
          <p className="ml-auto border border-crimson-600/70 px-2.5 py-1 text-center font-mono text-[8px] uppercase leading-tight tracking-[0.14em] text-crimson-600">
            Do not duplicate
            <br />
            Distribution limited
          </p>
        </div>

        <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-[#1d1a14]/60">Notes</p>
        <div className="mt-2 space-y-3 border-t border-[#1d1a14]/25 pt-3">
          {lines.map((l, i) => (
            <p key={i} className="font-mono text-[13px] leading-relaxed text-[#1d1a14]">
              {l}
            </p>
          ))}
        </div>
        {footer && (
          <p className="mt-6 border-t border-[#1d1a14]/20 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1d1a14]/60">
            {footer}
          </p>
        )}
      </div>
      {/* Punched and filed, like everything else in the case folder. */}
      <PunchHoles />
    </div>
    </div>
  );
}

/** One ruled row of a filled-in form: label boxed off from the entry, as a typist left it. */
function Field({ label, value, strong, last }: { label: string; value: string; strong?: boolean; last?: boolean }) {
  return (
    <div className={`grid grid-cols-[112px_1fr] ${last ? "" : "border-b border-[#1d1a14]/30"}`}>
      <dt className="border-r border-[#1d1a14]/30 px-2.5 py-1.5 uppercase tracking-[0.12em] text-[#1d1a14]/55">{label}</dt>
      <dd className={`px-2.5 py-1.5 ${strong ? "font-semibold" : ""}`}>{value}</dd>
    </div>
  );
}

/** A torn strip of gummed tape holding a photograph to the page. */
function Tape({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute z-10 h-5 w-14 bg-[#ded3ac]/75 shadow-[0_1px_2px_rgba(0,0,0,.3)] ${className}`}
      style={{ clipPath: "polygon(4% 0%, 96% 5%, 100% 95%, 2% 100%)" }}
    />
  );
}

/** Two inked prints in the corner of the intake form. Drawn, like the rest of the furniture. */
function Fingerprints() {
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

function FormHeader({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#1d1a14] px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#e9e4d8] md:px-10">
      <span className="truncate">{left}</span>
      <span className="shrink-0 text-[#e9e4d8]/70">{right}</span>
    </div>
  );
}

function RubberStamp({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`stamp pointer-events-none absolute text-sm text-crimson-600 md:text-base ${className}`} style={{ transform: undefined }}>
      {children}
    </span>
  );
}

function PunchHoles() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-1.5 flex flex-col justify-center gap-28" aria-hidden="true">
      <span className="h-3 w-3 rounded-full bg-ink-950/80 shadow-[inset_0_1px_2px_rgba(0,0,0,.8)]" />
      <span className="h-3 w-3 rounded-full bg-ink-950/80 shadow-[inset_0_1px_2px_rgba(0,0,0,.8)]" />
    </div>
  );
}


/** Ticket stub with perforated ends (reference 10E). */
function TicketStub({ e, heading, lines, footer }: { e: Evidence; heading?: string; lines: string[]; footer?: string }) {
  return (
    <div className="ticket relative mx-auto max-w-2xl px-10 py-8 md:px-14">
      <div className="border-2 border-[#1d1a14]/70 px-5 py-5 md:px-8">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[#1d1a14]/60">{e.source}</p>
        <p className="mt-2 text-center font-display text-3xl uppercase tracking-[0.12em] text-[#1d1a14] md:text-4xl">Service ticket</p>
        <div className="mx-auto mt-3 h-px w-2/3 bg-[#1d1a14]/40" />
        {heading && <p className="mt-4 text-center font-mono text-xs font-semibold tracking-[0.12em] text-[#1d1a14]">{heading}</p>}
        <div className="mt-4 space-y-2">
          {lines.map((l, i) => (
            <p key={i} className="font-mono text-[12.5px] leading-relaxed text-[#1d1a14]">
              {l}
            </p>
          ))}
        </div>
        {footer && <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#1d1a14]/60">{footer}</p>}
      </div>
      <span className="absolute right-5 top-5 h-4 w-4 rounded-full bg-ink-950/85 shadow-[inset_0_1px_2px_rgba(0,0,0,.8)]" aria-hidden="true" />
    </div>
  );
}

/** A Blackwood Hotel master keycard, drawn above the keycard register. */
function KeycardArt() {
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
function Cassette({ label, duration }: { label: string; duration: string }) {
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
function EvidenceTag({ e }: { e: Evidence }) {
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

function Waveform() {
  const bars = [3, 6, 4, 9, 14, 8, 5, 11, 16, 12, 7, 4, 10, 18, 9, 6, 13, 7, 3, 5, 8, 4, 2, 3];
  return (
    <svg viewBox="0 0 120 24" className="h-8 flex-1" aria-hidden="true">
      {bars.map((h, i) => (
        <rect key={i} x={i * 5} y={12 - h / 2} width="3" height={h} fill="#d98a3a" opacity={0.4 + (h / 18) * 0.6} />
      ))}
    </svg>
  );
}
