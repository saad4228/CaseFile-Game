# CASEFILE — Visual Direction

> *Imagine a graphic novel became an interactive operating system for detectives.*

The reference images in [`visual-references/`](./visual-references) are **mood and
art-direction references only.** We study their lighting, framing, colour relationships,
paper texture and graphic-novel feel. We never reproduce their characters, artwork,
compositions or logos. Every illustration in CASEFILE is original — in this first build,
hand-authored SVG and CSS (city skylines, silhouettes, rain, fog, paper, stamps) that can
later be swapped for commissioned or clearly licensed art.

---

## 1. Reference board

| # | File | What we take from it | Used for |
| --- | --- | --- | --- |
| 01 | `01-evidence-board.png` | Pinned photos, red thread converging on an unknown figure, warm desk lamp against a cold wall. | Investigation board, theory building, suspect relationships |
| 02 | `02-overhead-documents.webp` | Top-down figure in a vortex of glowing amber paper; paper as light source. | Evidence discovery, opening a case, document screens |
| 03 | `03-investigation-wall.png` | Dark office, a single shaft of window light across a wall of clippings; detective small in frame. | Case overview, archive mood, loading states |
| 04 | `04-noir-city.png` | Blue-gray painterly city, one cold street lamp halo, lone silhouette with drifting smoke. | Hero, transitions, "case closed" beats |
| 05 | `05-staircase-investigation.png` *(not yet in repo)* | Hard black-and-white ink, steep perspective down a stairwell, a single red accent (tie) and scattered pages. | Contradiction / danger moments; proof that one red note is enough |
| 06 | `06-rainy-detective.png` | Back-lit trench-coat silhouette under an industrial canopy, fog, wet-floor reflections, green-gray haze. | Case introduction, suspect silhouettes, rain + reflection layers |
| 07 | `07-occult-investigation.png` *(not yet in repo)* | Flashlight cone cutting a dark room, glyphs glowing red, debris on the floor. | Inspection view (light-as-focus), hidden-detail discovery |
| 08 | `08-rainy-street-comic.png` *(not yet in repo)* | Ligne-claire comic street at night: diagonal rain, one lit amber window, low worm's-eye angle. | Location illustrations, map vignettes |
| 09 | `09-manga-evidence.png` *(not yet in repo)* | Three stacked manga panels with screentone: object → hands → face. | Evidence close-ups, flashbacks, interrogation beats |
| 10 | `10-comic-scene.png` *(not yet in repo)* | Grayscale storyboard panels showing a sequence of small actions (alarm, door, bicycle). | Timeline reconstruction told as panels, case resolution |

> The five files marked *not yet in repo* were shared in chat but not saved to disk. Drop
> them into `docs/visual-references/` using the filenames above.

## 2. Colour

Mature, atmospheric, never rainbow. Colour is mostly *light* — warm amber where people look,
cold blue-gray everywhere else, crimson only where something is wrong.

| Token | Hex | Role |
| --- | --- | --- |
| `ink-950` | `#080A0D` | Page background, the night |
| `ink-900` | `#101419` | Raised surfaces, panels |
| `ink-800` | `#161B21` | Trays, drawers |
| `ink-700` | `#20262D` | Borders on dark, inactive controls |
| `paper-100` | `#D4C5A5` | Document and photo-mount surfaces |
| `paper-300` | `#BCA982` | Aged paper, folders |
| `paper-600` | `#81765F` | Paper shadows, faded type |
| `amber-500` | `#D98A3A` | Lamp light, primary action |
| `amber-300` | `#F0AE55` | Hover glow, highlights |
| `crimson-600` | `#9C2929` | Thread, contradictions, danger stamps |
| `steel-400` | `#718493` | Cold investigation accent, metadata |
| `bone-100` | `#E7E2D8` | Text on dark |

Rules:
- Body text on dark is `bone-100`; secondary text is `steel-400` (check ≥ 4.5:1 on its
  surface).
- Crimson never carries meaning alone — pair it with a label, icon or line style
  (accessibility, PRD §65).
- One warm light source per screen. If everything glows, nothing does.

## 3. Typography

| Role | Face | Where |
| --- | --- | --- |
| Editorial display | **Bodoni Moda** | `CASEFILE`, case titles, story beats, verdict |
| Interface / data | **IBM Plex Sans** | UI, labels, evidence descriptions |
| Records | **IBM Plex Mono** | IDs, timestamps, typed documents, logs |
| Handwriting | **Reenie Beanie** | Player notes, annotations, detective scrawl — *only* there |

- Display type goes huge and tight: the hero `CASEFILE` is viewport-scaled.
- Metadata labels are small, uppercase, wide-tracked Plex Mono (`EVIDENCE #014`, `SOURCE`).
- Handwriting never carries system information.

## 4. Surfaces and texture

- **Night** — `ink-950` with a faint film grain (SVG `feTurbulence`, ~4% opacity) and a soft
  vignette.
- **Paper** — `paper-100` with fibre noise, a slightly irregular edge (clip-path), a hard
  offset shadow plus a soft contact shadow, the occasional coffee ring.
- **Photographs** — white-bordered prints, slightly rotated, pinned (red map pin or tape).
- **Stamps** — rotated, double-ruled boxes with ink bleed: `CLASSIFIED`, `VERIFIED`,
  `DISPUTED`, `SOLVED`.
- **Thread** — crimson, slightly sagging curves between pins.
- Corners are square or barely rounded (≤ 2px). No glassmorphism, no rounded-card soup.

## 5. Illustration language (original)

- City silhouettes in 3–4 depth layers of blue-gray, scattered lit windows (amber, a few cold).
- Street lamp with a radial halo; rain falling through the halo catches the light.
- Detectives and suspects as strong silhouettes — hat, coat, collar — with rim light.
- Suspect portraits: inked bust silhouettes on photo stock with a case number; identity
  comes from shape, posture and one prop, not from faces.
- Comic panels for story beats: hard black gutters, caption boxes in `paper-100`, mono
  captions.

## 6. Motion

Deliberate and physical. Nothing bounces.

| Moment | Motion |
| --- | --- |
| Page enter | Fade up through fog; 600–900 ms ease-out |
| Case file opens | Cover rotates on its left edge, documents slide out with stagger |
| Evidence discovered | Paper slides in from off-table with a slight rotation settle |
| Thread connection | Path draws from A to B (`pathLength` 0 → 1) |
| Contradiction | Two-frame flicker + crimson marker |
| Verified | Stamp scales from 1.4 → 1 with a small rotation and ink bloom |
| Story text | Typewriter reveal, ~30 ms per character, skippable |
| Background | Rain (canvas), slow fog drift, lamp flicker every ~10 s |

`prefers-reduced-motion` turns rain off, removes parallax and replaces slides with fades.

## 7. Layout principles

- The workspace owns the screen: command bar on top, bottom tray, floating tools, drawers.
  No permanent sidebar.
- Information is *placed*, like objects on a table, not stacked in identical cards.
- Desktop first (1440+). Mobile is redesigned, not shrunk: tray becomes a bottom sheet,
  evidence opens full screen, timeline goes vertical.

## 8. Voice in the interface

| Instead of | Say |
| --- | --- |
| No evidence found | The board is quiet. Keep looking. |
| No suspects | No identities established. |
| No theory | You haven't formed a hypothesis yet. |
| Loading… | ACCESSING ARCHIVE… / RECOVERING RECORD… / DECRYPTING EVIDENCE… |
| Error | ARCHIVE CONNECTION LOST — Evidence synchronization failed. [ RETRY ] |

Never: "Important clue!", "Correct!", "This suspect is lying."
