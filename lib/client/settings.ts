import { useSyncExternalStore } from "react";

// Per-device preferences. Kept in localStorage; every read is guarded because storage
// can be unavailable (private mode, blocked site data).

export interface Settings {
  /** Interface sounds: paper, typewriter, shutter, stamp. */
  sound: boolean;
  /** Looping rain. */
  ambience: boolean;
  /** Force reduced motion regardless of the system setting. */
  reduceMotion: boolean;
}

const KEY = "casefile:settings";
export const DEFAULT_SETTINGS: Settings = { sound: true, ambience: false, reduceMotion: false };

let cache: Settings | null = null;
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    cache = {
      sound: typeof raw.sound === "boolean" ? raw.sound : DEFAULT_SETTINGS.sound,
      ambience: typeof raw.ambience === "boolean" ? raw.ambience : DEFAULT_SETTINGS.ambience,
      reduceMotion: typeof raw.reduceMotion === "boolean" ? raw.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    };
  } catch {
    cache = DEFAULT_SETTINGS;
  }
  return cache;
}

export function updateSettings(patch: Partial<Settings>) {
  cache = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* not persisted: applies for this visit */
  }
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}

/** Reduced motion: the system preference, or the player's own setting. */
export function useCalm(): boolean {
  const system = useSyncExternalStore(subscribeMotion, systemReduced, () => false);
  const { reduceMotion } = useSettings();
  return system || reduceMotion;
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(MOTION_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function systemReduced() {
  return window.matchMedia(MOTION_QUERY).matches;
}

const SMALL_QUERY = "(max-width: 767px)";
function subscribeSmall(cb: () => void) {
  const mq = window.matchMedia(SMALL_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** True on phone-sized screens. False during server render; corrects itself on hydration. */
export function useIsSmallScreen(): boolean {
  return useSyncExternalStore(subscribeSmall, () => window.matchMedia(SMALL_QUERY).matches, () => false);
}
