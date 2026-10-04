/** "23:46" → minutes since 22:00, wrapping past midnight (case nights run 22:00–02:00). */
export function minutesFromTen(t: string): number {
  const [h, m] = t.split(":").map(Number);
  const hh = h < 12 ? h + 24 : h;
  return (hh - 22) * 60 + m;
}
