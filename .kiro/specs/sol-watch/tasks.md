# Sol Watch — Tasks

Build one phase, test it, report, then wait for the go-ahead. Do not start the next phase
until the user says go.

## Phase 1 — Core loop
_Gate: fairness tests pass; solar-storm mission playable on one hard-coded real storm;
deployed to Vercel._

- [x] 1.1 Project setup: Vite + React + TypeScript, Vitest, Vercel config. `APP_NAME` in
  `src/config.ts`.
- [x] 1.2 `src/data/constants.ts` scaffold: every value as `{ value, unit?, source }`;
  radiation values marked `UNVERIFIED`.
- [x] 1.3 Sim core: `types.ts`, seeded `rng.ts`, `step.ts`, `mission.ts`, `score.ts`
  (pure, no UI, deterministic).
- [x] 1.4 One hard-coded real storm fixture (a real M/X flare; record its DONKI id/source).
- [x] 1.5 Fairness tests in Vitest (weak/medium/strong) per R3.4; tune constants until green.
- [x] 1.6 Content files for Phase 1: `bolt.json`, `crew.json`, `results.json`,
  `glossary.json` using only brief placeholders.
- [x] 1.7 `PowerTriangle` component: drag dot, 10% snap, totals 100%, battery drain/refill.
- [x] 1.8 Mission flow UI (steps 1–8 of R5) for the solar storm; result cards; one Real
  astronauts fact (placeholder).
- [x] 1.9 Bolt voice (speech synthesis) + sound on/off; tappable word meanings.
- [x] 1.10 Portrait layout, ≥48px targets; dark NASA look; placeholder Mars image.
- [x] 1.11 Deploy to Vercel. Report what works and how to try it. **STOP.**

## Phase 2 — The real Sun
- [x] 2.1 `scripts/build-storm-archive.ts` (first fetch one real FLR/SEP/GST response;
  adapt to real fields) → `src/data/storms.json`.
- [x] 2.2 `api/today.ts` serverless function: 7-day FLR/SEP/GST, ~1h cache, archived
  fallback.
- [x] 2.3 Today's Sun daily mission from live data (same storm per date; quiet-day message).
- [x] 2.4 Storm Time Machine: date picker; featured slots from `featured-storms.json`
  (placeholders); "What the real storm did" ending.
- [x] 2.5 Welcome screen (birthday scroll wheels, crew names, Skip, parent line).
- [x] 2.6 Birthday card (nearest-storm logic, pre-2010 rule).
- [x] 2.7 Dashboard.
- [x] 2.8 Our NASA data page (datasets, event id/link, disclaimers, credits, UNVERIFIED flag).
- [x] 2.9 `scripts/sample-radlab.ts`; copy real radiation averages into constants. Report. **STOP.**

## Phase 3 — Depth
- [x] 3.1 Rover run question type (trip-home vs. warning-time rule).
- [x] 3.2 Crew disagreement lines; one-tap guess; guess-vs-result compare.
- [x] 3.3 Rewind (jump to key choice, try other way, side-by-side).
- [x] 3.4 Stars, badges (reward new strategies), Commander's log.
- [x] 3.5 Dare cards (daily only): Dusty panels, Fuzzy forecast, Bolt asleep, Long haul.
- [x] 3.6 Late warning animation + real-range text.
- [x] 3.7 Greenhouse reaction to Life Support.
- [x] 3.8 "Show me the numbers" switch.
- [x] 3.9 Shareable result card. Report. **STOP.**

## Phase 4 — More missions and audiences
- [x] 4.1 Dust storm mission (dimmed panels over sols).
- [x] 4.2 Water wall + Water tanks question type.
- [x] 4.3 Call to Earth + Wait or act question type (build last).
- [x] 4.4 Parent page (from local log).
- [x] 4.5 Class mode (role args, Pause and discuss, Compare plans up to 4 teams).
- [x] 4.6 "What we simplified" page from `simplified.json`. Report. **STOP.**

## Finish
- [x] F.1 README: each NASA dataset + what it drives + why chosen; how to run; plain
  statement that the app was built with AI assistance (Kiro).
