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
| **RadLab** — NASA OSDR radiation data (`visualization.osdr.nasa.gov/radlab`) | How fast the radiation badge fills during a storm. Fields: `absorbed_dose_rate` (μGy/hour), `dose_equivalent_rate` (μSv/hour). | It is real measured space-radiation data, so the badge is grounded in reality rather than invented. The current radiation constants are **placeholders marked UNVERIFIED** (the data page shows this) until the averages from `scripts/sample-radlab.ts` are copied into `src/data/constants.ts`. |
| **OSDR** | The "Real astronauts" fact shown at the end of a mission (team-authored, in `src/content/facts.json`/`results.json` with a study link). | Gives the child one true, human fact per mission from real space-biology research. |
| **Mars Trek** | The base-site map image (a credited NASA Mars image stands in). | A credited image is enough to place the imagined base on the real planet. |

**Truth rules.** Every number the simulation uses lives in `src/data/constants.ts` with a
`source` field (a URL or `"game estimate"`). Archived data is always labelled "archived" —
saved data is never shown as live. No NASA logo is used; data is credited as "Data from
NASA" with links on the **Our NASA data** page, which also lists the image credits and the
UNVERIFIED flag.

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

## Accessibility and audience

Text is written for a 7-year-old; science words are tappable for a one-line meaning; every
line can be read aloud by Bolt (browser speech synthesis, with a sound on/off switch); touch
targets are at least 48px and the game works on a phone held upright.

## Credits

Data from NASA (DONKI, OSDR/RadLab, Mars Trek). Mars imagery: NASA/JPL-Caltech (see the
in-app data page for per-image credits). No NASA logo is used, and the game is not an
official NASA product or forecast.
