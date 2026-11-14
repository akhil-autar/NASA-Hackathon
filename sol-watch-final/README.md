# Sol Watch (working title)

A browser game for children aged 7–12, built for the **2026 NASA Space Apps Challenge**
("Build a Junior Astronaut Mission Trainer"). The child commands a small outpost on Mars
and keeps the crew safe. The storms are **real NASA space-weather records** — so the real
Sun is the opponent. The Mars outpost is imagined.

The game teaches one real idea: **every choice costs something.** More power to one job
means less for another, and there is no plan that is always safe and always wins.

> Built with AI assistance (Kiro).

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run preview    # preview the production build
npm test           # run the fairness tests (Vitest)

# Build-time data scripts (Node 22+, no extra dependencies):
node --experimental-strip-types scripts/build-storm-archive.ts         # full 2010->today
node --experimental-strip-types scripts/build-storm-archive.ts --demo  # last ~2 years (fast)
node --experimental-strip-types scripts/sample-radlab.ts               # print real dose averages
```

Deploys on **Vercel** (framework preset: Vite; see `vercel.json`). For live "Today's Sun"
data, set a `NASA_API_KEY` environment variable in the Vercel project (free from
https://api.nasa.gov). Without it, the game runs on the archived storms, labelled
"archived".

## The NASA data, what it drives, and why

| Dataset | What it drives in the game | Why it was chosen |
| --- | --- | --- |
| **DONKI** — NASA space-weather database (`ccmc.gsfc.nasa.gov/DONKI`, `api.nasa.gov/DONKI`) | Every storm. Real solar flares become the missions; the flare class (M/X and the number after it) sets the storm's strength; the real flare→particle-event gap sets the warning time; the linked geomagnetic storm gives the real Kp score shown in "What the real storm did". | It is NASA's authoritative record of real solar events, with the exact fields the game needs (flare class, timing, linked SEP/GST). Using it means every storm the child faces actually happened. |
| **Curiosity RAD + NASA-STD-3001** — Mars surface dose (Hassler et al. 2014, *Science*, doi:10.1126/science.1244797) and NASA's crew radiation standard (OCHMO-TB-020) | The radiation badge. It counts real mSv: it fills at NASA's 250 mSv short-term limit for one solar particle event, and the everyday background is the real 0.64 mSv/day Curiosity measured on Mars. Storm dose and shield leakage are labelled game estimates. | Real measurements from the surface of Mars and NASA's own safety limit, so the badge means the same thing a real crew's dosimeter means. (`scripts/sample-radlab.ts` can still pull RadLab readings for comparison.) |
| **OSDR** | The "Real astronauts" fact shown at the end of a mission (team-authored, in `src/content/facts.json`/`results.json` with a study link). | Gives the child one true, human fact per mission from real space-biology research. |
| **Mars Trek** | The base-site map image (a credited NASA Mars image stands in). | A credited image is enough to place the imagined base on the real planet. |

**Truth rules.** Every number the simulation uses lives in `src/data/constants.ts` with a
`source` field (a URL or `"game estimate"`). Archived data is always labelled "archived" —
saved data is never shown as live. No NASA logo is used; data is credited as "Data from
NASA" with links on the **Our NASA data** page, which also lists the image credits and
where every radiation number comes from.

## How it is built

- **React + Vite + TypeScript**, deployed on Vercel. Tests with **Vitest**.
- **The simulation** (`src/sim/`) is a set of pure, deterministic functions
  `(state, plan, storm, seed) -> newState` with no UI code. All randomness uses a seeded
  generator. Time advances one game hour per tick; a mission is about 24 game hours.
- **Fairness tests** (`src/sim/fairness.test.ts`) prove the game is fair and real:
  all-Shielding misses the science goal on every storm, all-Science loses a medium/strong
  storm, the middle dot loses a strong storm, and at least one sensible plan wins every
  storm. The constants were tuned until these pass.
- **All on-screen text** lives in JSON files in `src/content/` so words can be edited
  without touching code.
- **The storm archive** is built at build time (`scripts/build-storm-archive.ts`) into
  `src/data/storms.json` (2,776 real M/X flares, 2010→today, ~44 KB gzipped, loaded as its
  own chunk). **Live data** comes from one serverless function (`api/today.ts`) with an
  archived fallback.
- **Privacy:** no accounts, login, analytics, or server storage. Birthday, crew names,
  progress and settings live only in the browser's localStorage, every read/write wrapped
  in try/catch so the game still works if storage is blocked.

## What's in the game

- **The Power Triangle** — one dot shares power across Life Support, Shielding and Science
  in 10% steps totalling 100%. It is also the battery: it drains with use and refills in
  daylight; empty means no corner gets anything.
- **Missions** — the Solar storm (Today's Sun + Time Machine, with the Rover run), the Dust
  storm (dimmed panels), the Water wall (Water tanks), and Call to Earth (Wait or act).
- **Mission flow** — Bolt's brief, the crew's three wishes, a one-tap guess, set-the-
  triangle-and-Go, time running with the greenhouse/shelter/rover reacting, the late-
  warning message travelling from Earth, one mid-storm change, result cards, stars, a new
  badge, the guess checked, and Rewind (try the other way, compare side by side).
- **Today's Sun** (same real storm for everyone on a date), the **Storm Time Machine** (any
  day since 2010, featured slots, and "What the real storm did"), the **birthday card**,
  **dare cards** (daily only, each adds a star), **"Show me the numbers"**, a **shareable
  result card**, **badges and the Commander's log**, a **parent page**, **class mode**, the
  **Our NASA data** page, and the **What we simplified** page.

## Playing from inside the base (new)

- **Your own astronaut** — a console-style creator (suit, visor, helmet extra, mission
  patch, name). Your astronaut stands at the command post in the 3D outpost; the camera
  stays over your shoulder while you play, with a blue shield bubble that grows with the
  Shielding share during a storm, and an in-scene HUD (radiation badge, battery).
- **Game over, with the real reason** — if the radiation badge passes NASA's 250 mSv limit
  or the base gets too cold, your astronaut is knocked down in the scene and a GAME OVER
  card names exactly what went wrong (too little shielding, rover caught outside, battery
  empty at night, life support too low) and what to try next.
- **Results that match your plan** — "What happened / Why / What it cost / Next time" are
  built from the real outcome (`src/sim/explain.ts`, tested in `explain.test.ts`), plus a
  real astronaut fact with its NASA source.
- **English / Bahasa Melayu** — switch any time from the top bar or Settings; Bolt's voice
  switches too (`src/i18n/`).
- **Famous real storms** one tap away under the Storm Time Machine (X9.3 of Sept 2017, the
  May 2024 aurora storm, the X9.0 of Oct 2024).
- Settings can change your birthday and your astronaut; the game name in the top bar goes
  back home.

## Made for ages 7-12 (new)

- **10 power cubes** instead of a hard-to-read triangle: three jobs (🌱 Air & warmth, 🛡️ Storm
  shelter, 🔬 Science), tap + / −, and each job says in plain words what will happen
  ("🥶 Too little! The crew will get cold."). The hints match the simulation. The triangle
  is still there as a harder option. One cube = 10%, so the simulation is unchanged.
- **How to play** in 4 pictures before the first mission (read aloud), and a ❓ button.
- **Bolt talks while you play**: day/night, "Brrr, the crew is getting cold", "Radiation is
  getting high", and at the big choice it says how big the storm is.
- **Faces and lines on the meters**: a face for each meter, a "too cold" line and the NASA
  radiation limit line.
- **Bolt's quick question**: one space question per mission in a calm moment (8 questions,
  EN/BM), with the answer explained, and a brain star on the results.
- **Class mode team battle**: 2-4 teams, a real NASA storm (medium/strong/giant), meet the
  crew and a 60-second team talk timer, each team places its cubes and predicts its stars,
  all missions race side by side, a podium that explains each result, a 5-question quiz
  round scored by the teacher, and a final scoreboard. Teacher notes included.

## Accessibility and audience

Text is written for a 7-year-old; science words are tappable for a one-line meaning; every
line can be read aloud by Bolt (browser speech synthesis, with a sound on/off switch); touch
targets are at least 48px and the game works on a phone held upright.

## Credits

Data from NASA (DONKI, OSDR/RadLab, Mars Trek). Mars imagery: NASA/JPL-Caltech (see the
in-app data page for per-image credits). No NASA logo is used, and the game is not an
official NASA product or forecast.
