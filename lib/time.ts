// The clock a case night runs on. Nights start at 22:00 and may run past midnight, so times
// are held as minutes since 22:00 rather than as wall-clock strings.

/** "23:46" or "23:46:13" → minutes since 22:00. Null when the string isn't a time. */
export function minutesFrom22(time: string): number | null {
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  return ((h < 12 ? h + 24 : h) - 22) * 60 + Number(m[2]);
}

/** Minutes since 22:00 → "23:46". */
export function clock(min: number): string {
  const total = (((Math.round(min) + 22 * 60) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Reads a loose time the way people say it at night: "about 11:20" means 23:20. */
export function nightMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return minutesFrom22(`${h >= 4 && h < 12 ? h + 12 : h}:${String(m).padStart(2, "0")}`) ?? 0;
}
