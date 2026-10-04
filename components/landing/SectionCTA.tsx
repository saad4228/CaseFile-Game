import Link from "next/link";
import { Fog } from "@/components/illustrations/Fog";
import { NoirCity } from "@/components/illustrations/NoirCity";
import { Rain } from "@/components/illustrations/Rain";

export function SectionCTA() {
  return (
    <section className="relative isolate flex min-h-[90vh] items-center overflow-hidden" aria-labelledby="cta-heading">
      <NoirCity className="absolute inset-0 -z-20 h-full w-full opacity-80" seed={52} showDetective={false} lampX={300} />
      <Fog className="absolute inset-0 -z-10" />
      <Rain className="absolute inset-0 -z-10 h-full w-full" glowX={0.12} density={0.8} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950 via-ink-950/40 to-ink-950" />
      <div className="mx-auto w-full max-w-[1400px] px-4 text-center md:px-10">
        <p className="label text-amber-300/90">Case 047 — The Last Call</p>
        <h2 id="cta-heading" className="font-display mx-auto mt-8 max-w-5xl text-5xl leading-[0.92] md:text-8xl">
          Your first case
          <br />
          is waiting.
        </h2>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/cases/047" className="btn btn-primary">
            Start investigation
          </Link>
          <Link href="/archive" className="btn btn-ghost">
            Browse the archive
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink-700">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <p className="font-display text-lg tracking-[0.08em]">CASEFILE</p>
        <p className="label max-w-xl normal-case tracking-[0.1em]">
          A multiplayer deduction game. All people, places and organizations in CASEFILE are fictional.
        </p>
      </div>
    </footer>
  );
}
