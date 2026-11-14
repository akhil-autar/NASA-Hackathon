# Sol Watch — Design

This design maps the requirements onto a concrete structure. It favors a small, pure,
deterministic core with thin UI and data layers around it.

## Architecture at a glance

```
┌─────────────────────────────────────────────────────────┐
│ React UI (src/app, src/screens, src/components)          │
│  - reads copy from src/content/*.json                     │
│  - renders state; drives one tick per game hour           │
└───────────────┬───────────────────────────────────────────┘
                │ calls pure functions
┌───────────────▼───────────────────────────────────────────┐
│ Simulation core (src/sim) — pure, deterministic            │
│  step(state, plan, storm, seed) -> newState                │
│  uses only numbers from src/data/constants.ts              │
│  randomness via seeded RNG (src/sim/rng.ts)                │
└───────────────┬───────────────────────────────────────────┘
                │ reads
┌───────────────▼───────────────────────────────────────────┐
│ Data (src/data) + content (src/content)                    │
│  constants.ts (with source fields), storms.json            │
└───────────────────────────────────────────────────────────┘
        ▲                               ▲
        │ build time                    │ runtime (live)
   scripts/build-storm-archive.ts   api/today.ts (serverless)
```

## Simulation core (`src/sim/`)

- `types.ts` — `OutpostState`, `Plan` (the three 10%-step shares), `Storm`, `StepResult`,
  `MissionOutcome`.
- `rng.ts` — seeded PRNG (e.g. mulberry32/xorshift). Pure; given a seed, always the same
  sequence. No `Math.random()` anywhere in `src/sim/`.
- `step.ts` — `step(state, plan, storm, seed, hour) -> newState`. One game hour:
  1. battery: drain by consumption from the three corners, refill from solar (modified by
     dust/dare state).
  2. if battery empty, corners receive nothing this tick.
  3. life support: comfort rises/falls from the Life Support share; greenhouse tracks it.
  4. radiation: badge fills based on storm intensity vs. Shielding share (and whether crew
     is sheltered / rover is out).
  5. science: progress accrues from the Science share; mission goal met at a threshold.
- `mission.ts` — `runMission(initialState, plan(s), storm, seed)` advances 24 hours,
  applies the single mid-storm plan change if provided, and returns a `MissionOutcome`
  (stars, success flags, per-hour trace for the on-screen animation and rewind).
- `score.ts` — turns an outcome into stars per R4.2.

All constants referenced here come from `src/data/constants.ts`; the sim imports numbers,
never literals.

## Storm model

- `Storm`: `{ id, peakTime, class: "M"|"X", magnitude: number, warningMinutes: number,
  warningSource: "donki" | "game estimate", gst?: { kp: number }, sep?: {...} }`.
- Strength = base-by-class × magnitude (the number after M/X). Tuned via constants until
  fairness tests pass.

## Fairness tests (`src/sim/__tests__/fairness.test.ts`)

Three fixed storms (weak/medium/strong) and fixed seeds. Assertions per R3.4. These tests
are the acceptance gate for Phase 1; constants are tuned until green.

## Data layer

- `src/data/constants.ts` — every number as `{ value, unit?, source }`. Radiation values
  start `UNVERIFIED` until the RadLab sampler provides real averages.
- `src/data/storms.json` — produced by `scripts/build-storm-archive.ts`.
- `scripts/build-storm-archive.ts` — DONKI FLR 2010→today in yearly chunks, keep M/X, link
  SEP/GST, write compact JSON. Must first fetch one real FLR/SEP/GST response and adapt to
  real fields (R8.4).
- `scripts/sample-radlab.ts` — pull RadLab sample, print averages for the team.
- `api/today.ts` — serverless; last 7 days FLR/SEP/GST via `NASA_API_KEY`; ~1h cache;
  fallback to newest archived storm labelled "archived".

## Content layer (`src/content/`)

JSON files holding all copy, using only the brief's placeholders:
`bolt.json`, `crew.json`, `results.json`, `glossary.json` (word meanings),
`facts.json` (team-authored, placeholder), `featured-storms.json` (placeholder slots),
`storm-effects.json`, `simplified.json`, `missions.json`.

## UI layer

- `src/config.ts` — `APP_NAME = "Sol Watch"` (single source, R13.1).
- `src/app/` — app shell, routing, settings (sound on/off, "Show me the numbers").
- `src/screens/` — Welcome, Dashboard, Mission, Data, Parent, Class, Simplified.
- `src/components/` — `PowerTriangle`, `Bolt` (speech synthesis + word-meaning popovers),
  `ResultCards`, `RoverTrack`, `WaterTanks`, `WaitOrAct`, `ShareCard`, etc.
- `src/storage/` — localStorage wrapper; every read/write in try/catch (R7.2).
- `src/speech/` — thin wrapper over `window.speechSynthesis`, respects the sound toggle.

Accessibility: shared button/control styles enforce ≥48px targets; layout is
portrait-first.

## Phasing

The task list follows the brief's build order (Phases 1–4 + Finish). Each phase ends with a
stop-and-report. Phase 1's gate is the fairness tests passing and a working solar-storm
mission on one hard-coded real storm, deployed to Vercel.
