// Painted portraits. Drop a 4:5 image in public/suspects/ and list it here to replace the
// drawn silhouette everywhere except the resolution line-up. Must still read at 44px wide.

export const portraitArt: Partial<Record<string, string>> = {
  sarah_vale: "/suspects/sarah_vale.webp",
  marcus_reed: "/suspects/marcus_reed.webp",
  elena_cross: "/suspects/elena_cross.webp",
  noah_grant: "/suspects/noah_grant.webp",
  j: "/suspects/j.webp",
  // The victim, for the briefing. Not a suspect, so he has no entry in suspects.ts.
  daniel_mercer: "/suspects/daniel_mercer.webp",
};

// A head-and-shoulders crop of the same painting, for the places a portrait is rendered
// small (the People list at 44px, the lobby at 80px). The full bust turns to mud at that
// size — too much coat, too little face. Optional: anyone without one falls back to the
// full portrait. The crop is tuned per painting, so check a new one before adding it here.
export const portraitArtTight: Partial<Record<string, string>> = {
  sarah_vale: "/suspects/sarah_vale_sm.webp",
  marcus_reed: "/suspects/marcus_reed_sm.webp",
  elena_cross: "/suspects/elena_cross_sm.webp",
  noah_grant: "/suspects/noah_grant_sm.webp",
  j: "/suspects/j_sm.webp",
  // Daniel needs none: the briefing is the only place he appears, at 160px.
};
