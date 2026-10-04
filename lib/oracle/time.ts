/** "23:46" → minutes since 22:00, wrapping past midnight (case nights run 22:00–02:00). */
export function minutesFromTen(t: string): number {
  const [h, m] = t.split(":").map(Number);
  const hh = h < 12 ? h + 24 : h;
  return (hh - 22) * 60 + m;
}

/**
 * Like minutesFromTen, but reads loose clock times the way people say them at night:
 * "about 11:20" means 23:20, while 00:00–03:59 stays after midnight.
 */
export function nightMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  const hh = h >= 4 && h < 12 ? h + 12 : h;
  return minutesFromTen(`${hh}:${m}`);
}

/** Minutes since 22:00 → "23:46". */
export function clock(min: number): string {
  const total = (((min + 22 * 60) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
