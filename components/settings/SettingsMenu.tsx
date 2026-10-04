"use client";

import { useEffect, useRef, useState } from "react";
import { updateSettings, useSettings, type Settings } from "@/lib/client/settings";
import { play } from "@/lib/client/sound";

const ITEMS: { key: keyof Settings; label: string; hint: string }[] = [
  { key: "sound", label: "Sound effects", hint: "Paper, typewriter, shutter, stamp" },
  { key: "ambience", label: "Rain", hint: "A quiet loop while you work" },
  { key: "reduceMotion", label: "Reduce motion", hint: "Calmer transitions, no drifting" },
];

/** Sound and motion preferences, saved on this device. */
export function SettingsMenu({ align = "right" }: { align?: "left" | "right" }) {
  const settings = useSettings();
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

  const muted = !settings.sound && !settings.ambience;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Sound and motion settings"
        title="Sound and motion"
        className="flex h-8 w-8 items-center justify-center text-steel-300 transition-colors hover:text-bone-100"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" strokeLinejoin="round" />
          {muted ? (
            <path d="M17 9l4 6M21 9l-4 6" strokeLinecap="round" />
          ) : (
            <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Sound and motion"
          className={`panel absolute top-full z-50 mt-2 w-72 p-2 shadow-2xl ${align === "right" ? "right-0" : "left-0"}`}
        >
          {ITEMS.map((item) => {
            const on = settings[item.key];
            return (
              <button
                key={item.key}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => {
                  updateSettings({ [item.key]: !on });
                  if (item.key === "sound" && !on) setTimeout(() => play("paper"), 0);
                }}
                className="flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left hover:bg-ink-800"
              >
                <span>
                  <span className="block text-sm text-bone-100">{item.label}</span>
                  <span className="block text-[12px] text-bone-100/50">{item.hint}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`relative h-5 w-9 shrink-0 border transition-colors ${on ? "border-amber-500 bg-amber-500/25" : "border-ink-600 bg-ink-950"}`}
                >
                  <span className={`absolute top-0.5 h-3.5 w-3.5 transition-all ${on ? "left-[18px] bg-amber-300" : "left-0.5 bg-steel-400"}`} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
