import "server-only";
import type { CaseBundle } from "@/lib/game-engine/cases.server";
import type { ConflictView, Evidence, Location, Reliability } from "@/lib/game-engine/types";
import { clock, minutesFromTen, nightMinutes } from "./time";

// ORACLE assists reasoning; it never solves. It only ever reads records the asking player
// has legitimately discovered, plus the public map and the public suspect files — the truth
// file is never in reach (PRD §36–37). Everything here is deterministic: no model, no key,
// no network. It understands a handful of question shapes (where was someone, could they
// get there in time, what's missing, how do two records compare…) and answers in the voice
// of a careful archivist, citing record numbers the player can open.

export interface OracleAnswer {
  text: string;
  refs: string[];
  /** Follow-up questions worth asking next, built only from what the player holds. */
  suggestions: string[];
}

const code = (n: number) => `#${String(n).padStart(3, "0")}`;
const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
const RELIABILITY: Record<Reliability, string> = {
  VERIFIED: "verified",
  LIKELY: "likely",
  UNVERIFIED: "unverified",
  DISPUTED: "disputed",
  CORRUPTED: "corrupted",
  FABRICATED: "fabricated",
};

// ─── Reading the records ─────────────────────────────────────────────────────

function recordLines(e: Evidence): string[] {
  const b = e.body;
  switch (b.kind) {
    case "statement":
      return b.quotes;
    case "document":
      return [b.heading ?? "", ...b.lines, b.footer ?? ""].filter(Boolean);
    case "handwritten":
      return b.lines;
    case "log":
      return [...b.rows.map((r) => r.cells.join(" · ")), b.note ?? ""].filter(Boolean);
    case "photo":
      return [b.caption, ...b.inFrame];
    case "audio":
      return [...b.transcript, b.note ?? ""].filter(Boolean);
    case "messages":
      return b.thread.map((m) => `${m.from} (${m.time}): ${m.text}`);
  }
}

const recordText = (e: Evidence) => `${e.title} ${e.summary} ${recordLines(e).join(" ")}`;

/** One timestamped moment inside a record: a log row, a message, a line that names a time. */
interface Moment {
  min: number;
  time: string;
  e: Evidence;
  text: string;
  /** People this moment is about (not just the record). */
  people: Set<string>;
  place: string | null;
  /** True when it's someone's own account rather than a system record. */
  claim: boolean;
}

interface Person {
  id: string;
  name: string;
  first: string;
  /** Lower-case aliases matched in questions. */
  ask: string[];
  /** Patterns matched in record text, strongest first. */
  inText: RegExp[];
}

interface Place {
  loc: Location;
  aliases: string[];
}

interface Ctx {
  bundle: CaseBundle;
  visible: Evidence[];
  conflicts: ConflictView[];
  byNumber: Map<number, Evidence>;
  people: Person[];
  places: Place[];
  moments: Moment[];
  window: [number, number];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MONTH_CELL = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec) \d{1,2}$/;
const TIME_IN_TEXT = /(?<![\d:.])(\d{1,2})[:.](\d{2})(?::\d{2})?(?!\d)/g;

