"use client";

import { motion } from "framer-motion";
import { InkDetail } from "./InkDetail";
import { PhotoScene } from "@/components/illustrations/PhotoScene";
import type { ResultView } from "@/lib/sessions/types";

// The case told back to the player in full, once the verdict is filed: what was going on
// before the night, what happened on it, and what this case leaves open.

type Story = ResultView["truth"]["story"];
type Picture = Story[number]["pictures"][number];

/** A photograph sits in a print; an ink panel sits on its own white. */
function Plate({ picture, tilt }: { picture: Picture; tilt: number }) {
  return (
    <figure className="photo-print" style={{ rotate: `${tilt}deg` }}>
      {"scene" in picture ? (
        <PhotoScene scene={picture.scene} className="block w-full" />
      ) : (
        <InkDetail kind={picture.detail} className="block w-full" />
      )}
    </figure>
  );
}

export function CaseStory({ story }: { story: Story }) {
  return (
    <ol className="space-y-20 md:space-y-24">
      {story.map((beat, i) => (
        <motion.li
          key={beat.title}
          className="grid gap-8 md:grid-cols-12 md:gap-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          {/* The text takes a narrow measure and the pictures take the rest, two across, so
              a chapter with five of them is three rows deep rather than five. */}
          <div className="md:col-span-5">
            <p className="label">
              {String(i + 1).padStart(2, "0")} · {beat.when}
            </p>
            <h3 className="font-display mt-2 text-3xl leading-tight md:text-4xl">{beat.title}</h3>
            <div className="mt-5 space-y-4">
              {beat.lines.map((line, n) => (
                <p key={n} className="text-[15px] leading-relaxed text-bone-100/80">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {beat.pictures.length > 0 && (
            <div
              className={`grid gap-4 self-start sm:gap-5 md:col-span-7 ${
                beat.pictures.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {beat.pictures.map((picture, n) => (
                <Plate key={n} picture={picture} tilt={n % 2 ? 0.9 : -0.8} />
              ))}
            </div>
          )}
        </motion.li>
      ))}
    </ol>
  );
}
