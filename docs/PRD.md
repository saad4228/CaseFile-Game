# CASEFILE — Product Requirements

> **Every clue tells a story. Every story hides a lie.**

CASEFILE is a cinematic multiplayer detective deduction game played in the browser.
Players inspect evidence, reconstruct timelines, compare contradictory sources, question
suspects, form hypotheses, challenge each other's theories, build a final proof and submit
a verdict — then learn whether their reasoning held.

It should feel like a graphic novel, a detective case file, a noir film, an interactive
evidence room and a multiplayer deduction game at the same time.

**Positioning:** a multiplayer deduction platform where players investigate interconnected
cases by analyzing evidence, reconstructing timelines, challenging testimony and building
proofs together. Not an "AI murder mystery website". AI is a feature. Deduction is the product.

**One-sentence visual identity:** *Imagine a graphic novel became an interactive operating
system for detectives.*

---

## 1. Product vision

CASEFILE answers one question: *can a group of players figure out what really happened when
nobody has the complete truth?*

| Rewarded | Not rewarded |
| --- | --- |
| observation, memory | clicking everything randomly |
| logical reasoning, deduction | guessing the murderer |
| evidence comparison | reading one obvious clue |
| timeline reconstruction | relying entirely on AI |
| communication, skepticism | a single multiple-choice question |

A finished case should leave players thinking *"we actually solved that"*, not *"the website
told us the answer."*

## 2. Core loop

```
ENTER CASE → READ BRIEF → INVESTIGATE → DISCOVER EVIDENCE → INSPECT EVIDENCE
→ COMPARE SOURCES → FIND CONTRADICTIONS → QUESTION SUSPECTS → RECONSTRUCT TIMELINE
→ BUILD THEORY → COLLABORATE → PROVE THEORY → SUBMIT VERDICT → CASE RESOLUTION
→ PERFORMANCE SCORE → NEXT CASE
```

## 3. Design philosophy — never tell the player what is important

Never display "Important clue!", "Correct clue!", "This suspect is lying!", "You should
investigate this." or "This evidence proves X."

Present the information side by side and let the player decide:

```
SARAH'S STATEMENT                HOTEL EXIT LOG
"I left the hotel at 11:20 PM."  11:43 PM

[ MARK CONTRADICTION ]  [ INVESTIGATE ]  [ IGNORE ]  [ ADD TO THEORY ]
```

## 4–6. Visual direction (summary)

Cinematic illustrated noir / graphic-novel detective aesthetic: hand-painted feel, slightly
exaggerated perspective, stylized characters, dramatic lighting, strong silhouettes, paper
texture, ink and brush detail, imperfect edges, deep charcoal backgrounds, muted blue-gray
environments, warm amber highlights, small amounts of crimson.

Full detail — palette, reference interpretation, typography, motion — lives in
[`VISUAL-DIRECTION.md`](./VISUAL-DIRECTION.md).

## 7–8. Landing page

Must read as **a game, not an enterprise app** — closer to a premium game site than a startup
landing page. Huge editorial typography.

1. **Hero** — rainy city, detective silhouette, subtle motion. `CASEFILE`, the tagline,
   `[ ENTER THE ARCHIVE ]`, `[ PLAY DEMO CASE ]`.
2. **The Case** — a fictional open case file (Case 047, The Last Call: status, victim,
   location, time, suspects, evidence counts).
3. **Investigate** — evidence floating across the screen.
4. **Connect** — clues forming relationships.
5. **Question** — the interrogation interface.
6. **Prove** — a theory being assembled.
7. **Solve** — the final verdict.
8. **CTA** — `YOUR FIRST CASE IS WAITING. [ START INVESTIGATION ]`

## 9–10. Authentication and detective profile

Google, GitHub and email/password. After login a player gets a **detective file**, not a
social profile: codename, rank, cases solved / failed, accuracy, average solve time,
deduction / evidence / logic scores, best score, specialty, investigation history,
achievements.

## 11. Case archive

The main selection screen. Cases look like physical classified files (case number, title,
classification, status, difficulty, players, estimated time) with subtle texture and motion.
Hovering opens a small dossier preview.

## 12. Case introduction

Never drop straight into the dashboard. A cinematic sequence:

