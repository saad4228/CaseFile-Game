"use client";

import { PhotoScene } from "@/components/illustrations/PhotoScene";
import { SuspectPhoto } from "@/components/illustrations/SuspectPhoto";
import type { Evidence, Suspect } from "@/lib/game-engine/types";
import { evidenceCode } from "./format";
import {
  AgencySeal,
  Barcode,
  Cassette,
  EvidenceTag,
  Field,
  Fingerprints,
  FormHeader,
  KeycardArt,
  PunchHoles,
  RubberStamp,
  Tape,
  sealInitials,
} from "./paper";

/**
 * Renders a record as the physical object it is: a police form, an agency report, a ticket
 * stub, a printout, a CCTV monitor, a cassette, a phone.
 *
 * `speaker` is the person a statement was taken from, so the form can carry their photo.
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

/** Which desk inside the issuing body a record came from. */
const OFFICE: Partial<Record<Evidence["category"], string>> = {
  DOCUMENT: "Records office",
  FORENSIC: "Forensic services",
  HOTEL: "Internal records",
  PHONE: "Subscriber services",
  DIGITAL: "Technical services",
  BANK: "Accounts division",
  NEWS: "Editorial",
};

/** A record filed on agency letterhead: seal, particulars, status, case panel, typed notes. */
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
