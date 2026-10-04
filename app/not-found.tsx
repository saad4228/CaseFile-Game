import type { Metadata } from "next";
import Link from "next/link";
import { Rain } from "@/components/illustrations/Rain";
import { Stamp } from "@/components/ui/Stamp";

export const metadata: Metadata = { title: "No such file" };

export default function NotFound() {
  return (
    <main id="main" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink-950 px-4">
      <Rain className="absolute inset-0 h-full w-full opacity-50" density={0.5} />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(240,174,85,0.12),transparent_70%)]" />
      <div className="paper torn relative w-full max-w-lg px-8 py-10">
        <p className="label-ink">Records office — Request denied</p>
        <p className="font-display mt-4 text-5xl leading-[0.95] text-[#1d1a14]">No such file.</p>
        <p className="mt-5 text-sm leading-relaxed text-[#1d1a14]/80">
          The record you asked for was never filed, was moved, or was closed to you. The clerk shrugs and goes back to the rain.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/archive" className="btn btn-primary">
            Back to the archive
          </Link>
          <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1d1a14]/70 hover:text-[#1d1a14]">
            Front desk
          </Link>
        </div>
        <div className="absolute bottom-8 right-6 hidden sm:block md:bottom-auto md:top-8">
          <Stamp tone="crimson" rotate={-12} size="md">
            404
          </Stamp>
        </div>
      </div>
    </main>
  );
}