```
NOVEMBER 14 · 11:47 PM · BLACKWOOD HOTEL · ROOM 314
DANIEL MERCER · 34 · INVESTIGATIVE JOURNALIST · FOUND DEAD
NO SIGN OF FORCED ENTRY. NO MURDER WEAPON. ONE FINAL CALL. 7 SECONDS. UNKNOWN NUMBER.
→ BEGIN INVESTIGATION
```

## 13–16. First case — CASE 047, THE LAST CALL

- **Victim:** Daniel Mercer, 34, investigative journalist, looking into corporate corruption
  and manipulated evidence in several old criminal cases. He had found something dangerous.
- **Scene:** Room 314, Blackwood Hotel. Apparent time of death 11:47 PM. Locked room, no forced
  entry, no weapon, phone missing. 47 seconds before the presumed time of death his phone
  called an unknown number for 7 seconds.
- **Objective (as shown to players):** *Determine what happened to Daniel Mercer between
  11:00 PM and midnight.* Never "find the murderer".
- **Suspects:**
  1. **Sarah Vale** — former partner. Claims no contact in months; phone records disagree.
     Met Daniel privately, received a USB, is protecting someone.
  2. **Marcus Reed** — Daniel's employer. Strong motive (financial irregularities), possibly
     credible alibi, a secret meeting.
  3. **Elena Cross** — hotel manager. Claims she never entered Room 314; access logs suggest
     otherwise. Can reach restricted areas, may have altered records.
  4. **Noah Grant** — closest friend. Claims he was out of town and his phone agrees, but his
     car was photographed near the hotel. Knows about "Case 019".
  5. **"J"** — unidentified. Appears repeatedly in Daniel's notes: *"J knows."*

The full case design (truth model, evidence map, deductions) is in
`data/cases/case-047/` — the solution file is server-only.

## 17–21. Evidence

**Categories:** CCTV, phone, messages, bank records, hotel records, photographs, audio,
documents, interviews, location data, forensic, news, digital records.

**Every item has:** ID, title, category, source, timestamp, location, reliability,
description, media, related suspects / locations / evidence.

**Reliability states:** VERIFIED (independently confirmed), LIKELY, UNVERIFIED, DISPUTED
(conflicts with another source), CORRUPTED (incomplete or damaged), FABRICATED (planted or
manipulated). Players do not always know the true state up front.

**Inspection view:** full screen; zoom, rotate, compare, annotate, pin, notes.

**Hidden details** are never highlighted: a moved object, a reflection, a clock, a shadow,
clothing, a plate, a document corner, a person in the background, an altered name, a wrong
timestamp, handwriting, a repeated phrase, inconsistent formatting.

## 22. Investigation board

The player's mental model, on an infinite canvas. Nodes: suspects, evidence, locations,
timeline events, theories, notes. Connections carry meaning and look distinct:
`SUPPORTS · CONTRADICTS · CAUSES · ASSOCIATED WITH · OCCURRED BEFORE · OCCURRED AFTER ·
DISPROVES · SUSPECTED`.

## 23–24. Theories and "What would have to be true?"

Players create hypotheses that list supporting evidence, what's missing and contradictions.
The game never says "Correct". It evaluates reasoning at the end.

**Signature mechanic:** when a theory is created the game asks *"If this is true, what else
would have to be true?"* and lists assumptions (access, knowledge of schedule, means,
presence, a timeline gap). Players investigate each assumption.

## 25. Contradictions

The server detects logical conflicts between records but only surfaces them as neutral
prompts — `CONFLICT #09 · Two records disagree. [ INVESTIGATE ]`. The player classifies it.

## 26. Timeline

Large and interactive: drag, move, inspect timestamps, group, find gaps, link evidence.
Unknown events appear as `?????` until the players work them out.

## 27. Location map

An illustrated fictional map — Blackwood Hotel, Mercury Bar, Mercer Office, Daniel's
Apartment, Parking Garage, River District, Archive Building — with distances and travel
times, so players can test alibis.

## 28–29. Interrogation and suspect personality

A cinematic two-person interface. Players pick questions and can *present evidence*
("You said you left at 11:30." `[ PRESENT CCTV #04 ]`); the answer changes with the evidence.

