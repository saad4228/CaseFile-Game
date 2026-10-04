/** A free-ish spot for the n-th pinned item: a loose grid, like cards laid on a table. */
export function boardSlot(n: number) {
  const col = n % 5;
  const row = Math.floor(n / 5);
  return { x: 40 + col * 230 + (row % 2) * 60, y: 40 + row * 190 + (col % 2) * 24 };
}
