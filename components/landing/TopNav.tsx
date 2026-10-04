import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";
import { SettingsMenu } from "@/components/settings/SettingsMenu";

export function TopNav({ tone = "overlay" }: { tone?: "overlay" | "solid" }) {
  return (
    <header
      className={`${tone === "overlay" ? "absolute" : "sticky border-b border-ink-700 bg-ink-950/[0.96]"} inset-x-0 top-0 z-40`}
    >
      <nav
        className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-5 md:px-10"
        aria-label="Primary"
      >
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="font-display text-xl tracking-[0.08em] text-bone-100">CASEFILE</span>
          <span className="hidden font-mono text-[10px] tracking-[0.3em] text-steel-400 sm:inline">
            SEASON ONE
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5 md:gap-8">
          <Link href="/archive" className="label hidden transition-colors hover:text-bone-100 sm:inline">
            Archive
          </Link>
          <Link href="/rooms/new" className="label hidden transition-colors hover:text-bone-100 md:inline">
            Team play
          </Link>
          <SettingsMenu />
          <UserMenu />
          <Link href="/cases/047" className="btn btn-ghost btn-sm whitespace-nowrap">
            <span className="sm:hidden">Play</span>
            <span className="hidden sm:inline">Play demo case</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
