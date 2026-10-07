import type { InkDetail } from "@/lib/game-engine/types";

// Drawn close-ups for the resolution comic. Add an image under public/ink/ and list it here;
// it replaces the drawing for that beat. Anything not listed keeps its drawing, so the set
// can be filled in one panel at a time.
//
// Supply 5:3 (1500×900): the drawn panels are a 400×240 viewBox and the image is placed
// inside it. The comic crops panels to 16:5 and 3:5, so keep the subject near the centre.
//
// "window" has no entry and never will — that beat renders the Blackwood facade with the
// light in Room 314 going out, not an ink panel.

export const inkArt: Partial<Record<InkDetail, string>> = {
  console: "/ink/console.webp",
  glass: "/ink/glass.webp",
  keycard: "/ink/keycard.webp",
  door: "/ink/door.webp",
  stairs: "/ink/stairs.webp",
  river: "/ink/river.webp",
  printout: "/ink/printout.webp",
};
