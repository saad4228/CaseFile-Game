# CASEFILE — Architecture

## 1. Principles

1. **The server is authoritative.** Case truth, hidden evidence, lead outcomes, interview
   reactions, conflict detection and scoring run on the server. The browser only ever
   receives what the player has legitimately discovered.
2. **Layers stay separate.** Case data ≠ game engine ≠ UI ≠ AI. Each can change without
   touching the others.
3. **Deterministic throughout.** The truth engine decides what happened. ORACLE only
   *presents* — and only over records the asking player holds. No model, no API key.
4. **Runs anywhere.** One Node process and one Postgres database. No websocket service, no
   external auth provider, no object storage. Without a database it still runs, in a
   single-device demo mode.

```
CASE DATA (data/cases/*)            content-as-code, checked by the case validator
   │
   ▼
CASE TRUTH ENGINE (lib/game-engine)  server-only: reachability, leads, interviews, conflicts
   │
   ▼
GAME STATE (lib/sessions + Postgres) sessions, players, discovered/private records, chat
   │
   ▼
PLAYER ACTIONS                        server actions + two JSON routes (ops, sync)
   │
   ▼
UI (app/, components/)                renders only discovered, public data
   │
   ▼
ORACLE (lib/oracle)                   question engine over discovered records — never the truth
```

## 2. Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 (React Compiler lint rules), TypeScript |
| Styling | Tailwind CSS v4, CSS-first `@theme` tokens in `app/globals.css` |
| Motion | Framer Motion (`MotionConfig` honours the player's reduced-motion setting) |
| Board | React Flow (`@xyflow/react`) |
| Database | PostgreSQL via Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) |
| Auth | Own: scrypt passwords, hashed database session tokens, Google/GitHub OAuth via `arctic` |
| Realtime | Versioned polling (`/api/sessions/:id/sync`) — no websocket service required |
| Tests | Vitest (engine, scoring, auth, spoiler safety), Playwright (end-to-end) |

## 3. Folder layout

```
app/
  page.tsx                   landing
  archive/                   the archive (progress, sealed files, next-case teaser)
  cases/[caseId]/            cinematic case introduction + start (solo / team)
  play/[code]/               a server session: lobby → investigation → resolution
  investigation/[caseId]/    device-only mode (no account, no database needed)
  rooms/new/                 open or join a team room
  profile/                   detective file: record, history, commendations, codename
  admin/                     records office (ADMIN_EMAILS only; 404 for everyone else)
  login/                     sign in / register / continue as a guest
  actions/                   server actions: auth, session, local, oracle, admin
  api/                       sessions/[id]/ops, sessions/[id]/sync, me, health, auth/oauth
components/                  UI by feature (board, evidence, suspects, verdict, …)
lib/
  game-engine/               types, shared-state reducer, interview engine, engine, validator
  scoring/                   verdict scoring + resolution builder (server-only)
  sessions/                  the multiplayer session service (server-only)
  auth/  db/  oracle/  client/ (sound, settings)
data/cases/case-047/
  meta.ts suspects.ts locations.ts verdict.ts                               public
  evidence.server.ts leads.server.ts interviews.server.ts truth.server.ts   server-only
prisma/                      schema + migrations
tests/unit  tests/e2e
```

Files ending in `.server.ts` start with `import "server-only"`. Importing one from a client
component is a **build error** — the guard that keeps the culprit out of the bundle. A unit
test also checks that the public case payload carries no solution text or hidden record
titles.

## 4. Data boundary

| Data | Where it lives | Who sees it |
| --- | --- | --- |
| Case meta, brief, intro beats, verdict options | `meta.ts`, `verdict.ts` | everyone |
| Suspect public profiles, locations, travel times | `suspects.ts`, `locations.ts` | everyone |
| Evidence content | `evidence.server.ts` | only once discovered (and, in a team, shared) |
| Lead → evidence unlocks | `leads.server.ts` | lead *labels* once available; unlocks never |
| Interview scripts and reactions | `interviews.server.ts` | the transcript of what was actually asked |
| Conflicts | `leads.server.ts` | a neutral prompt once both records are held |
| Truth, proof keys, relations, hidden profiles | `truth.server.ts` | only in the post-verdict resolution |

## 5. Game state and sync

Postgres holds one `GameSession` per investigation: `phase` (LOBBY → ACTIVE → RESOLVED), a
monotonically increasing `version`, and the **shared state** JSON (board, timeline,
conflict marks, theories, verdict draft). Around it:

- `CasePlayer` — membership, roles, and **personal state** (examined records, private notes).
- `SessionEvidence` — every discovered record, with `holderId` (null = shared with the team,
  otherwise private to one player) and how it was found (BRIEF, LEAD, INTERVIEW).
- `LeadFollow`, `Interview`, `Message`, `CaseResult`.

Edits are **operations** (`lib/game-engine/state.ts`), validated with zod and applied by a
pure reducer that both client and server run. Every operation is idempotent. The client
applies its own ops optimistically, batches them to `POST /api/sessions/:id/ops`, and the
server applies them under a row lock (`SELECT … FOR UPDATE`), rejecting any op that touches
a record the team hasn't shared. Clients poll `GET /api/sessions/:id/sync?v=<version>` —
every 1.5 s in a team, 6 s solo, slower in background tabs, with backoff — and receive a
full view only when the version moved (records they already hold aren't sent again).
Discoveries (leads, interviews, sharing, the verdict) are server actions that run inside the
same lock.

Device-only mode keeps state in `localStorage`; every discovery still goes through a server
action that re-derives what is reachable from the brief (`sanitizeLocal`), so a forged list
can't pull hidden records.

## 6. Team play

Roles (Detective, Analyst, Forensics, Cyber, Field Investigator) each hold part of the brief
privately; one common record is shared by everyone, and unclaimed roles are dealt out when
the case opens. Lead results stay private to whoever followed them; interview revelations
go to the team. Only shared records can be pinned, placed on the timeline, cited in
theories or attached as proof — so the case can't be solved without talking.

## 7. Security

- Session cookie: a random 32-byte token, stored only as a SHA-256 hash; httpOnly,
  SameSite=Lax, Secure in production; 60-day sliding expiry. Passwords: scrypt, per-user salt.
- OAuth never auto-links to an account unless the email is verified on both sides, and never
  moves a provider that's already connected to someone else.
- Every server action and route checks session membership; the ops route also checks `Origin`.
- Postgres-backed rate limits on sign-in, registration, guest creation, room creation, leads,
  interviews, chat, board operations, verdicts and ORACLE.
- Chat is sanitised server-side and rendered as text, never HTML.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`.
- Pages that depend on runtime configuration call `connection()`, so a build made without a
  database can never prerender them in the wrong mode.

## 8. Case validation

`lib/game-engine/validate.server.ts` checks a case bundle: unique ids, every cross-reference,
interview scripts, that **every record is reachable** through play, that the truth file is
consistent with the verdict options and proof slots, that a perfect investigation solves the
case and that a wrong culprit doesn't. It runs in the unit tests (so CI blocks a broken case)
and on the admin page.

## 9. Performance

- Server components by default; client components only for interaction.
- React Flow, the evidence viewer and device-only mode load on demand.
- Polling returns a tiny payload when nothing changed.
- Illustrations are SVG; sound is synthesised with WebAudio (no audio files).
- Fonts via `next/font` (self-hosted, subset).
