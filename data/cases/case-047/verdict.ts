import type { VerdictOptions } from "@/lib/game-engine/types";

// The answer sheet. Public: listing the options reveals nothing about which is right.
export const verdictOptions: VerdictOptions = {
  who: [
    { id: "sarah_vale", label: "Sarah Vale" },
    { id: "marcus_reed", label: "Marcus Reed" },
    { id: "elena_cross", label: "Elena Cross" },
    { id: "noah_grant", label: "Noah Grant" },
    { id: "j", label: "“J” — unidentified" },
    { id: "nobody", label: "No one — he died of natural causes" },
  ],
  how: [
    { id: "poison", label: "Poisoned" },
    { id: "strangled", label: "Strangled" },
    { id: "struck", label: "Blunt force" },
    { id: "smothered", label: "Suffocated" },
    { id: "overdose", label: "Self-administered overdose" },
    { id: "natural", label: "Cardiac arrest — natural causes" },
  ],
  when: [
    { id: "w1", label: "Before 23:20" },
    { id: "w2", label: "23:20 – 23:40" },
    { id: "w3", label: "23:41 – 23:47" },
    { id: "w4", label: "23:47 – 00:10" },
    { id: "w5", label: "After 00:10" },
  ],
  where: [
    { id: "room314", label: "Room 314" },
    { id: "bar", label: "The hotel bar" },
    { id: "garage", label: "Garage level P2" },
    { id: "stairs", label: "Service Stair B" },
    { id: "roof", label: "The rooftop conservatory" },
  ],
  why: [
    { id: "archive", label: "To protect what is stored under the Blackwood" },
    { id: "money", label: "To kill the series and keep the payments coming" },
    { id: "personal", label: "A personal grudge" },
    { id: "source", label: "To silence one of Daniel's sources" },
    { id: "phone", label: "To steal what was on his phone" },
    { id: "none", label: "There was no motive — it wasn't a crime" },
  ],
};

export const proofSlotLabels = {
  motive: { label: "Motive", hint: "Why they needed Daniel gone" },
  opportunity: { label: "Opportunity", hint: "How they reached him" },
  means: { label: "Means", hint: "What killed him, and where it came from" },
  timeline: { label: "Timeline", hint: "When it happened, minute by minute" },
  identity: { label: "Identity", hint: "Why it was this person and no one else" },
} as const;
