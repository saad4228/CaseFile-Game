import Image from "next/image";
import { CreatorPortrait } from "@/components/illustrations/CreatorPortrait";
import { Reveal } from "@/components/ui/Reveal";
import { Stamp } from "@/components/ui/Stamp";
import { creator } from "@/data/creator";

/** "Personnel file" for the creator: a pinned photo and a typed note. */
export function SectionCreator() {
  return (
    <section className="relative overflow-hidden px-4 py-24 md:px-10 md:py-36" aria-labelledby="creator-heading">
      {/* light through the blinds falls across this corner of the wall */}
      <div
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-32deg,rgba(240,174,85,0.05)_0_18px,transparent_18px_46px)] [mask-image:radial-gradient(ellipse_45%_55%_at_25%_45%,#000,transparent_75%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <p className="label text-amber-300/90">Personnel file — The investigator behind the case</p>
        </Reveal>

        <div className="mt-12 grid items-start gap-14 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-20">
          <Reveal className="mx-auto w-full max-w-[300px] lg:mx-0" y={40}>
            <figure className="relative">
              <div className="photo-print relative -rotate-3">
                <span
                  className="absolute -top-2.5 left-1/2 z-10 h-5 w-5 -translate-x-1/2 rounded-full bg-crimson-600 shadow-[0_3px_4px_rgba(0,0,0,.6)]"
                  aria-hidden="true"
                />
                <div className="relative aspect-[4/5] overflow-hidden bg-ink-900">
                  {creator.photo ? (
                    <Image
                      src={creator.photo}
                      alt={creator.name}
                      fill
                      sizes="300px"
                      className="object-cover [filter:grayscale(0.25)_sepia(0.2)_contrast(1.05)]"
                    />
                  ) : (
                    <CreatorPortrait label={creator.name} className="block h-full w-full" />
                  )}
                </div>
                <figcaption className="mt-3 text-center font-hand text-3xl leading-none text-[#1d1a14]">{creator.name}</figcaption>
              </div>
              <div className="absolute -bottom-6 -right-4 rotate-[8deg]">
                <Stamp tone="amber" rotate={0} size="sm">
                  Creator
                </Stamp>
              </div>
            </figure>
            <p className="label mt-12 text-center normal-case tracking-[0.12em] text-bone-100/70 lg:text-left">{creator.credit}</p>
          </Reveal>

          <Reveal y={50} delay={0.1}>
            <article className="paper torn relative px-6 py-10 sm:px-10 md:px-14 md:py-14">
              <p className="label-ink">A note from the creator</p>
              <h2 id="creator-heading" className="font-display mt-4 text-3xl leading-tight text-[#1d1a14] md:text-5xl">
                {creator.greeting}
              </h2>
              <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-[#1d1a14]/90 md:text-[17px]">
                {creator.paragraphs.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              <p className="font-display mt-8 border-l-4 border-crimson-600 pl-5 text-2xl leading-snug text-[#1d1a14] md:text-3xl">
                {creator.closing}
              </p>
              <p className="mt-8 text-right font-hand text-4xl text-[#1d1a14]/85">— {creator.name}</p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
