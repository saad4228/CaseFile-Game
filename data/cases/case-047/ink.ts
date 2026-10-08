import type { InkDetail } from "@/lib/game-engine/types";

// Drawn close-ups for the resolution comic. Drop a 5:3 image in public/ink/ and list it
// here; anything unlisted keeps its drawing. The comic crops to 16:5 and 3:5, so keep the
// subject centred. "window" is deliberately absent — that beat renders the Blackwood facade.

export const inkArt: Partial<Record<InkDetail, string>> = {
  console: "/ink/console.webp",
  glass: "/ink/glass.webp",
  keycard: "/ink/keycard.webp",
  door: "/ink/door.webp",
  stairs: "/ink/stairs.webp",
  river: "/ink/river.webp",
  printout: "/ink/printout.webp",
  ring: "/ink/ring.webp",
  "dying-call": "/ink/dying-call.webp",
  burner: "/ink/burner.webp",
};
