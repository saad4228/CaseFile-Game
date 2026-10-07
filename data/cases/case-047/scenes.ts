import type { PhotoScene } from "@/lib/game-engine/types";

// Photographed scenes for Case 047's photo evidence. Add an image under public/scenes/ and
// list it here; it replaces the drawn illustration wherever that scene appears — the evidence
// tray, the inspection view and the resolution comic. Anything not listed keeps its drawing,
// so the set can be filled in one scene at a time.
//
// Supply 4:3 (1600×1200): the drawn scenes are a 400×300 viewBox and the image is placed
// inside it, so the camera burn-in, corner brackets and source stamp still overlay correctly.
// The resolution comic crops these to 16:5 and 3:5, so keep the subject near the centre.

export const sceneArt: Partial<Record<PhotoScene, string>> = {
  "room-desk": "/scenes/room-desk.webp",
  lobby: "/scenes/lobby.webp",
  "garage-plate": "/scenes/garage-plate.webp",
  garage: "/scenes/garage.webp",
  bar: "/scenes/bar.webp",
  conservatory: "/scenes/conservatory.webp",
};
