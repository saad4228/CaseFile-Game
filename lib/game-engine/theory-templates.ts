import type { ClaimKind } from "./state";

// "If this is true, what else would have to be true?" — the assumptions each kind of claim
// carries. Generic on purpose: they never hint at which suspect is right.

export const CLAIMS: { id: ClaimKind; label: (name: string) => string; needsSuspect: boolean }[] = [
  { id: "culprit", label: (n) => `${n} killed Daniel Mercer.`, needsSuspect: true },
  { id: "lying", label: (n) => `${n} lied in their statement.`, needsSuspect: true },
  { id: "present", label: (n) => `${n} was inside the Blackwood after 23:00.`, needsSuspect: true },
  { id: "custom", label: () => "", needsSuspect: false },
];

export const ASSUMPTIONS: Record<Exclude<ClaimKind, "custom">, { key: string; text: (n: string) => string }[]> = {
  culprit: [
    { key: "access", text: (n) => `${n} could get into Room 314` },
    { key: "presence", text: (n) => `${n} was near Room 314 when Daniel died` },
    { key: "means", text: (n) => `${n} had a way to kill without a struggle or a weapon left behind` },
    { key: "motive", text: (n) => `${n} had a reason to want Daniel silenced` },
    { key: "knowledge", text: (n) => `${n} knew Daniel was staying in Room 314` },
    { key: "phone", text: (n) => `${n} had a reason to take Daniel's phone` },
    { key: "gap", text: (n) => `${n}'s account of 23:00–00:00 has a gap or a lie` },
  ],
  lying: [
    { key: "record", text: (n) => `A record contradicts ${n}'s statement` },
    { key: "hide", text: (n) => `${n} had something to hide` },
    { key: "window", text: () => `The lie covers 23:00–00:00` },
    { key: "protect", text: (n) => `${n} is protecting someone` },
  ],
  present: [
    { key: "seen", text: (n) => `A camera or witness places ${n} at the hotel` },
    { key: "logged", text: (n) => `A door, barrier or card logged ${n}` },
    { key: "travel", text: (n) => `${n} could have reached the hotel in time` },
  ],
};

export const ASSUMPTION_LIBRARY = [
  "They could get into Room 314",
  "They were on the third floor between 23:40 and 23:50",
  "They had access to a poison",
  "They knew about Case 019",
  "Their alibi depends on a single record",
  "A record was altered to protect them",
  "They had a reason to take the phone",
  "They left the hotel after 23:47",
];