function buildPeople(bundle: CaseBundle): Person[] {
  const list = [...bundle.suspects.map((s) => ({ id: s.id, name: s.name })), { id: "victim", name: bundle.meta.victim.name }];
  return list.map(({ id, name }) => {
    const clean = name.replace(/[“”"]/g, "").trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) {
      // A one-letter name ("J"): only a standalone capital, never an initial like "J. Haddad".
      return { id, name, first: clean, ask: [clean.toLowerCase()], inText: [new RegExp(`(?:^|[^\\w.])[“"]?${esc(clean)}[”"]?(?![\\w.])`)] };
    }
    const [first, last] = [parts[0], parts.at(-1)!];
    return {
      id,
      name,
      first,
      ask: [clean.toLowerCase(), first.toLowerCase(), last.toLowerCase()],
      inText: [
        new RegExp(`\\b${esc(clean)}\\b`, "i"),
        new RegExp(`\\b${esc(first[0])}\\.\\s?${esc(last)}\\b`, "i"),
        new RegExp(`\\b${esc(last)}\\b`, "i"),
        new RegExp(`\\b${esc(first)}\\b`, "i"),
      ],
    };
  });
}

const GENERIC_PLACE_WORDS = new Set(["hotel", "bar", "office", "building", "district", "apartment", "parking", "room", "the", "old", "quarter"]);

function buildPlaces(bundle: CaseBundle, people: Person[]): Place[] {
  const personWords = new Set(people.flatMap((p) => p.ask));
  const districtCount = new Map<string, number>();
  for (const l of bundle.locations) districtCount.set(l.district, (districtCount.get(l.district) ?? 0) + 1);
  return bundle.locations.map((loc) => {
    const name = loc.name.toLowerCase();
    const aliases = new Set([name, name.replace(/^the /, "").replace(/'s\b/g, "")]);
    for (const w of name.split(/[^a-z']+/)) {
      const word = w.replace(/'s$/, "");
      if (word.length >= 4 && !GENERIC_PLACE_WORDS.has(word) && !personWords.has(word)) aliases.add(word);
    }
    if (districtCount.get(loc.district) === 1) aliases.add(loc.district.toLowerCase());
    // "the hotel", "the bar": a generic word names a place when only one place uses it.
    for (const w of ["hotel", "bar", "garage", "apartment", "building", "district", "parking"]) {
      if (name.split(/\W+/).includes(w) && bundle.locations.filter((l) => l.name.toLowerCase().split(/\W+/).includes(w)).length === 1) aliases.add(w);
    }
    return { loc, aliases: [...aliases].filter(Boolean) };
  });
}

function placeIn(text: string, places: Place[]): string | null {
  const t = text.toLowerCase();
  for (const p of places) if (p.aliases.some((a) => a.length > 3 && t.includes(a))) return p.loc.id;
  return null;
}

function buildMoments(bundle: CaseBundle, visible: Evidence[], people: Person[], places: Place[]): Moment[] {
  const day = Number(bundle.meta.date.replace(/\D/g, ""));
  const month = bundle.meta.date.slice(0, 3).toLowerCase();
  const nightOf = new Set([`${month} ${day}`, `${month} ${day + 1}`]);
  const out: Moment[] = [];
  const seen = new Set<string>();
  const peopleIn = (text: string) => new Set(people.filter((p) => p.inText.some((r) => r.test(text))).map((p) => p.id));
  const add = (e: Evidence, time: string, text: string, claim: boolean, who?: Set<string>) => {
    const m = /(\d{1,2})[:.](\d{2})/.exec(time);
    if (!m) return;
    // People say "about 11:20" for 23:20; systems write 24-hour clocks ("08:12" is morning).
    const min = (claim ? nightMinutes : minutesFromTen)(`${m[1]}:${m[2]}`);
    if (min < -240 || min > 270) return; // the night itself: 18:00 → 02:30
    const key = `${e.id}|${min}|${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      min,
      time: clock(min),
      e,
      text: text.length > 150 ? `${text.slice(0, 147)}…` : text,
      people: who ?? peopleIn(text),
      place: placeIn(text, places) ?? e.location,
      claim,
    });
  };

  for (const e of visible) {
    const b = e.body;
    const claim = e.category === "INTERVIEW";
    const before = out.length;
    if (b.kind === "log") {
      for (const row of b.rows) {
        if (!row.time) continue;
        const dated = row.cells.map((c) => c.toLowerCase().replace(/ 0(\d)$/, " $1")).find((c) => MONTH_CELL.test(c));
        if (dated && !nightOf.has(dated)) continue; // another day's call or charge
        add(e, row.time, row.cells.filter((c) => c && c !== "—" && !/^\d{1,2}:\d{2}(:\d{2})?$/.test(c)).join(" · "), false);
      }
    } else if (b.kind === "messages") {
      for (const msg of b.thread) add(e, msg.time, `${msg.from}: ${msg.text}`, false);
    } else {
      for (const line of recordLines(e)) {
        // Attach each time to its own sentence, and a range ("23:40 – 23:55") to its start only.
        for (const sentence of line.split(/(?<=[.!?])(?<!\b(?:[A-Z]|Mr|Mrs|Ms|Dr|St|Rm|No)\.)\s+(?=[A-Z“"])/)) {
          for (const m of sentence.matchAll(TIME_IN_TEXT)) {
            if (/\d\s*(–|-|to)\s*$/.test(sentence.slice(0, m.index))) continue;
            const who = claim ? new Set([...e.suspects, ...peopleIn(sentence)]) : undefined;
            add(e, `${m[1]}:${m[2]}`, sentence.trim(), claim, who);
          }
        }
      }
    }
    if (e.time && out.length === before) add(e, e.time, e.summary, claim, new Set([...e.suspects, ...peopleIn(e.summary)]));
  }
  return out.sort((a, b) => a.min - b.min || a.e.number - b.e.number);
}

function context(bundle: CaseBundle, visible: Evidence[], conflicts: ConflictView[]): Ctx {
  const people = buildPeople(bundle);
  const places = buildPlaces(bundle, people);
  const held = new Set(visible.map((e) => e.id));
  const objective = Array.from(bundle.meta.objective.matchAll(/(\d{1,2}):(\d{2})|midnight/gi)).map((m) =>
    m[0].toLowerCase() === "midnight" ? 120 : nightMinutes(`${m[1]}:${m[2]}`),
  );
  return {
    bundle,
    visible,
    conflicts: conflicts.filter((c) => held.has(c.a) && held.has(c.b)),
    byNumber: new Map(visible.map((e) => [e.number, e])),
    people,
    places,
    moments: buildMoments(bundle, visible, people, places),
    window: objective.length >= 2 ? [Math.min(...objective), Math.max(...objective)] : [60, 120],
  };
}

// ─── Reading the question ────────────────────────────────────────────────────

function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
}

/** Ordinary words that sit one typo away from a name and must never be "corrected". */
const COMMON = new Set(
  "about after again alibi before between called calls camera cameras cards could drink drive files first floor glass grand grants hotels least makes minutes never night order phone record records river route rivers sales seems should since still story table texts their there these those times value where which while whisky would"
    .split(" "),
);

interface Parsed {
  q: string;
  numbers: number[];
  times: number[];
  people: Person[];
  places: Place[];
  /** Names we corrected: "elana" → "Elena". */
  corrected: string[];
}

function parse(ctx: Ctx, question: string): Parsed {
  let q = ` ${question.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”"]/g, " ")} `;
  const corrected: string[] = [];

  // Typos in names and places: compare longer words with every longer single-word alias.
  const vocab = new Map<string, string>();
  for (const p of ctx.people) for (const a of p.ask) if (a.length >= 5 && !a.includes(" ")) vocab.set(a, p.first);
  for (const p of ctx.places) for (const a of p.aliases) if (a.length >= 5 && !a.includes(" ")) vocab.set(a, p.loc.name);
  q = q.replace(/[a-z]{5,}/g, (w) => {
    if (vocab.has(w) || COMMON.has(w)) return w;
    let best: string | null = null;
    let bestD = 9;
    for (const a of vocab.keys()) {
      const dist = lev(w, a);
      if (dist < bestD && dist <= (a.length >= 7 ? 2 : 1)) [best, bestD] = [a, dist];
    }
    if (!best) return w;
    corrected.push(vocab.get(best)!);
    return best;
  });

  const numbers = new Set<number>();
  for (const m of q.matchAll(/(?:#\s?|\brecords?\s+(?:no\.?\s*|number\s+)?|\be-)0*(\d{1,3})\b/g)) numbers.add(Number(m[1]));

  const times: number[] = [];
  const hour = (h: number, ap?: string) => (ap === "pm" && h < 12 ? h + 12 : ap === "am" && h === 12 ? 0 : h);
  for (const m of q.matchAll(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b|\b(\d{1,2})\s*(am|pm)\b|\bmidnight\b/g)) {
    if (m[0] === "midnight") times.push(120);
    else if (m[1]) times.push(nightMinutes(`${hour(Number(m[1]), m[3])}:${m[2]}`));
    else times.push(nightMinutes(`${hour(Number(m[4]), m[5])}:00`));
  }

  const at = (alias: string) => q.search(new RegExp(`(^|[^a-z0-9-])${esc(alias)}('s)?([^a-z0-9-]|$)`));
  const firstHit = (aliases: string[]) => Math.min(...aliases.map(at).filter((i) => i >= 0), Infinity);
  const people = ctx.people
    .map((p) => ({ p, i: firstHit(p.ask) }))
    .filter((x) => x.i < Infinity)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.p);
  const places = ctx.places
    .map((p) => ({ p, i: firstHit(p.aliases) }))
    .filter((x) => x.i < Infinity)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.p);

  return { q, numbers: [...numbers], times, people, places, corrected: [...new Set(corrected)] };
}

// ─── Answers ─────────────────────────────────────────────────────────────────

interface Draft {
  lines: string[];
  refs: Set<string>;
  suggestions: string[];
}

const draft = (): Draft => ({ lines: [], refs: new Set(), suggestions: [] });
const cite = (d: Draft, e: Evidence) => {
  d.refs.add(e.id);
  return `${code(e.number)} ${e.title}`;
};
const momentLine = (d: Draft, m: Moment) => {
  d.refs.add(m.e.id);
  return `— ${m.time} · ${code(m.e.number)} ${m.claim ? "(their own account) " : ""}${m.text}`;
};
const between = (ctx: Ctx, lo: number, hi: number) => ctx.moments.filter((m) => m.min >= lo && m.min <= hi);
const namesIn = (ctx: Ctx, e: Evidence) => ctx.people.filter((p) => e.suspects.includes(p.id) || p.inText.slice(0, 3).some((r) => r.test(recordText(e))));
const personRecords = (ctx: Ctx, person: Person) => ctx.visible.filter((e) => namesIn(ctx, e).includes(person));
const personMoments = (ctx: Ctx, person: Person) => ctx.moments.filter((m) => m.people.has(person.id));
const placeName = (ctx: Ctx, id: string | null) => (id ? (ctx.places.find((p) => p.loc.id === id)?.loc.name ?? null) : null);
const byId = (ctx: Ctx, id: string) => ctx.visible.find((e) => e.id === id)!;
const objectiveWindow = (ctx: Ctx) => `between ${clock(ctx.window[0])} and ${clock(ctx.window[1])}`;

function help(ctx: Ctx): Draft {
  const d = draft();
  const someone = ctx.bundle.suspects[0]?.name.split(" ")[0] ?? "someone";
  d.lines.push(
    "I keep the index of what you've found. Ask me to:",
    `— follow one person through the night: “Where was ${someone} at 23:30?”`,
    "— check whether a journey fits a window: “Could someone get from the garage to the Mercury Bar between 23:43 and 23:50?”",
    `— lay out a stretch of the night, or its silences: “What's missing ${objectiveWindow(ctx)}?”`,
    ctx.visible.length >= 2
      ? `— open a record, or set two side by side: “Compare ${code(ctx.visible[0].number)} and ${code(ctx.visible[1].number)}”`
      : "— open a record by its number, or set two side by side.",
    "— show which records disagree, and which are filed as unverified.",
    "I won't tell you who did it.",
  );
  d.suggestions.push(`What happened ${objectiveWindow(ctx)}?`, "Which records disagree?");
  return d;
}

function decline(ctx: Ctx): Draft {
  const d = draft();
  d.lines.push(
    "That's the verdict, and the verdict is yours to file — I don't name anyone.",
    ctx.conflicts.length
      ? `What I can tell you: ${plural(ctx.conflicts.length, "pair")} of records you hold disagree with each other. That's usually where a story breaks.`
      : "What I can do is lay out what your records say, minute by minute. Start with the window that matters.",
  );
  d.suggestions.push(ctx.conflicts.length ? "Which records disagree?" : `What happened ${objectiveWindow(ctx)}?`, `What's missing ${objectiveWindow(ctx)}?`);
  return d;
}

function describe(ctx: Ctx, e: Evidence): Draft {
  const d = draft();
  d.lines.push(`${cite(d, e)} — ${e.category.toLowerCase()} record from ${e.source}, filed as ${RELIABILITY[e.reliability]}.`);
  d.lines.push(e.summary);
  const facts: string[] = [];
  if (e.time) facts.push(`stamped ${e.time}`);
  const place = placeName(ctx, e.location);
  if (place) facts.push(`at ${place}`);
  const names = namesIn(ctx, e);
  if (names.length) facts.push(`names ${names.map((p) => p.name).join(", ")}`);
  const times = [...new Set(ctx.moments.filter((m) => m.e.id === e.id).map((m) => m.time))];
  if (times.length > 1) facts.push(`times inside: ${times.join(", ")}`);
  if (facts.length) d.lines.push(`On the record: ${facts.join(" · ")}.`);
  for (const c of ctx.conflicts.filter((x) => x.a === e.id || x.b === e.id)) {
    const other = byId(ctx, c.a === e.id ? c.b : c.a);
    d.lines.push(`— Flagged against ${cite(d, other)}: ${c.prompt}`);
  }
  const related = e.related.map((id) => ctx.visible.find((x) => x.id === id)).filter((x): x is Evidence => !!x);
  if (related.length) d.lines.push(`Cross-referenced with ${related.map((r) => cite(d, r)).join("; ")}.`);
  if (related[0]) d.suggestions.push(`Compare ${code(e.number)} and ${code(related[0].number)}`);
  const who = names.find((p) => p.id !== "victim");
  if (who && e.time) d.suggestions.push(`Where was ${who.first} at ${e.time}?`);
  return d;
}

function compare(ctx: Ctx, a: Evidence, b: Evidence): Draft {
  const d = draft();
  d.lines.push(`${cite(d, a)} (${RELIABILITY[a.reliability]}) and ${cite(d, b)} (${RELIABILITY[b.reliability]}).`);
  const before = d.lines.length;
  const flagged = ctx.conflicts.find((c) => (c.a === a.id && c.b === b.id) || (c.a === b.id && c.b === a.id));
  if (flagged) d.lines.push(`They're flagged as conflict ${flagged.number}: ${flagged.prompt}`);
  const na = new Set(namesIn(ctx, a).map((p) => p.name));
  const shared = namesIn(ctx, b)
    .map((p) => p.name)
    .filter((n) => na.has(n));
  if (shared.length) d.lines.push(`Both name ${shared.join(", ")}.`);
  const pa = new Set([a.location, ...a.locations].filter(Boolean));
  const sharedPlaces = [...new Set([b.location, ...b.locations].filter((x): x is string => !!x && pa.has(x)))];
  if (sharedPlaces.length) d.lines.push(`Both are tied to ${sharedPlaces.map((x) => placeName(ctx, x)).join(", ")}.`);
  const ma = ctx.moments.filter((m) => m.e.id === a.id);
  const mb = ctx.moments.filter((m) => m.e.id === b.id);
  if (ma.length && mb.length) {
    // Prefer moments about the same person; otherwise simply the closest in time.
    const pairs = ma.flatMap((x) => mb.map((y) => [x, y] as [Moment, Moment]));
    const sameone = pairs.filter(([x, y]) => [...x.people].some((id) => y.people.has(id)));
    const pool = sameone.length ? sameone : pairs;
    const best = pool.reduce((acc, pr) => (Math.abs(pr[0].min - pr[1].min) < Math.abs(acc[0].min - acc[1].min) ? pr : acc));
    const gap = Math.abs(best[0].min - best[1].min);
    d.lines.push(gap === 0 ? `They meet at ${best[0].time}:` : `Their closest moments are ${plural(gap, "minute")} apart:`, momentLine(d, best[0]), momentLine(d, best[1]));
    const shared = ctx.people.find((x) => x.id !== "victim" && best[0].people.has(x.id) && best[1].people.has(x.id));
    const [t1, t2] = [Math.min(best[0].min, best[1].min), Math.max(best[0].min, best[1].min)];
    if (shared && gap > 0) d.suggestions.push(`Where was ${shared.first} between ${clock(t1)} and ${clock(t2)}?`);
  }
  if (a.related.includes(b.id) || b.related.includes(a.id)) d.lines.push("Each file cross-references the other.");
  if (d.lines.length === before) d.lines.push("Nothing on file ties these two together directly.");
  return d;
}

function route(ctx: Ctx, from: string, to: string) {
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, { at: string; minutes: number; mode: string }>();
  const open = new Set(ctx.bundle.locations.map((l) => l.id));
  while (open.size) {
    let u: string | null = null;
    for (const id of open) if (dist.has(id) && (u === null || dist.get(id)! < dist.get(u)!)) u = id;
    if (u === null || u === to) break;
    open.delete(u);
    for (const r of ctx.bundle.routes) {
      const v = r.from === u ? r.to : r.to === u ? r.from : null;
      if (!v || !open.has(v)) continue;
      const alt = dist.get(u)! + r.minutes;
      if (!dist.has(v) || alt < dist.get(v)!) {
        dist.set(v, alt);
        prev.set(v, { at: u, minutes: r.minutes, mode: r.mode });
      }
    }
  }
  if (!dist.has(to)) return null;
  const legs: { to: string; minutes: number; mode: string }[] = [];
  for (let at = to; at !== from; ) {
    const p = prev.get(at)!;
    legs.unshift({ to: at, minutes: p.minutes, mode: p.mode });
    at = p.at;
  }
  return { minutes: dist.get(to)!, legs };
}

const how = (mode: string) => (mode === "walk" ? "on foot" : "by car");

function travel(ctx: Ctx, p: Parsed): Draft {
  const d = draft();
  let from = p.places[0]?.loc.id ?? null;
  let to = p.places[1]?.loc.id ?? null;
  const person = p.people[0];
  let startedAt: number | null = null;
  if (person && p.places.length === 1) {
    // "Could Noah reach the hotel by 23:40?" — start from the last place a record puts them.
    const t = p.times.length ? Math.min(...p.times) : Infinity;
    const placed = personMoments(ctx, person).filter((m) => m.min <= t && m.place);
    const last = placed.filter((m) => !m.claim).at(-1) ?? placed.at(-1);
    if (last?.place && last.place !== p.places[0].loc.id) {
      from = last.place;
      to = p.places[0].loc.id;
      startedAt = last.min;
      d.lines.push(`The last record you hold that places ${person.name} before then puts them at ${placeName(ctx, last.place)}:`, momentLine(d, last));
    } else {
      d.lines.push(`Nothing you hold places ${person.name} somewhere else before then.`);
    }
  }
  if (!from || !to) {
    if (!d.lines.length) d.lines.push("Tell me both ends of the journey — two places on the map, like “from the garage to the Mercury Bar”.");
    d.suggestions.push(`How long from ${ctx.places[0].loc.name} to ${ctx.places[1].loc.name}?`);
    return d;
  }
  if (from === to) {
    d.lines.push(`That's the same place on the map: ${placeName(ctx, from)}.`);
    return d;
  }
  const path = route(ctx, from, to);
  if (!path) {
    d.lines.push(`The map has no route between ${placeName(ctx, from)} and ${placeName(ctx, to)}.`);
    return d;
  }
  d.lines.push(
    path.legs.length === 1
      ? `${placeName(ctx, from)} → ${placeName(ctx, to)}: ${path.minutes} min ${how(path.legs[0].mode)}.`
      : `${placeName(ctx, from)} → ${placeName(ctx, to)}: ${path.minutes} min, via ${path.legs
          .slice(0, -1)
          .map((l) => placeName(ctx, l.to))
          .join(", ")} (${path.legs.map((l) => `${l.minutes} ${how(l.mode)}`).join(" + ")}).`,
  );
  const window = p.times.length >= 2 ? [Math.min(...p.times), Math.max(...p.times)] : startedAt !== null && p.times.length === 1 ? [startedAt, p.times[0]] : null;
  if (window && window[1] >= window[0]) {
    const [lo, hi] = window;
    const spare = hi - lo - path.minutes;
    d.lines.push(
      spare >= 0
        ? `Your window, ${clock(lo)} to ${clock(hi)}, is ${plural(hi - lo, "minute")}. ${spare === 0 ? "It fits exactly — not a minute to spare." : `It fits, with ${plural(spare, "minute")} to spare.`}`
        : `Your window, ${clock(lo)} to ${clock(hi)}, is ${plural(hi - lo, "minute")}; the journey takes ${path.minutes}. It doesn't fit — unless one of those times is wrong.`,
    );
  } else {
    d.lines.push("Give me two times and I'll tell you whether the journey fits between them.");
  }
  return d;
}

function whereabouts(ctx: Ctx, p: Parsed, person: Person): Draft {
  const d = draft();
  const all = personMoments(ctx, person);
  if (!all.length) {
    d.lines.push(`Nothing you hold puts a time on ${person.name}'s movements.`);
    if (personRecords(ctx, person).length) d.suggestions.push(`What do we have on ${person.name}?`);
    return d;
  }
  if (!p.times.length) {
    d.lines.push(`${person.name}'s night, as your records tell it:`);
    for (const m of all.slice(0, 12)) d.lines.push(momentLine(d, m));
    if (all.length > 12) d.lines.push(`…and ${all.length - 12} more.`);
    if (all.some((m) => m.claim)) d.lines.push("Lines marked “their own account” are what someone said, not what a system logged.");
    d.suggestions.push(`What contradicts ${person.name}?`);
    return d;
  }
  const [lo, hi] = [Math.min(...p.times), Math.max(...p.times)];
  const within = all.filter((m) => m.min >= lo && m.min <= hi);
  const before = all.filter((m) => m.min < lo).slice(-2);
  const after = all.filter((m) => m.min > hi).slice(0, 2);
  const label = lo === hi ? `at ${clock(lo)}` : `between ${clock(lo)} and ${clock(hi)}`;
  if (within.length) {
    d.lines.push(`Records that place ${person.name} ${label}:`);
    for (const m of within) d.lines.push(momentLine(d, m));
  } else {
    d.lines.push(`Nothing you hold places ${person.name} exactly ${label}. The nearest moments:`);
  }
  if (before.length) {
    d.lines.push(within.length ? "Just before:" : "Before:");
    for (const m of before) d.lines.push(momentLine(d, m));
  }
  if (after.length) {
    d.lines.push(within.length ? "Just after:" : "After:");
    for (const m of after) d.lines.push(momentLine(d, m));
  }
  const logged = [...before, ...within, ...after].filter((m) => !m.claim && m.place);
  const b = logged.filter((m) => m.min <= lo).at(-1);
  const a = logged.find((m) => m.min >= hi);
  if (b?.place && a?.place && b.place !== a.place) {
    const path = route(ctx, b.place, a.place);
    if (path)
      d.lines.push(
        `From ${placeName(ctx, b.place)} at ${b.time} to ${placeName(ctx, a.place)} at ${a.time} is ${plural(a.min - b.min, "minute")}; the map says the trip takes ${path.minutes}.`,
      );
  }
  d.suggestions.push(`What happened between ${clock(lo - 5)} and ${clock(hi + 5)}?`, `What contradicts ${person.name}?`);
  return d;
}

function timeline(ctx: Ctx, p: Parsed): Draft {
  const d = draft();
  const [lo, hi] = p.times.length >= 2 ? [Math.min(...p.times), Math.max(...p.times)] : p.times.length ? [p.times[0] - 10, p.times[0] + 10] : ctx.window;
  const list = between(ctx, lo, hi);
  if (!list.length) {
    d.lines.push(`No record you hold is stamped between ${clock(lo)} and ${clock(hi)}.`);
    d.suggestions.push(`What's missing between ${clock(lo - 30)} and ${clock(hi + 30)}?`);
    return d;
  }
  const records = new Set(list.map((m) => m.e.id)).size;
  d.lines.push(`${plural(records, "record")} you hold mention a time between ${clock(lo)} and ${clock(hi)}:`);
  for (const m of list.slice(0, 14)) d.lines.push(momentLine(d, m));
  if (list.length > 14) d.lines.push(`…and ${list.length - 14} more. Narrow the window to see them.`);
  const who = ctx.people.find((x) => x.id !== "victim" && list.some((m) => m.people.has(x.id) && !m.claim));
  if (who) d.suggestions.push(`Where was ${who.first} between ${clock(lo)} and ${clock(hi)}?`);
  d.suggestions.push(`What's missing between ${clock(lo)} and ${clock(hi)}?`);
  return d;
}

function gaps(ctx: Ctx, p: Parsed): Draft {
  const d = draft();
  const [lo, hi] = p.times.length >= 2 ? [Math.min(...p.times), Math.max(...p.times)] : ctx.window;
  const facts = between(ctx, lo, hi).filter((m) => !m.claim);
  const stamps = [...new Set([lo, ...facts.map((m) => m.min), hi])].sort((a, b) => a - b);
  const holes: { from: number; to: number }[] = [];
  for (let i = 1; i < stamps.length; i++) if (stamps[i] - stamps[i - 1] >= 5) holes.push({ from: stamps[i - 1], to: stamps[i] });
  holes.sort((a, b) => b.to - b.from - (a.to - a.from));
  if (!holes.length) {
    d.lines.push(`Between ${clock(lo)} and ${clock(hi)} your records leave no silence longer than a few minutes.`);
    return d;
  }
  d.lines.push(`The longest silences between ${clock(lo)} and ${clock(hi)} — stretches no system record you hold logs anything:`);
  for (const h of holes.slice(0, 3)) {
    d.lines.push(`— ${clock(h.from)} → ${clock(h.to)} (${plural(h.to - h.from, "minute")})`);
    const edgeBefore = facts.filter((m) => m.min === h.from).at(-1);
    const edgeAfter = facts.find((m) => m.min === h.to);
    if (edgeBefore) {
      d.refs.add(edgeBefore.e.id);
      d.lines.push(`   before it: ${code(edgeBefore.e.number)} ${edgeBefore.text}`);
    }
    if (edgeAfter) {
      d.refs.add(edgeAfter.e.id);
      d.lines.push(`   after it: ${code(edgeAfter.e.number)} ${edgeAfter.text}`);
    }
  }
  d.lines.push("A silence proves nothing on its own — but it's where someone could move unseen, or where a record is still missing.");
  d.suggestions.push(`What happened between ${clock(holes[0].from)} and ${clock(holes[0].to)}?`);
  return d;
}

function pairLine(ctx: Ctx, d: Draft, c: ConflictView, numbered = false) {
  return `— ${numbered ? `${c.number}. ` : ""}${cite(d, byId(ctx, c.a))}  ×  ${cite(d, byId(ctx, c.b))}`;
}

function conflicts(ctx: Ctx, person: Person | undefined): Draft {
  const d = draft();
  if (person) {
    const own = new Set(ctx.visible.filter((e) => e.category === "INTERVIEW" && e.suspects.includes(person.id)).map((e) => e.id));
    const named = new Set(personRecords(ctx, person).map((e) => e.id));
    const hits = ctx.conflicts.filter((c) => own.has(c.a) || own.has(c.b));
    const around = ctx.conflicts.filter((c) => !hits.includes(c) && (named.has(c.a) || named.has(c.b)));
    if (hits.length) {
      d.lines.push(`${plural(hits.length, "pair")} where ${person.name}'s own words sit against another record:`);
      for (const c of hits) d.lines.push(pairLine(ctx, d, c), `   ${c.prompt}`);
    }
    if (around.length) {
      d.lines.push(`${hits.length ? "Also, " : "No statement of theirs is flagged yet, but "}${plural(around.length, "flagged pair")} involve records that name them:`);
      for (const c of around) d.lines.push(pairLine(ctx, d, c));
    }
    if (!hits.length && !around.length) {
      d.lines.push(`Nothing you hold sets ${person.name}'s account against another record yet.`);
      if (!own.size) d.lines.push(`You don't hold a statement from ${person.name}.`);
      d.suggestions.push(`Where was ${person.first} ${objectiveWindow(ctx)}?`);
      return d;
    }
    d.lines.push("Whether those are lies, mistakes or something else is for you to decide.");
    return d;
  }
  if (!ctx.conflicts.length) {
    d.lines.push("No pair of records you hold is flagged as disagreeing yet. Conflicts surface as you find more — statements against logs are the usual place.");
    return d;
  }
  d.lines.push(`${plural(ctx.conflicts.length, "pair")} of records you hold disagree:`);
  for (const c of ctx.conflicts) d.lines.push(pairLine(ctx, d, c, true), `   ${c.prompt}`);
  const first = ctx.conflicts[0];
  d.suggestions.push(`Compare ${code(byId(ctx, first.a).number)} and ${code(byId(ctx, first.b).number)}`);
  return d;
}

function reliability(ctx: Ctx, person: Person | undefined): Draft {
  const d = draft();
  const pool = person ? personRecords(ctx, person) : ctx.visible;
  const shaky = pool.filter((e) => e.reliability !== "VERIFIED");
  if (!shaky.length) {
    d.lines.push(`Everything you hold${person ? ` on ${person.name}` : ""} is filed as verified.`);
    return d;
  }
  d.lines.push(`Filed as less than verified${person ? ` — records on ${person.name}` : ""}:`);
  for (const r of ["FABRICATED", "CORRUPTED", "DISPUTED", "UNVERIFIED", "LIKELY"] as Reliability[]) {
    const group = shaky.filter((e) => e.reliability === r);
    if (group.length) d.lines.push(`${RELIABILITY[r][0].toUpperCase()}${RELIABILITY[r].slice(1)}:`, ...group.map((e) => `— ${cite(d, e)}`));
  }
  d.lines.push("That's how each source filed it — not a judgement on whether it's true.");
  return d;
}

function profile(ctx: Ctx, person: Person): Draft {
  const d = draft();
  const s = ctx.bundle.suspects.find((x) => x.id === person.id);
  d.lines.push(s ? `${s.name} — ${s.role}. ${s.relation}.` : `${person.name} — the victim.`);
  const recs = personRecords(ctx, person);
  if (!recs.length) {
    d.lines.push(`No record you hold names ${person.name} yet.`);
    return d;
  }
  d.lines.push(`${plural(recs.length, "record")} you hold name or involve them:`);
  for (const e of recs.slice(0, 10)) d.lines.push(`— ${cite(d, e)}`);
  if (recs.length > 10) d.lines.push(`…and ${recs.length - 10} more.`);
  const logged = personMoments(ctx, person).filter((m) => !m.claim);
  if (logged.length) {
    const [first, last] = [logged[0], logged.at(-1)!];
    d.lines.push(
      first === last
        ? `One logged moment: ${first.time} (${code(first.e.number)}).`
        : `First logged at ${first.time} (${code(first.e.number)}), last at ${last.time} (${code(last.e.number)}).`,
    );
    if (person.id !== "victim") d.suggestions.push(`Where was ${person.first} at ${last.time}?`);
  }
  const own = recs.filter((e) => e.category === "INTERVIEW" && e.suspects.includes(person.id));
  const flagged = ctx.conflicts.filter((c) => own.some((e) => e.id === c.a || e.id === c.b)).length;
  if (flagged) d.lines.push(`${plural(flagged, "flagged conflict")} ${flagged === 1 ? "touches" : "touch"} their own statement.`);
  if (person.id !== "victim") d.suggestions.push(`What contradicts ${person.name}?`, `Is anything on ${person.first} unverified?`);
  return d;
}

function placeReport(ctx: Ctx, place: Place): Draft {
  const d = draft();
  d.lines.push(`${place.loc.name}, ${place.loc.district}. ${place.loc.description}`);
  const recs = ctx.visible.filter((e) => e.location === place.loc.id || e.locations.includes(place.loc.id));
  if (recs.length) {
    d.lines.push(`${plural(recs.length, "record")} you hold are tied to it:`);
    for (const e of recs.slice(0, 10)) d.lines.push(`— ${cite(d, e)}`);
    if (recs.length > 10) d.lines.push(`…and ${recs.length - 10} more.`);
  } else d.lines.push("No record you hold is tied to it yet.");
  const routes = ctx.bundle.routes
    .filter((r) => r.from === place.loc.id || r.to === place.loc.id)
    .map((r) => `${placeName(ctx, r.from === place.loc.id ? r.to : r.from)} ${r.minutes} min ${how(r.mode)}`);
  if (routes.length) d.lines.push(`Routes: ${routes.join(" · ")}.`);
  const other = ctx.bundle.routes.find((r) => r.from === place.loc.id || r.to === place.loc.id);
  if (other) d.suggestions.push(`How long from ${place.loc.name} to ${placeName(ctx, other.from === place.loc.id ? other.to : other.from)}?`);
  return d;
}

const STOP = new Set(
  "what which where when does did the and about with from that this there have anything know records record show tell who were was any all for are can you your our his her him she they them how why get got has had into onto than then just only also more most some there's what's who's me my i".split(" "),
);

function keyword(ctx: Ctx, p: Parsed): Draft | null {
  const words = p.q.split(/[^\p{L}\p{N}-]+/u).filter((w) => w.length > 2 && !STOP.has(w));
  if (!words.length) return null;
  const scored = ctx.visible
    .map((e) => {
      const hay = recordText(e).toLowerCase();
      const title = e.title.toLowerCase();
      return { e, score: words.reduce((s, w) => s + (hay.includes(w) ? (title.includes(w) ? 2 : 1) : 0), 0) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.e.number - b.e.number)
    .slice(0, 8);
  if (!scored.length) return null;
  const d = draft();
  d.lines.push(`${plural(scored.length, "record")} you hold touch on that:`);
  for (const { e } of scored) {
    const line = recordLines(e).find((l) => words.some((w) => l.toLowerCase().includes(w)));
    d.lines.push(`— ${cite(d, e)}${line ? ` — “${line.length > 90 ? `${line.slice(0, 87)}…` : line}”` : ""}`);
  }
  d.suggestions.push(`Tell me about ${code(scored[0].e.number)}`);
  return d;
}

// ─── Routing ─────────────────────────────────────────────────────────────────

const RX = {
  help: /^\s*(help|\?+|hi|hello|hey|what can you do|how (do|does) (i|you|this|oracle) (use|work)|commands?)\b/,
  culprit:
    /who (killed|murdered|poisoned|did it|is (the )?(killer|culprit|murderer))|\b(is|was) \w+( \w+)? (guilty|innocent|the (killer|culprit|murderer))|\bsolve\b|\bculprit\b|\bthe answer\b|whodunn?it|who('s| is) responsible/,
  travel: /\btravel|\bget (from|to|there|back)|\bdrive|\bdriving|\bwalk|\bhow (long|far)|\bdistance|make it|in time|\breach|\broute|\bjourney|\btrip\b/,
  gaps: /\bgaps?\b|missing|unaccounted|silence|\bblank|nothing (happen|logged|on file)|dead time/,
  conflict: /contradict|conflict|disagree|\blie\b|\blies\b|lying|inconsisten|(doesn't|don't|does not|do not) (match|add up)/,
  reliability: /reliab|\btrust|verified|unverified|disputed|fake|fabricat|corrupt|doubt|forged|tamper/,
  where: /\bwhere\b|\bwhereabouts|\balibi|\bmovements?\b|\bnight\b|\bwhen did\b|\bwhat time\b|\bseen\b/,
  timeline: /timeline|sequence|\border\b|happen|going on|\bevents?\b|\bbetween\b|minute by minute/,
  compare: /compare|versus|\bvs\.?\b|difference/,
};

/** ORACLE: reads the question, picks the kind of answer, answers only from held records. */
export function askOracle(bundle: CaseBundle, visible: Evidence[], conflictsHeld: ConflictView[], question: string): OracleAnswer {
  const ctx = context(bundle, visible, conflictsHeld);
  const p = parse(ctx, question);
  const q = p.q;
  const person = p.people[0];
  const records = p.numbers.map((n) => ctx.byNumber.get(n)).filter((e): e is Evidence => !!e);
  const missing = p.numbers.filter((n) => !ctx.byNumber.has(n));

  let d: Draft | null = null;
  if (RX.help.test(q) && q.trim().split(/\s+/).length <= 6) d = help(ctx);
  else if (RX.culprit.test(q)) d = decline(ctx);
  else if (records.length >= 2) d = compare(ctx, records[0], records[1]);
  else if (missing.length) {
    d = draft();
    d.lines.push(`${missing.map(code).join(", ")} ${missing.length > 1 ? "aren't" : "isn't"} on your desk. I can only read records you've found.`);
    if (records[0]) d.suggestions.push(`Tell me about ${code(records[0].number)}`);
  } else if (records.length === 1) d = describe(ctx, records[0]);
  else if ((RX.travel.test(q) && p.places.length) || (p.places.length >= 2 && /\bto\b/.test(q))) d = travel(ctx, p);
  else if (RX.gaps.test(q)) d = gaps(ctx, p);
  else if (RX.conflict.test(q)) d = conflicts(ctx, person);
  else if (RX.reliability.test(q)) d = reliability(ctx, person);
  else if (person && (p.times.length || RX.where.test(q))) d = whereabouts(ctx, p, person);
  else if (p.times.length || RX.timeline.test(q)) d = timeline(ctx, p);
  else if (person) d = profile(ctx, person);
  else if (p.places.length) d = placeReport(ctx, p.places[0]);
  else d = keyword(ctx, p);

  if (!d) {
    d = draft();
    d.lines.push("I can't find anything on file about that. Try a name, a place, a time (“23:40 to 23:50”), a record number, or ask which records disagree.");
    d.suggestions.push("What can you do?");
  }
  if (p.corrected.length) d.lines.unshift(`(Reading that as ${p.corrected.join(", ")}.)`);

  // Belt and braces: only ever cite records the player holds.
  const held = new Set(visible.map((e) => e.id));
  const asked = question.trim().toLowerCase();
  return {
    text: d.lines.join("\n"),
    refs: [...d.refs].filter((id) => held.has(id)),
    suggestions: [...new Set(d.suggestions)].filter((s) => s.toLowerCase() !== asked).slice(0, 3),
  };
}
