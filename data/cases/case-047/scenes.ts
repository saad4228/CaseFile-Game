import type { PhotoScene } from "@/lib/game-engine/types";

// Photographed scenes for photo evidence. Drop a 4:3 image in public/scenes/ and list it
// here; anything unlisted keeps its drawing. The overlays (burn-in, brackets, stamp) are
// drawn on top, and the resolution comic crops to 16:5 and 3:5, so keep the subject centred.

export const sceneArt: Partial<Record<PhotoScene, string>> = {
  "room-desk": "/scenes/room-desk.webp",
  lobby: "/scenes/lobby.webp",
  "garage-plate": "/scenes/garage-plate.webp",
  garage: "/scenes/garage.webp",
  bar: "/scenes/bar.webp",
  conservatory: "/scenes/conservatory.webp",
  "mercer-office": "/scenes/mercer-office.webp",
  archive: "/scenes/archive.webp",
};
