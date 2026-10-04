import Link from "next/link";
import { Fog } from "@/components/illustrations/Fog";
import { NoirCity } from "@/components/illustrations/NoirCity";
import { Rain } from "@/components/illustrations/Rain";
import { HeroTitle } from "./HeroTitle";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
      <NoirCity className="absolute inset-0 -z-20 hidden h-full w-full md:block" />
      <NoirCity className="absolute inset-0 -z-20 h-full w-full md:hidden" align="xMaxYMax" />
      <Fog className="absolute inset-0 -z-10" />
      <Rain
        className="absolute inset-0 -z-10 hidden h-full w-full md:block"
        anchor={{ x: 1385, y: 450, ground: 780, vw: 1600, vh: 900, alignX: "mid" }}
      />
      <Rain
        className="absolute inset-0 -z-10 h-full w-full md:hidden"
        anchor={{ x: 1385, y: 450, ground: 780, vw: 1600, vh: 900, alignX: "max" }}
      />
      <div className="vignette absolute inset-0 -z-10" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-14 md:px-10 md:pb-20">
        <p className="label mb-5 text-amber-300/90 md:mb-7">Case 047 — Now open</p>
        <HeroTitle />
        <div className="mt-6 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md font-mono text-sm uppercase leading-relaxed tracking-[0.28em] text-bone-100/85 md:text-base">
            Every clue tells a story.
            <br />
            Every story hides a lie.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/archive" className="btn btn-primary">
              Enter the archive
            </Link>
            <Link href="/cases/047" className="btn btn-ghost">
              Play demo case
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
