import { Reveal } from "@/components/ui/Reveal";
import { SectionMark } from "@/components/ui/SectionMark";
import { Stamp } from "@/components/ui/Stamp";

const questions = ["Who", "How", "When", "Where", "Why"];
const proof = ["Motive", "Opportunity", "Means", "Timeline", "Identity"];
const score: [string, number][] = [
  ["Deduction", 94],
  ["Evidence", 87],
  ["Logic", 93],
  ["Contradictions", 81],
  ["Efficiency", 76],
  ["Proof", 98],
];

export function SectionSolve() {
  return (
    <section className="relative py-28 md:py-40" aria-labelledby="solve-heading">
      <div className="mx-auto max-w-[1400px] px-4 md:px-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <SectionMark n="06" label="Solve" />
            <h2 id="solve-heading" className="font-display mt-8 text-5xl leading-[0.95] md:text-7xl">
              State your case.
              <br />
              <em className="text-crimson-400">Then prove it.</em>
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-bone-100/75">
            A name isn&apos;t a verdict. Answer who, how, when, where and why — and attach the
            evidence for each. You&apos;re scored on the reasoning, not the guess.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Reveal className="panel relative overflow-hidden p-6 md:p-10">
            <p className="label">Case 047 — Verdict</p>
            <dl className="mt-8 space-y-5">
              {questions.map((q, i) => (
                <div key={q} className="grid grid-cols-[120px_1fr] md:grid-cols-[170px_1fr] items-center gap-4 border-b border-ink-700 pb-4">
                  <dt className="font-display text-2xl uppercase tracking-wide md:text-3xl">{q}?</dt>
                  <dd>
                    <span
                      className="block h-5 bg-bone-100/85"
                      style={{ width: `${[62, 48, 36, 54, 70][i]}%` }}
                      aria-label="Redacted"
                    />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-10 font-mono text-[11px] tracking-[0.25em] text-amber-300">PROVE IT</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {proof.map((p) => (
                <div key={p} className="border border-dashed border-steel-400/40 px-3 py-4 text-center">
                  <p className="label !text-[9px]">{p}</p>
                  <p className="mt-2 font-mono text-xs text-bone-100/40">+ evidence</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15} className="paper relative px-6 py-8 md:px-10 md:py-10">
            <p className="label-ink">Investigation score</p>
            <table className="mt-6 w-full font-mono text-sm text-[#1d1a14]">
              <tbody>
                {score.map(([k, v]) => (
                  <tr key={k} className="border-b border-[#1d1a14]/15">
                    <td className="py-2 uppercase tracking-[0.15em]">{k}</td>
                    <td className="py-2 text-right tabular-nums">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="label-ink">Final</p>
                <p className="font-display text-6xl leading-none text-[#1d1a14]">
                  91<span className="text-2xl text-[#4f4636]"> / 100</span>
                </p>
              </div>
              <div className="text-right">
                <p className="label-ink">Rank</p>
                <p className="font-display text-6xl leading-none text-crimson-600">S</p>
              </div>
            </div>
            <div className="absolute right-6 top-6">
              <Stamp tone="crimson" rotate={-12} size="lg" animate>
                Solved
              </Stamp>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
