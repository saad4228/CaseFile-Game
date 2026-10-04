/**
 * The room behind an interview (reference 3): two-tone tiled walls, a one-way mirror behind
 * the suspect, one fluorescent fixture with a hazy beam, the table edge, a red REC light.
 * Pure CSS/SVG and static except the REC blink and the flare when a story breaks.
 */
export function InterrogationRoom({ recording, flare }: { recording: boolean; flare: boolean }) {
  return (
    <div className="interrogation pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="interrogation-wall absolute inset-0" />
      {/* one-way mirror behind the suspect */}
      <div className="interrogation-mirror absolute right-[3%] top-[12%] hidden h-[46%] w-[34%] lg:block" />
      {/* fluorescent fixture and its beam */}
      <div className="absolute left-1/2 top-0 h-2 w-40 -translate-x-1/2 rounded-b-sm bg-[#e8f4f0] shadow-[0_0_30px_8px_rgba(200,235,225,.35)] lg:left-auto lg:right-[12%] lg:translate-x-0" />
      <div className={`interrogation-beam absolute top-0 h-full ${flare ? "interrogation-flare" : ""}`} />
      {/* the table edge in the foreground */}
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-[#2a2f33] to-[#0c0e10] shadow-[0_-8px_20px_rgba(0,0,0,.6)]" />
      {/* red accents: EXIT sign and the recorder */}
      <div className="absolute left-4 top-4 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-400 md:flex">
        <span className={`h-2 w-2 rounded-full bg-crimson-400 ${recording ? "rec-dot" : "opacity-40"}`} /> Rec
      </div>
      <div className="absolute right-4 top-3 hidden rounded-sm border border-crimson-400/60 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.2em] text-crimson-400 shadow-[0_0_16px_rgba(194,74,63,.45)] lg:block">
        EXIT
      </div>
    </div>
  );
}
