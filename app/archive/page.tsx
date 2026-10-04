import type { Metadata } from "next";
import { ArchiveView } from "@/components/archive/ArchiveView";
import { TopNav } from "@/components/landing/TopNav";
import { cases } from "@/data/cases";

export const metadata: Metadata = { title: "The Archive" };

export default function ArchivePage() {
  return (
    <>
      <TopNav tone="solid" />
      <main className="relative min-h-screen overflow-hidden pb-40">
        {/* a shaft of window light across the wall */}
        <div
          className="pointer-events-none absolute -top-40 left-[10%] h-[140%] w-[45%] -rotate-[24deg] bg-gradient-to-b from-amber-300/[0.07] via-amber-300/[0.03] to-transparent blur-2xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1400px] px-4 pt-16 md:px-10 md:pt-24">
          <p className="label">Season One</p>
          <h1 className="font-display mt-4 text-6xl leading-[0.9] md:text-8xl">
            The <em className="text-amber-300">Archive</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone-100/70">
            Five files. One of them is open. The others will be, once you&apos;ve earned them.
          </p>
          <div className="mt-14">
            <ArchiveView cases={cases} />
          </div>
        </div>
      </main>
    </>
  );
}
