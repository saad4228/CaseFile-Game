import { SuspectPortrait } from "@/components/illustrations/SuspectPortrait";
import { Reveal } from "@/components/ui/Reveal";
import { SectionMark } from "@/components/ui/SectionMark";
import { Stamp } from "@/components/ui/Stamp";
import { meta } from "@/data/cases/case-047/meta";

const fields: [string, string][] = [
  ["Status", "Active"],
  ["Victim", meta.victim.name],
  ["Location", "Blackwood Hotel"],
  ["Time", meta.time],
  ["Suspects", String(meta.counts.suspects).padStart(2, "0")],
  ["Evidence", String(meta.counts.evidence).padStart(2, "0")],
];

export function SectionCase() {
  return (
    <section className="relative overflow-hidden py-28 md:py-40" aria-labelledby="case-heading">
      <div className="mx-auto grid max-w-[1400px] items-center gap-16 px-4 md:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
        <Reveal>
          <SectionMark n="01" label="The case" />
          <h2
            id="case-heading"
            className="font-display mt-8 text-5xl leading-[0.95] text-balance md:text-7xl"
          >
            A locked room.
            <br />
            <em className="text-amber-300">A missing phone.</em>
            <br />
            Seven seconds.
          </h2>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-bone-100/75">
            {meta.victim.name} spent four months reopening cases that were supposed to stay closed.
            On the night of November 14 he made one last call from Room 314 of the Blackwood Hotel. It
            lasted seven seconds. By midnight, he was dead.
          </p>
          <p className="mt-6 max-w-lg font-mono text-xs uppercase leading-relaxed tracking-[0.2em] text-steel-300">
            Objective — {meta.objective}
          </p>
        </Reveal>

        <Reveal delay={0.15} className="relative mx-auto w-full max-w-xl">
          {/* folder */}
          <div className="paper-aged relative rotate-[1.2deg] px-6 pb-10 pt-12 md:px-10">
            <div className="paper-aged absolute -top-7 left-8 px-5 pb-2 pt-2 font-mono text-xs tracking-[0.3em] text-paper-900">
              CASE {meta.number}
            </div>
            <div className="paper torn relative -rotate-[1.6deg] px-6 py-8 md:px-9 md:py-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="label-ink">Case {meta.number}</p>
                  <p className="font-display mt-2 text-4xl uppercase leading-none tracking-wide text-[#1d1a14] md:text-5xl">
                    {meta.title}
                  </p>
                </div>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#1d1a14]/25 pt-6">
                {fields.map(([k, v]) => (
                  <div key={k}>
                    <dt className="label-ink">{k}</dt>
                    <dd className="mt-1 font-mono text-base uppercase tracking-wider text-[#1d1a14]">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex items-end justify-between gap-4">
                <p className="font-hand text-3xl leading-none text-[#2a3a6a]/80">who did he call?</p>
                <Stamp tone="crimson" rotate={-9} size="sm" className="shrink-0">
                  {meta.classification}
                </Stamp>
              </div>
            </div>
            {/* clipped photograph */}
            <div className="photo-print absolute -right-4 -top-10 w-28 rotate-[7deg] md:-right-10 md:w-36">
              <SuspectPortrait spec={{ hair: "short", collar: "coat" }} label="Daniel Mercer" tone="warm" className="block w-full" />
              <p className="mt-1 text-center font-mono text-[9px] tracking-[0.2em] text-[#3a3428]">D. MERCER</p>
              <span className="absolute -top-3 left-1/2 h-6 w-3 -translate-x-1/2 rounded-sm border border-[#6d7680] bg-[#9aa5ae]" aria-hidden="true" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