Suspects have hidden variables — truthfulness, fear, motive, knowledge, relationship,
secrets, confidence, alibi strength. They evade, redirect, give technically-true answers and
omit things. Nobody simply confesses.

## 30–35. Multiplayer

- Private rooms for 2–5 players with a short room code.
- **Asymmetric information:** roles start with different evidence — Detective (interviews),
  Analyst (financial), Forensics (physical), Cyber (phone / digital), Field Investigator
  (location / CCTV).
- **Private evidence** is visible only to its holder until they choose `[ SHARE WITH TEAM ]`.
- **Team chat:** messages, evidence previews (`[EVIDENCE #18]` links straight into the
  viewer), theory sharing, pins, mentions, reactions.
- Voice: architecture should allow it later; not in V1.
- **Secret objectives** (a hidden-agenda player): future, not MVP.

## 36–37. ORACLE, the assistant

ORACLE assists reasoning; it never solves. It only sees what the player or team has
legitimately discovered. The backend must make it impossible for the AI to reach the case
truth.

## 38–39. Case generation (phase 2)

Never let an LLM invent evidence freely. Pipeline:
`CASE TRUTH MODEL → TIMELINE → SUSPECTS → MOTIVES → EVENTS → EVIDENCE → DIALOGUE`.
The truth is deterministic; AI only writes presentation. A validation engine rejects
contradictions, impossible travel, missing evidence, invalid timelines and unprovable
conclusions.

## 40–43. Resolution and scoring

The verdict asks **WHO, HOW, WHEN, WHY, WHERE — and PROVE IT**, with evidence attached for
motive, opportunity, means, timeline and identity. Then the full sequence is revealed.

Score dimensions: **Deduction, Evidence, Logic, Contradictions, Efficiency, Proof, Time** →
final score out of 100 and a rank (S/A/B/C/D).

## 44–47. Long-term story

Season 1: 047 *The Last Call* (ends on "Who is J?") → 052 *The Missing Witness* → 061 *The
Black Archive* → 073 *The Innocent* → 089 *The Investigator*. Every case hides one tiny link
to another (a number, a symbol, an account, handwriting, a phrase, "J"). A persistent
archive (cases, people, locations, evidence, organizations, timeline, unsolved, classified)
grows as players discover things, eventually feeding a global conspiracy map.

## 48–50. UI structure and responsiveness

Primary nav: `ARCHIVE · CASES · INVESTIGATION · EVIDENCE · PEOPLE · TIMELINE · PROFILE`.

Active case layout: top bar (case + timer), a large workspace, a bottom tray (evidence /
timeline / suspects), team chat. **No big sidebar** — command bar, contextual controls,
floating tools, bottom tray, expandable drawers. The board gets the screen.

Desktop first (1440px+), also 1280 / 1024 / 768 / 390. On mobile the board pans, evidence
opens full screen, the timeline goes vertical, suspects swipe and chat is a bottom drawer.

## 51–55. Motion, transitions, micro-interactions, type, sound

Deliberate cinematic motion: paper sliding, pins, threads drawing, documents unfolding,
rain, fog, typewriter reveals. Opening a case: file → opens → documents appear → intro →
investigation. Micro-interactions: paper snap on discovery, thread animating A → B, red
flicker on contradiction, `VERIFIED` stamp, `SOLVED` stamp on close.

Type: an editorial display face for titles and story beats, a clean sans for data, a
handwritten face only for notes. Sound is optional and atmospheric (paper, typewriter,
shutter, rain, ambience) and can be disabled.

## 56–59. Technology and state

Next.js · TypeScript · React · Tailwind CSS · Framer Motion · React Flow · PostgreSQL ·
Prisma · Supabase Auth or Auth.js · Supabase Realtime · Supabase Storage / S3.

Models: User, DetectiveProfile, Case, CaseTruth, CasePlayer, GameSession, Evidence,
EvidenceRelationship, Suspect, Location, TimelineEvent, Theory, TheoryEvidence, Message,
Interview, CaseResult, Achievement.

A session tracks players, current phase, discovered / shared / private evidence, timeline
state, board state, theories, interview state, remaining time, verdict and score.

**The server is authoritative** for scoring, hidden evidence, case truth, the culprit,
timestamps and secret objectives. Reading the browser bundle must not reveal the culprit.

