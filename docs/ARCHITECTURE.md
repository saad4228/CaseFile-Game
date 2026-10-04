# CASEFILE — Architecture

## 1. Principles

1. **The server is authoritative.** Case truth, hidden evidence, lead outcomes, conflict
   detection and scoring run on the server. The browser only ever receives what the player
   has legitimately discovered.
2. **Layers stay separate.** Case data ≠ game engine ≠ UI ≠ AI. Each can change without
   touching the others.
3. **Deterministic core, AI on the edge.** The truth engine decides what happened; AI (phase 7)
   only *presents* — dialogue, phrasing, ORACLE answers — and only over discovered data.

```
CASE DATA (data/cases/*)          ← handcrafted now, generated + validated later
   │
   ▼
CASE TRUTH ENGINE (lib/game-engine) ← server-only: leads, conflicts, verdict, scoring
   │
   ▼
GAME STATE (session)              ← today: per-browser; next: Postgres + Realtime
   │
   ▼
PLAYER ACTIONS (server actions)   ← follow lead, mark conflict, submit verdict
   │
   ▼
UI (app/, components/)            ← renders only discovered, public data
   │
   ▼
AI PRESENTATION (lib/ai, later)   ← sees discovered data only, never the truth
```

## 2. Stack

| Concern | Choice | Status |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript | ✅ |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) | ✅ |
| Motion | Framer Motion | ✅ |
| Board | React Flow (`@xyflow/react`) | ✅ |
| Server/API | Next.js server components + server actions | ✅ |
| Database | PostgreSQL via Prisma (`prisma/schema.prisma`) | schema drafted, not wired |
| Auth | Supabase Auth (Google, GitHub, email) | planned — needs project keys |
| Realtime | Supabase Realtime (presence, chat, board, evidence events) | planned |
| Storage | Supabase Storage for case media | planned |

## 3. Folder layout

```
app/
  page.tsx                  landing (marketing)
  archive/                  case archive
  cases/[caseId]/           cinematic case introduction
  investigation/[caseId]/   investigation workspace
  actions/                  server actions (game API surface)
components/
  ui/  landing/  archive/  case/  evidence/  board/  timeline/  suspects/  illustrations/
lib/
  game-engine/              types, case registry, leads, conflicts (server-only)
  scoring/                  verdict scoring (server-only)            — milestone 4
  realtime/  auth/  db/  ai/                                           — later milestones
data/cases/case-047/
  meta.ts  suspects.ts  locations.ts      public — safe for the client
  evidence.server.ts                      every evidence item (server-only)
  leads.server.ts  conflicts.server.ts    discovery + conflict rules (server-only)
  truth.server.ts                         the solution (server-only)
prisma/schema.prisma
docs/
```

Files ending in `.server.ts` start with `import "server-only"`. Importing one from a client
component is a **build error**, which is the guard that keeps the culprit out of the bundle.

## 4. Data boundary

| Data | Where it lives | Who sees it |
| --- | --- | --- |
| Case meta, brief, intro beats | `meta.ts` | everyone |
| Suspect public profile + statements | `suspects.ts` | everyone |
| Locations, travel times | `locations.ts` | everyone |
| Evidence content | `evidence.server.ts` | only once discovered |
| Lead → evidence unlocks | `leads.server.ts` | lead *labels* once available; unlocks never |
| Conflict rules | `conflicts.server.ts` | a neutral prompt once both sides are discovered |
| Truth, suspect hidden variables, proof keys | `truth.server.ts` | never (scoring only) |

## 5. Game state

```ts
GameSession {
  caseId, players[], phase,
  discovered: EvidenceId[]       // the only key the server trusts for reveals
  shared / private evidence      // multiplayer (role-based starting hands)
  timeline: placements[]
  board: { nodes[], edges[] }    // edges typed: SUPPORTS, CONTRADICTS, ...
  conflictMarks: { conflictId: "contradiction" | "explained" | "ignored" }
  theories[], notes[], pins[]
  verdict?, score?
}
```

**Milestone 1–3 (now):** single player, state in `localStorage`, server actions recompute
reveals from the submitted `discovered` list. Hidden content still never ships until it's
earned, but a determined player could forge the list.

**Milestone 5 (multiplayer):** `GameSession` moves to Postgres. Server actions read the
session by id, check membership, mutate and broadcast via Supabase Realtime channels
(`room:{code}` for presence + chat, `session:{id}` for board/evidence events). Private
evidence lives on `CasePlayer` and is only broadcast when shared.

## 6. Security checklist (MVP)

- Every server action re-validates input and (from milestone 5) session membership.
- Rate-limit lead / verdict actions per session.
- Chat sanitized server-side; rendered as text, never HTML.
- Row-level security on session tables; admin case tools behind a role check.
- No truth fields in any client-serialized prop — enforced by the `server-only` import.

## 7. Performance

- Server components by default; client components only for interaction (board, viewer,
  tray, intro sequence).
- React Flow and the evidence viewer load only on the investigation route.
- Case media lazy-loaded per case; illustrations are SVG.
- Fonts via `next/font` (self-hosted, subset).
