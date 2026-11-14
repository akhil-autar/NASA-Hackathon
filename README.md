# Sol Watch (working title)

A browser game for children aged 7–12, built for the 2026 NASA Space Apps Challenge
("Build a Junior Astronaut Mission Trainer"). The child commands a Mars outpost and keeps
the crew safe. The storms are **real NASA space weather records** — the real Sun is the
opponent. The Mars outpost is imagined.

This repository is being built in phases. **Phase 1 (core loop)** is complete: the
simulation, the Power Triangle, one real hard-coded storm, the mission flow, Bolt's voice,
and tappable word meanings.

> Built with AI assistance (Kiro).

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run preview    # preview the production build
npm test           # run the fairness tests (Vitest)
```

Deploys on Vercel (framework preset: Vite; see `vercel.json`).

## What Phase 1 contains

- **Simulation** (`src/sim/`): pure, deterministic functions
  `(state, plan, storm, seed) -> newState`. All randomness uses a seeded generator. One
  game hour per tick; a mission is about 24 game hours.
- **Fairness tests** (`src/sim/fairness.test.ts`): prove that all-Shielding misses the
  science goal, all-Science loses a medium/strong storm, the middle dot loses a strong
  storm, and at least one sensible plan wins every storm.
- **The Power Triangle** (`src/components/PowerTriangle.tsx`): one dot shares power across
  Life Support, Shielding and Science in 10% steps totalling 100%; it is also the battery.
- **Mission flow** (`src/screens/MissionScreen.tsx`): Bolt's brief, the crew's three
  wishes, a one-tap guess, set-the-triangle-and-Go, time running with on-screen gauges, one
  mid-storm change, and result cards with stars.
- **Bolt's voice** (`src/speech/`): reads any line aloud via browser speech synthesis, with
  a sound on/off switch.
- **Word meanings** (`src/components/Word.tsx`): science words are tappable and show a
  one-line meaning.

## NASA data in Phase 1

- **DONKI** (NASA space weather database) — the one storm used in Phase 1 is a real
  recorded event: the **X9.3 solar flare of 6 September 2017** (DONKI activity id
  `2017-09-06T11:53:00-FLR-001`), which was followed by a severe geomagnetic storm at Earth
  (about Kp 8). Record: https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/13010/4
- Every number the simulation uses lives in `src/data/constants.ts` with a `source`.
  Radiation constants are marked `UNVERIFIED` until real RadLab readings are pulled in
  Phase 2.

No NASA logo is used. Data is credited as "Data from NASA" with links. A full dataset
README comes at the Finish phase.

## Privacy

No accounts, no login, no analytics, nothing sent to any server. Settings are stored only
in the browser's localStorage, wrapped in try/catch so the game still works if storage is
blocked.
