import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import type { CaseBundle } from "@/lib/game-engine/cases.server";
import { minutesFromTen } from "./time";
import type { ConflictView, Evidence } from "@/lib/game-engine/types";

// ORACLE assists reasoning; it never solves. It only ever sees records the asking player
// has legitimately discovered — the truth file is never in reach (PRD §36–37).

export interface OracleAnswer {
  text: string;
  refs: string[];
  source: "search" | "claude";
}

const code = (n: number) => `#${String(n).padStart(3, "0")}`;

function recordText(e: Evidence): string {
  const b = e.body;
  switch (b.kind) {
    case "statement":
      return b.quotes.join(" ");
    case "document":
      return [b.heading ?? "", ...b.lines, b.footer ?? ""].join(" ");
    case "handwritten":
      return b.lines.join(" ");
    case "log":
      return [b.columns.join(" "), ...b.rows.map((r) => r.cells.join(" ")), b.note ?? ""].join(" ");
    case "photo":
      return [b.caption, ...b.inFrame].join(" ");
    case "audio":
      return [...b.transcript, b.note ?? ""].join(" ");
    case "messages":
      return b.thread.map((m) => `${m.from} ${m.time} ${m.text}`).join(" ");
  }
}

/** Deterministic record search: relationships the player can verify themselves. */
export function searchOracle(bundle: CaseBundle, visible: Evidence[], conflicts: ConflictView[], question: string): OracleAnswer {
  const q = question.toLowerCase();
  const suspect = bundle.suspects.find((s) =>
    s.name
      .replace(/[“”"]/g, "")
      .toLowerCase()
      .split(" ")
      .some((part) => part.length > 2 && q.includes(part)),
  );
  const times = Array.from(q.matchAll(/\b(\d{1,2})[:.](\d{2})\b/g)).map((m) => `${m[1].padStart(2, "0")}:${m[2]}`);
  const wantsConflict = /contradict|conflict|disagree|lie|lying|inconsisten/.test(q);
  const lines: string[] = [];
  const refs = new Set<string>();

  if (suspect && wantsConflict) {
    const own = visible.filter((e) => e.category === "INTERVIEW" && e.suspects.includes(suspect.id)).map((e) => e.id);
    const hits = conflicts.filter((c) => own.includes(c.a) || own.includes(c.b));
    if (hits.length) {
      lines.push(`I found ${hits.length} record pair${hits.length > 1 ? "s" : ""} where ${suspect.name}'s own words sit against another record:`);
      for (const c of hits) {
        const a = visible.find((e) => e.id === c.a)!;
        const b = visible.find((e) => e.id === c.b)!;
        lines.push(`— ${code(a.number)} ${a.title}  ×  ${code(b.number)} ${b.title}`);
        refs.add(a.id).add(b.id);
      }
      lines.push("Whether those are lies, mistakes or something else is for you to decide.");
      return { text: lines.join("\n"), refs: [...refs], source: "search" };
    }
    lines.push(`Nothing you hold sets ${suspect.name}'s statements directly against another record yet.`);
  }

  if (times.length) {
    const lo = Math.min(...times.map(minutesFromTen));
    const hi = times.length > 1 ? Math.max(...times.map(minutesFromTen)) : lo + 10;
    const inWindow = visible.filter((e) => {
      const stamps = Array.from(recordText(e).matchAll(/\b(\d{2}):(\d{2})\b/g)).map((m) => minutesFromTen(`${m[1]}:${m[2]}`));
      if (e.time) stamps.push(minutesFromTen(e.time));
      return stamps.some((t) => t >= lo - 1 && t <= hi + 1);
    });
    if (inWindow.length) {
      lines.push(`${inWindow.length} record${inWindow.length > 1 ? "s" : ""} you hold mention a time in that window:`);
      for (const e of inWindow) {
        lines.push(`— ${code(e.number)} ${e.title}`);
        refs.add(e.id);
      }
      return { text: lines.join("\n"), refs: [...refs], source: "search" };
    }
    lines.push("No record you hold mentions a time in that window.");
  }

  if (suspect) {
    const named = visible.filter((e) => e.suspects.includes(suspect.id) || recordText(e).toLowerCase().includes(suspect.name.split(" ").at(-1)!.toLowerCase()));
    if (named.length) {
      lines.push(`${named.length} record${named.length > 1 ? "s" : ""} name or involve ${suspect.name}:`);
      for (const e of named.slice(0, 12)) {
        lines.push(`— ${code(e.number)} ${e.title}`);
        refs.add(e.id);
      }
      return { text: lines.join("\n"), refs: [...refs], source: "search" };
    }
  }

  // Keyword search across what's on file.
  const stop = new Set(["what", "which", "where", "when", "does", "did", "the", "and", "about", "with", "from", "that", "this", "there", "have", "anything", "know", "records", "record", "show", "tell", "who", "were", "was"]);
  const words = q.split(/[^\p{L}\p{N}-]+/u).filter((w) => w.length > 2 && !stop.has(w));
  const scored = visible
    .map((e) => {
      const hay = `${e.title} ${e.summary} ${recordText(e)}`.toLowerCase();
      return { e, score: words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.e.number - b.e.number)
    .slice(0, 8);
  if (scored.length) {
    lines.push(`These records you hold touch on that:`);
    for (const { e } of scored) {
      lines.push(`— ${code(e.number)} ${e.title}`);
      refs.add(e.id);
    }
    return { text: lines.join("\n"), refs: [...refs], source: "search" };
  }
  lines.push("I can't find anything on file about that. Try a name, a time (“23:40 to 23:50”), or ask what contradicts someone.");
  return { text: lines.join("\n"), refs: [], source: "search" };
}

const SYSTEM = `You are ORACLE, the records assistant in CASEFILE, a detective deduction game.

You help players reason about the records they have discovered. You do not solve the case.

Rules:
- Use only the records provided in this conversation. If something isn't in them, say you don't have it on file.
- Never name who you think committed the crime, never rank suspects, and never say whether a theory is correct.
- Point to relationships the player can check: records that agree, records that disagree, gaps in time, travel times, who could have been where.
- Cite records by their number, like #012. Keep answers short: a few sentences or a short list.
- Write plainly, in the voice of a careful archivist. No headings.`;

let client: Anthropic | null = null;

/** Natural-language ORACLE over discovered records. Falls back to search on any failure. */
export async function askOracle(
  bundle: CaseBundle,
  visible: Evidence[],
  conflicts: ConflictView[],
  question: string,
): Promise<OracleAnswer> {
  const search = searchOracle(bundle, visible, conflicts, question);
  if (!env.anthropicApiKey) return search;
  client ??= new Anthropic({ apiKey: env.anthropicApiKey, timeout: 45_000, maxRetries: 1 });

  const records = visible
    .map((e) => `${code(e.number)} — ${e.title} [${e.category}; source: ${e.source}; time: ${e.time ?? "none"}; filed as ${e.reliability}]\n${recordText(e)}`)
    .join("\n\n");
  const conflictText = conflicts.length
    ? conflicts.map((c) => `Conflict ${c.number}: ${c.prompt} (${c.a.replace("E-", "#")} vs ${c.b.replace("E-", "#")})`).join("\n")
    : "None flagged yet.";

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      cache_control: { type: "ephemeral" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Case ${bundle.meta.number}: ${bundle.meta.title}. Objective: ${bundle.meta.objective}\n\nRecords the player holds:\n\n${records}\n\nConflicts the system has flagged:\n${conflictText}`,
            },
            { type: "text", text: `Question: ${question}` },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal") return search;
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!text) return search;
    const refs = Array.from(new Set(Array.from(text.matchAll(/#0*(\d{1,3})\b/g)).map((m) => `E-${m[1].padStart(3, "0")}`))).filter(
      (id) => visible.some((e) => e.id === id),
    );
    return { text, refs, source: "claude" };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.warn("ORACLE rate limited; using record search");
    else if (error instanceof Anthropic.AuthenticationError) console.error("ORACLE: invalid ANTHROPIC_API_KEY");
    else if (error instanceof Anthropic.APIError) console.error(`ORACLE API error ${error.status}`);
    else console.error("ORACLE failed", error);
    return search;
  }
}
