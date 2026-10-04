# CASEFILE

> Every clue tells a story. Every story hides a lie.

A cinematic multiplayer detective deduction game for the browser. Players inspect evidence,
reconstruct timelines, challenge testimony and build a proof together.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Node 20.9+ required (Next.js 16).

## Where things are

| Path | What |
| --- | --- |
| `docs/PRD.md` | Product requirements |
| `docs/VISUAL-DIRECTION.md` | Art direction, palette, type, motion, reference board |
| `docs/ARCHITECTURE.md` | Layers, data boundary, state, security |
| `docs/GAME-ENGINE.md` | How a case works (spoiler-free) |
| `data/cases/case-047/` | Case 047 — *The Last Call*. `*.server.ts` files never reach the browser |
| `lib/game-engine/` | Engine types and the server-only rules (leads, conflicts) |
| `components/` | UI, grouped by feature; `illustrations/` holds the original SVG art |

## Status

- [x] Docs, design system, landing page
- [x] Case archive, cinematic case introduction and briefing
- [x] Investigation workspace — evidence tray and viewer (zoom, rotate, compare, notes),
      leads, conflicts, board with typed threads, timeline, map with travel times, people
- [x] Server-authoritative reveals: only the brief ships with the page; hidden records and
      the solution never reach the browser bundle
- [ ] Interrogation, theories ("what would have to be true?"), verdict, scoring, resolution
- [ ] Accounts (Supabase Auth), Postgres via Prisma
- [ ] Multiplayer rooms (Supabase Realtime), team chat, asymmetric roles

Progress is saved per device (localStorage) until accounts land.
