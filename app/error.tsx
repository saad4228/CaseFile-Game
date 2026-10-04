"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(156,41,41,0.16),transparent_70%)]" />
      <div className="paper torn relative w-full max-w-lg px-8 py-10">
        <p className="label-ink">Archive — Connection interrupted</p>
        <p className="font-display mt-4 text-5xl leading-[0.95] text-[#1d1a14]">The line went dead.</p>
        <p className="mt-5 text-sm leading-relaxed text-[#1d1a14]/80">
          Something failed between you and the archive. Your work on the server is safe; anything unsaved on this page may
          need a second try.
        </p>
        {error.digest && <p className="mt-3 font-mono text-[11px] text-[#1d1a14]/55">Reference {error.digest}</p>}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-primary" onClick={() => retry()}>
            Try again
          </button>
          <Link href="/archive" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1d1a14]/70 hover:text-[#1d1a14]">
            Back to the archive
          </Link>
        </div>
      </div>
    </main>
  );
}
