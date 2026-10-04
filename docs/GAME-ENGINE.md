# CASEFILE — Game Engine

Spoiler-free description of how a case works. The solution for Case 047 lives only in
`data/cases/case-047/truth.server.ts`.

## 1. A case is a truth plus its traces

```
CASE TRUTH  →  EVENTS  →  TRACES (evidence)  →  WHAT PLAYERS CAN DISCOVER
```

The truth is a small deterministic model — culprit, method, motive, window, location, and a
true sequence of events. Every evidence item is a *trace* left by one of those events, or by
a red herring that explains something real. Nothing in the evidence set may contradict the
truth except testimony and records the truth says were falsified.

## 2. Evidence

```ts
Evidence {
  id: "E-014", number: 14, title, category, source,
  time?: "23:43", location?: LocationId,
  reliability: "VERIFIED" | "LIKELY" | "UNVERIFIED" | "DISPUTED" | "CORRUPTED" | "FABRICATED",
  summary, body,                    // body is a typed document: log | statement | photo | ...
  suspects[], locations[], related[]
}
```

`reliability` is the reliability **as filed** by the source. A forged record is filed as
`LIKELY`; only the truth file knows it is `FABRICATED`. Players learn that by comparison.

The UI never marks an item as important. Photo and document bodies list what is in frame or
on the page with equal weight; the detail that matters sits among ordinary detail.

## 3. Discovery — leads

Players start with a **case brief** (the evidence a police file would contain). The rest is
behind **leads**: investigative actions such as *request garage footage* or *trace a number*.

```ts
Lead { id, label, requires: EvidenceId[] (all), unlocks: EvidenceId[] }   // server-only
```

A lead appears once everything it requires has been discovered. Following it reveals its
unlocks. The client only ever sees available lead labels, never what they unlock.

## 4. Conflicts

```ts
Conflict { id, a: EvidenceId, b: EvidenceId, prompt }                     // server-only
```

When both sides of a conflict are discovered the server surfaces a neutral prompt —
*"Two records disagree."* The player classifies it: **contradiction**, **explained**, or
**ignore**. The truth file knows which conflicts are genuine lies or falsifications; scoring
compares.

## 5. Board

Nodes: suspect, evidence, location, event, theory, note. Edges are typed:
`SUPPORTS · CONTRADICTS · CAUSES · ASSOCIATED_WITH · OCCURRED_BEFORE · OCCURRED_AFTER ·
DISPROVES · SUSPECTED`. Edge types are visually distinct (colour **and** dash pattern
**and** label).

## 6. Timeline

Discovered evidence with a timestamp can be placed on the timeline. Players can also add
`?????` placeholders for events they believe happened but cannot yet place.

## 7. Theories — "What would have to be true?"

A theory names a suspect (or no one) and a claim. The engine returns the assumptions that
claim requires — *access, presence, means, knowledge, a timeline gap* — and the player
attaches evidence to each, or marks it unresolved.

## 8. Verdict and scoring

The verdict answers WHO / HOW / WHEN / WHERE / WHY and attaches evidence to **motive,
opportunity, means, timeline, identity**. The server scores:

| Dimension | Measures |
| --- | --- |
| Deduction | WHO / HOW / WHEN / WHERE / WHY correct |
| Evidence | share of key evidence discovered |
| Logic | board edges consistent with the truth |
| Contradictions | genuine conflicts classified as contradictions |
| Efficiency | leads followed that mattered vs. total |
| Proof | each proof slot backed by accepted evidence (≥ 2 traces for a conclusion) |
| Time | solve time against the case estimate |

Weights: deduction 30%, proof 20%, logic 15%, evidence 10%, contradictions 10%,
efficiency 7.5%, time 7.5%. Final = weighted sum → rank S / A / B / C / D. A case counts as
**solved** when WHO and HOW are right and at least three proof slots hold.

## 9. Case design rules

- Every key conclusion is supported by at least two independent traces.
- Every red herring explains something real and leads somewhere.
- Every alibi can be tested with the map's travel times.
- No arbitrary puzzles.
- Each case carries one quiet link to another case.

The structural rules are enforced by the case validator (`lib/game-engine/validate.server.ts`),
which runs in the unit tests and on the admin page: every reference resolves, every record is
reachable through play, each proof slot can be filled from findable records, a perfect
investigation solves the case, and a wrong culprit does not.