## 60–61. MVP scope

| In MVP | Not in MVP |
| --- | --- |
| auth, case archive, one complete case | AI case generation (phase 2) |
| private room, 2–4 players | AI interrogation (phase 2 / limited prototype) |
| evidence system and viewer | voice chat |
| investigation board, timeline | secret traitor mode |
| suspect profiles, team chat | multiple seasons |
| verdict, scoring, resolution | |

Case 047 is handcrafted: 5 suspects, 20–30 evidence items, 10+ timeline events, 5+
locations, 6+ contradictions, several red herrings, 3–5 key deductions, one real solution.

## 62–64. Case design rules

- Every major conclusion needs **at least two** supporting clues. Never "X did it because
  clue #17 says so".
- Red herrings must explain something real (e.g. a hidden affair that is not the motive but
  leads to a useful witness).
- No arbitrary puzzles ("enter 7362") unless they belong to the story.

## 65–67. Accessibility, security, performance

- Keyboard navigation, readable contrast, reduced-motion mode, captions, text alternatives,
  clear metadata; colour is never the only indicator.
- Authenticated rooms, server-authoritative gameplay, protected case data, rate limiting,
  sanitized chat, database policies, protected private evidence and admin tools.
- Responsive / lazy / compressed images, code splitting, cached case data; never load every
  case's assets up front.

## 68–71. AI layering, case generator, community cases, admin

```
CASE TRUTH ENGINE → GAME STATE → PLAYER ACTIONS → EVIDENCE / INTERROGATION → AI PRESENTATION
```

Not `LLM → entire game logic`. Later: an admin-driven generator with validation, community
cases, and an internal admin panel (create / edit / validate / preview / publish cases,
inspect sessions).

## 72–75. Demo, empty, loading and error states

- `[ PLAY DEMO CASE ]` on the landing page, with seeded demo data.
- Empty states stay in-world: *"The board is quiet. Keep looking."* · *"No identities
  established."* · *"You haven't formed a hypothesis yet."*
- Loading: `ACCESSING ARCHIVE…`, `RECOVERING RECORD…`, `DECRYPTING EVIDENCE…` — no spinners.
- Errors: `ARCHIVE CONNECTION LOST · Evidence synchronization failed. [ RETRY ]`.

## 76–77. Final UX principle

*You're investigating a case, not browsing a website.* Rain, a city, a file that opens,
photographs sliding onto the table, a reflection noticed under zoom, a contradiction, a
suspect whose story changes, a theory that holds — then *"You solved Case 047."*, the file
closes, and Case 052 appears with the same tiny symbol.

## 78–79. Development order

1. **Foundation** — Next.js, TypeScript, styling, database, auth, base layout, design system.
2. **Visual shell** — landing, archive, case cards, case intro, transitions, typography,
   backgrounds, illustrations.
3. **Single-player investigation** — evidence, viewer, suspects, timeline, board,
   relationships.
4. **Game logic** — theories, contradictions, verdict, scoring, resolution.
5. **Multiplayer** — rooms, presence, chat, shared board, asymmetric evidence.
6. **Polish** — animation, transitions, responsive layouts, sound, performance,
   accessibility.
7. **AI** — ORACLE, AI interrogation, case generator.

Work in small verified milestones: run it, look at it, test it, fix it, then continue. Never
leave the project broken. Keep game logic, case data and AI services separate from UI.

## 80–82. Quality bar and priorities

No generic Tailwind dashboards, glassmorphism, rounded-card soup, gradients, SaaS look,
component-library defaults, neon or bright backgrounds. Dark, cinematic, illustrated,
tactile, mysterious, premium, intelligent, original.

Priority when trading off: **fun / deduction → immersion → clarity → visual quality →
multiplayer → technical robustness → animation.** Beauty never at the cost of clarity.

## 83. Definition of done (MVP)

A user can create an account, enter the archive, select Case 047, create a room, invite
players, begin, inspect evidence / suspects / locations, manipulate the timeline, connect
evidence, create theories, chat in real time, share evidence, interrogate suspects, submit a
verdict, get a score and see the real solution and their performance — and it feels like a
complete game, not a CRUD prototype.
