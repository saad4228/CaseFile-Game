// Noir-flavoured placeholder codenames for guests.
const first = ["GREY", "NIGHT", "RAIN", "COLD", "QUIET", "AMBER", "IRON", "PALE", "LATE", "STILL", "SMOKE", "HOLLOW"];
const second = ["HERON", "LANTERN", "SPARROW", "LEDGER", "COAT", "HARBOR", "MATCH", "STAIR", "WIRE", "CIPHER", "ALLEY", "SIGNAL"];

export function randomCodename(rand: () => number = Math.random) {
  const a = first[Math.floor(rand() * first.length)];
  const b = second[Math.floor(rand() * second.length)];
  return `${a} ${b}`;
}

/** Codenames are display names: 2–24 chars, letters, digits, spaces and a little punctuation. */
export function cleanCodename(input: string): string | null {
  const v = input.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (v.length < 2 || v.length > 24) return null;
  if (!/^[\p{L}\p{N} .'_-]+$/u.test(v)) return null;
  return v;
}
