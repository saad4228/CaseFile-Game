"use client";

import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { useSettings } from "@/lib/client/settings";
import { setAmbience } from "@/lib/client/sound";

/** Applies device preferences: reduced motion everywhere, and the rain loop. */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { reduceMotion, ambience } = useSettings();

  useEffect(() => {
    if (reduceMotion) document.documentElement.dataset.motion = "reduce";
    else delete document.documentElement.dataset.motion;
  }, [reduceMotion]);

  // Browsers only allow audio after a gesture, so a saved "rain on" waits for the first one.
  useEffect(() => {
    if (!ambience) {
      setAmbience(false);
      return;
    }
    const start = () => setAmbience(true);
    start();
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, [ambience]);

  return <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>{children}</MotionConfig>;
}
