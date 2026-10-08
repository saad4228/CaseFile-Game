"use client";

import { motion } from "framer-motion";
import { InkDetail } from "./InkDetail";
import { PhotoScene } from "@/components/illustrations/PhotoScene";
import type { ResultView } from "@/lib/sessions/types";

// The case told back to the player in full, once the verdict is filed: what was going on
// before the night, what happened on it, and what this case leaves open.

export function CaseStory({ story }: { story: ResultView["truth"]["story"] }) {
  return (
    <ol className="space-y-16">
      {story.map((beat, i) => (
        <motion.li
          key={beat.title}
          className="grid gap-6 md:grid-cols-[1fr_300px] md:gap-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="label">
              {String(i + 1).padStart(2, "0")} · {beat.when}
            </p>
            <h3 className="font-display mt-2 text-3xl leading-tight md:text-4xl">{beat.title}</h3>
            <div className="mt-5 space-y-4">
              {beat.lines.map((line, n) => (
                <p key={n} className="max-w-prose text-[15px] leading-relaxed text-bone-100/80">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Each chapter keeps one image from the file beside it, so the page stays a case. */}
          {(beat.scene || beat.detail) && (
            <figure className="self-start md:sticky md:top-10">
              {beat.scene ? (
                <div className="photo-print -rotate-1">
                  <PhotoScene scene={beat.scene} className="block w-full" />
                </div>
              ) : (
                <div className="border border-ink-700 bg-ink-950 p-3">
                  <InkDetail kind={beat.detail!} className="block w-full" />
                </div>
              )}
            </figure>
          )}
        </motion.li>
      ))}
    </ol>
  );
}
