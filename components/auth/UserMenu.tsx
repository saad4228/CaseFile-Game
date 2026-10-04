"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions/auth";

interface Me {
  database: boolean;
  user: { id: string; codename: string; isGuest: boolean; isAdmin: boolean } | null;
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Me) => alive && setMe(d))
      .catch(() => alive && setMe({ database: false, user: null }));
    return () => {
      alive = false;
    };
  }, []);
  return me;
}

export function UserMenu() {
  const me = useMe();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!me) return <span className="label w-16 opacity-0">…</span>;
  if (!me.database) return null;
  if (!me.user) {
    return (
      <Link href="/login" className="label whitespace-nowrap py-2 transition-colors hover:text-bone-100">
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-bone-100/85 hover:text-bone-100"
      >
        <span className="flex h-7 w-7 items-center justify-center border border-amber-500/60 font-display text-sm text-amber-300">
          {me.user.codename.slice(0, 1)}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{me.user.codename}</span>
      </button>
      {open && (
        <div role="menu" className="panel absolute right-0 top-full z-50 mt-2 w-56 py-1 shadow-2xl">
          <Link role="menuitem" href="/profile" className="block px-4 py-2.5 text-sm hover:bg-ink-800">
            Detective file
          </Link>
          <Link role="menuitem" href="/rooms/new" className="block px-4 py-2.5 text-sm hover:bg-ink-800">
            Start a team investigation
          </Link>
          {me.user.isGuest && (
            <Link role="menuitem" href="/login?mode=register" className="block px-4 py-2.5 text-sm text-amber-300 hover:bg-ink-800">
              Keep your progress — register
            </Link>
          )}
          {me.user.isAdmin && (
            <Link role="menuitem" href="/admin" className="block px-4 py-2.5 text-sm hover:bg-ink-800">
              Admin
            </Link>
          )}
          <form action={signOutAction}>
            <button role="menuitem" type="submit" className="block w-full px-4 py-2.5 text-left text-sm text-bone-100/70 hover:bg-ink-800">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
