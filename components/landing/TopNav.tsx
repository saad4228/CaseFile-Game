import Link from "next/link";

export function TopNav({ tone = "overlay" }: { tone?: "overlay" | "solid" }) {
  return (
    <header
      className={`${tone === "overlay" ? "absolute" : "sticky border-b border-ink-700 bg-ink-950/90 backdrop-blur-sm"} inset-x-0 top-0 z-40`}
    >
      <nav
        className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-5 md:px-10"
        aria-label="Primary"
      >
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="font-display text-xl tracking-[0.08em] text-bone-100">CASEFILE</span>
          <span className="hidden font-mono text-[10px] tracking-[0.3em] text-steel-400 sm:inline">
            SEASON ONE
          </span>
        </Link>
        <div className="flex items-center gap-5 md:gap-9">
          <Link href="/archive" className="label hidden transition-colors hover:text-bone-100 sm:inline">
            Archive
          </Link>
          <span className="label hidden cursor-not-allowed opacity-50 md:inline" title="Coming with accounts">
            Profile
          </span>
          <Link href="/cases/047" className="btn btn-ghost btn-sm">
            Play demo case
          </Link>
        </div>
      </nav>
    </header>
  );
}
