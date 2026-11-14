# Sol Watch — Requirements

A browser game for children aged 7–12 (2026 NASA Space Apps Challenge, "Build a Junior
Astronaut Mission Trainer"). The child commands a Mars outpost and keeps the crew safe.
Storms are real NASA space weather records.

## Glossary

- **Power Triangle** — the single core control. A dot inside a triangle shares power
  between three corners (Life Support, Shielding, Science). It is also the battery.
- **Sol** — one Mars day.
- **Storm** — a real recorded NASA event (solar flare, with optional linked particle event
  and geomagnetic storm).
- **Bolt** — the robot guide who speaks every line of text.

## Requirements

### R1 — Core simulation
- R1.1 The simulation is a set of pure functions `(state, plan, storm, seed) -> newState`
  in `src/sim/`, with no UI code.
- R1.2 The simulation is deterministic; all randomness uses a seeded generator.
- R1.3 Time advances one game hour per tick; a mission is ~24 game hours.
- R1.4 Every number the sim uses lives in `src/data/constants.ts` with a `source` field
  (URL or `"game estimate"`), and unverified radiation constants are marked `UNVERIFIED`.

### R2 — The Power Triangle
- R2.1 One triangle; the child drags a single dot to share power across three corners.
- R2.2 Shares snap to 10% steps and always total 100%.
- R2.3 The triangle is the battery: it drains as power is used and refills from solar
  panels. If it empties, all three corners get nothing.
- R2.4 Corner effects:
  - Life Support too low → crew cold/tired, greenhouse plants wilt.
  - Shielding too low → radiation badge fills faster during a storm.
  - Science too low → no discoveries, mission goal missed.

### R3 — Storms and fairness
- R3.1 Real flare class maps to storm strength: M = medium, X = strong, scaled by the
  number after the letter.
- R3.2 Warning time comes from the real flare→SEP gap when DONKI has one; otherwise a
  labelled game estimate.
- R3.3 Late warning: the message reaches Mars after a delay. The game states the real range
  ("a message takes between 3 and 22 minutes to reach Mars") and that the game shortens it.
- R3.4 **Fairness tests (required, Vitest)** over weak/medium/strong storms prove:
  - everything on Shielding loses (science goal missed),
  - everything on Science loses in a medium or strong storm,
  - the dot left in the middle loses in a strong storm,
  - at least one sensible plan wins on every storm.
  Constants are tuned until all pass.

### R4 — Winning and scoring
- R4.1 A mission succeeds when the crew is comfortable, the radiation badge is below its
  limit, and the science goal is met.
- R4.2 Stars: 1 = crew home safe; 2 = science goal also met; 3 = radiation badge also
  stayed low. Each active dare card adds one star.
- R4.3 Failure is kind: nobody dies; the crew flies home early and Bolt suggests one thing
  to try next time.

### R5 — Mission flow (same for every mission)
1. Bolt explains the problem in two sentences.
2. The three crew each say in one line what they want (one per corner).
3. The child makes a one-tap guess (Yes/No).
4. The child sets the Power Triangle and presses Go.
5. Time runs; crew faces, greenhouse, shelter and rover react on screen.
6. When the storm arrives, the child may change the triangle once.
7. Result cards: "What happened", "Why", "What it cost", then one "Real astronauts" fact.
8. Stars, any new badge, and the guess compared with the result.
9. Rewind: jump to the choice that mattered most, try the other way, compare side by side.

### R6 — Text, voice, and accessibility
- R6.1 All on-screen text is for a 7-year-old and lives in `src/content/*.json`.
- R6.2 Every science word is tappable and opens a one-line meaning.
- R6.3 Every line can be read aloud by Bolt via browser speech synthesis; sound has an
  on/off switch.
- R6.4 Touch targets ≥ 48px; works on a phone held upright.
- R6.5 Use only the placeholder copy in the brief; do not generate extra copy.

### R7 — Privacy and storage
- R7.1 No accounts, login, analytics, or server data.
- R7.2 Birthday, crew names, progress and settings live only in localStorage, every read
  and write wrapped in try/catch.

### R8 — Real data
- R8.1 Storm archive built at build time from DONKI (2010→today), M/X flares only, saved to
  `src/data/storms.json` (id, peak time, class, linked SEP, linked GST + Kp). Small enough
  to load fast on a phone.
- R8.2 One serverless function `api/today.ts` fetches last 7 days of FLR/SEP/GST from DONKI
  using `NASA_API_KEY`, caches ~1 hour; on failure falls back to the newest archived storm,
  labelled "archived".
- R8.3 A script samples RadLab readings and prints averages (`absorbed_dose_rate` uGy/hr,
  `dose_equivalent_rate` uSv/hr) for the team to copy into `constants.ts`.
- R8.4 Before coding against DONKI, fetch one real response for each of FLR/SEP/GST and
  adapt to the actual fields.
- R8.5 Data page lists every dataset, what it drives, and links; shows the event ID/link for
  the storm just played; includes "Real NASA research data, not an official forecast" and
  image credits. No NASA logo; credit as "Data from NASA".

### R9 — Screens
- R9.1 Welcome: Bolt greeting; three scroll wheels for a birthday (no typing, no future
  dates); name three crew (doctor, engineer, scientist) or accept defaults; Skip to
  dashboard; parent line "This stays on your device. We don't collect it."
- R9.2 Dashboard: Today's Sun, Storm Time Machine, birthday card, stars/badges, Commander's
  log, links to parent page, class mode, data page, settings.
- R9.3 Birthday card: finds the archived storm nearest the birthday and opens it as a Time
  Machine mission; explains when the nearest storm is on another day; for birthdays before
  2010 uses the same day in 2010 and explains NASA's diary starts then.
- R9.4 Today's Sun: built from the strongest real event in live data; same storm for all
  players on a date; if quiet, show the most recent real storm and how long ago. Dare cards
  can be switched on here.
- R9.5 Storm Time Machine: play any archived storm by date; three featured slots read from
  `src/content/featured-storms.json` (placeholders); played exactly as recorded, no dare
  cards; ends with "What the real storm did" (real GST score if present, one general line
  from `storm-effects.json`, and for featured storms the team's hand-written story).

### R10 — Missions and question types
- R10.1 Solar storm (Today's Sun + Time Machine): Power Triangle plus Rover run.
- R10.2 Dust storm: dust dims panels for several sols; Power Triangle only.
- R10.3 Water wall: uses Water tanks.
- R10.4 Call to Earth (build last): uses Wait or act.
- R10.5 Rover run: drag the rover along a track before the storm; farther = more science and
  a longer trip home; if the trip home is longer than the real warning time, the crew is
  caught outside and the badge fills.
- R10.6 Water tanks: drag six tanks into drinking / air-maker / shield wall; each tank does
  one job only.
- R10.7 Wait or act: a leak starts; hold to wait for Earth's answer while the air bar
  drains, or let go to fix now on a guess.

### R11 — Depth features
- R11.1 Dare cards (daily mission only; each adds one star): Dusty panels (less solar),
  Fuzzy forecast (warning may be wrong, seeded), Bolt is asleep (no hints), Long haul
  (leftovers carry into a second day).
- R11.2 "Show me the numbers": settings switch that replaces pictures with real values and
  units (battery %, hours left, radiation in mSv, flare class and time).
- R11.3 Shareable result card: browser-made image with the storm date, stars, and app name;
  share-sheet or download; no personal details.
- R11.4 Badges reward trying a new strategy, not only winning. Commander's log is a short
  diary written from the child's own choices.

### R12 — Audiences
- R12.1 Parent page: what the child played, the trade-off each mission taught, two questions
  to ask afterward; built from the local log.
- R12.2 Class mode: teacher picks one storm for the room; three roles argue for a corner;
  "Pause and discuss" freezes at the decision with one question; "Compare plans" runs up to
  four teams' triangle settings side by side.
- R12.3 "What we simplified" page: reads from `src/content/simplified.json` (time sped up;
  Earth storms imagined reaching Mars; message delay shortened; shelter power is a game
  estimate).

### R13 — Config and finish
- R13.1 `APP_NAME = "Sol Watch"` is the single source of the game name.
- R13.2 README lists each NASA dataset, what it drives and why chosen, how to run the
  project, and a plain statement that the app was built with AI assistance (Kiro).
