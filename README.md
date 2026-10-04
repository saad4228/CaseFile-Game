# CASEFILE

> Every clue tells a story. Every story hides a lie.

A cinematic multiplayer detective deduction game for the browser. Players inspect evidence,
reconstruct timelines, interrogate suspects, challenge testimony and build a proof together.
Season One opens with **Case 047 — *The Last Call***: a journalist found dead in Room 314 of
the Blackwood Hotel, four people with something to hide, and 34 records to find.

## What's in the game

- **Archive and cinematic case introduction** — case folders, a typed briefing, persons of
  interest, and a next-case teaser that only appears once you've earned it.
- **Investigation workspace** — evidence tray and viewer (zoom, rotate, compare, private notes),
  leads, flagged conflicts, a corkboard with typed threads, a timeline, a city map with travel
  times, suspect files, and an interview room where presenting the right record breaks a story.
- **Theories → verdict → proof** — build theories from "what would have to be true", then answer
  who / how / when / where / why and attach at least two records to each proof slot.
- **Scoring and resolution** — deduction, proof, board logic, evidence, contradictions,
  efficiency and time; ranks S–D; commendations; a comic-panel reconstruction of what really
  happened and an explanation of every contradiction and red herring.
- **Team rooms (1–4 players)** — invite link or room code, roles that each start with records
  nobody else holds, private leads, sharing, team chat with `#012` record references and
  `@mentions`, reactions and pins, a shared board and a shared verdict sheet.
- **ORACLE** — a built-in records assistant that only knows what you've found. It follows people
  through the night, checks travel times against windows, finds silences in the timeline, compares
  records and points at what disagrees; it never says who did it. No API key needed.
- **Accounts** — email + password, Google, GitHub, or play as a guest and register later
  without losing anything. A detective file with your record, history and commendations.
- **Atmosphere** — rain, film grain, synthesised paper/typewriter/shutter/stamp sounds and an
  optional rain loop; reduced-motion and sound settings saved per device.
- **Admin records office** — live stats, a case validator, publish/unpublish without a deploy,
  and a session inspector.

## Quick start

Requires Node.js 20.19+ (22 recommended).

```bash
npm install
npm run dev                 # http://localhost:3000
```

With no database configured, CASEFILE runs in **demo mode**: the full case is playable and
saves in the browser; accounts, team rooms, profiles and the admin area are switched off.

### With Postgres (everything on)

```bash
cp .env.example .env        # set DATABASE_URL
npm run db:migrate          # create the tables
npm run dev
```

### With Docker

```bash
docker compose up --build   # Postgres + migrations + app on http://localhost:3000
```

Put optional settings (`APP_URL`, `ADMIN_EMAILS`, OAuth keys) in a `.env`
file next to `docker-compose.yml` or export them in your shell.

## Configuration

Every variable is optional; see `.env.example`.

| Variable | What it does |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Turns on accounts, team rooms, profiles, admin. |
| `DIRECT_URL` | Non-pooled connection used only for migrations, when `DATABASE_URL` goes through a transaction pooler (Neon, Supabase). |
| `DATABASE_POOL_MAX` | Connections per server instance (default 5). Keep it small on serverless. |
| `APP_URL` | Public URL, no trailing slash. Used for OAuth callbacks, invite links, share cards and the sitemap. Recommended in production. |
| `ADMIN_EMAILS` | Comma-separated emails that get the admin area at `/admin`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in. Callback: `<APP_URL>/api/auth/oauth/google/callback` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub sign-in. Callback: `<APP_URL>/api/auth/oauth/github/callback` |
| `SKIP_MIGRATIONS` | `1` stops `npm run build` from running `prisma migrate deploy`. |

### ORACLE

ORACLE is built in and needs no API key or outside service. It reads only the records the
asking player has found, plus the public map and suspect files, and answers questions such as
*where was someone at 23:30*, *could they get from the garage to the hotel in time*, *what's
missing between 23:00 and midnight*, *compare #005 and #018*, *which records disagree* and
*what's filed as unverified*. It forgives typos in names and places, cites record numbers you
can open, suggests follow-up questions, and never names a culprit. Requests are rate limited
per player.

## Deploying

### Vercel + a hosted Postgres (Neon, Supabase, RDS…)

1. Create a Postgres database. Copy its **pooled** connection string into `DATABASE_URL` and,
   if your provider uses a transaction pooler, its **direct** string into `DIRECT_URL`.
2. Import the repository in Vercel (framework preset: Next.js; build command `npm run build`).
3. Set `APP_URL` to your production URL, plus any optional variables above.
4. Deploy. The build applies pending migrations before building.
5. For Google/GitHub sign-in, register the callback URLs shown above with each provider.

### Docker / any container host

```bash
docker build --build-arg APP_URL=https://casefile.example.com -t casefile .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://… -e APP_URL=https://casefile.example.com casefile
```

The image runs Next's standalone server as a non-root user and has a health check on
`/api/health`. Apply migrations before starting a new version — `docker compose` does this
with its one-off `migrate` service, or run `npx prisma migrate deploy` from the repository.

### Any Node host

```bash
npm ci
npm run build               # applies migrations when DATABASE_URL is set
npm start                   # PORT defaults to 3000
```

`GET /api/health` returns `{"ok":true,"database":"up"|"off","mode":"online"|"demo"}` — `503` if
the database is configured but unreachable.

## Development

```bash
npm run lint
npm run typecheck           # generates route types, then tsc
npm test                    # unit tests (Vitest)
npm run build && npm run test:e2e   # end-to-end (Playwright; needs DATABASE_URL)
npm run check               # lint + typecheck + unit tests
```

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck and unit tests; a production
build with end-to-end tests against Postgres (desktop and mobile); and a Docker image build.

### Where things are

| Path | What |
| --- | --- |
| `docs/PRD.md` | Product requirements |
| `docs/VISUAL-DIRECTION.md` | Art direction, palette, type, motion, reference board |
| `docs/ARCHITECTURE.md` | Layers, data boundary, sync, security |
| `docs/GAME-ENGINE.md` | How a case works (spoiler-free) |
| `data/cases/case-047/` | Case 047. `*.server.ts` files never reach the browser — they contain spoilers |
| `lib/game-engine/` | State reducer, interview engine, reveal rules, case validator |
| `lib/sessions/` | Server-authoritative sessions, rooms, sharing, chat, verdicts |
| `lib/scoring/` | Scoring and the post-verdict resolution |
| `components/` | UI grouped by feature; `illustrations/` holds the original SVG art |
| `prisma/` | Database schema and migrations |
| `tests/` | `unit/` (Vitest) and `e2e/` (Playwright) |

### Adding a case

Cases are content-as-code. Add a folder under `data/cases/`, register its public metadata in
`data/cases/index.ts` and its bundle in `lib/game-engine/cases.server.ts`, then run `npm test`:
the case validator checks every reference, that every record can be found through play, and
that a perfect investigation solves the case. The admin page shows the same report.
