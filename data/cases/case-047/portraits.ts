// Painted portraits for Case 047's suspects. When an image file is added to
// public/suspects/, list it here and it replaces the drawn silhouette in the briefing,
// People view, board, lobby and interview room. The resolution line-up keeps the drawn
// silhouettes — its eyes have to close one by one.
//
// SuspectPhoto renders these as aspect-[4/5] with object-cover, so supply 4:5 (1024×1280)
// or anything taller gets cropped top and bottom. The subject must still read at 44px wide
// (the People list thumbnail), and the interview room fades out the bottom 30%.
//
//   sarah_vale: "/suspects/sarah_vale.webp",

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
