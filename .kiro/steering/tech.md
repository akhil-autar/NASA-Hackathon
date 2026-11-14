---
inclusion: always
---

# Sol Watch — Engineering Rules

## Stack

- React, Vite, TypeScript. Deploy on Vercel.
- Ask before adding any library beyond React, Vite, TypeScript and Vitest.

## The simulation

- The simulation is a set of **pure functions** in `src/sim/` with **no UI code**.
- Signature shape: `(state, plan, storm, seed) -> newState`.
- It is **deterministic**. All randomness uses a **seeded** generator — never `Math.random()`
  inside the sim.
- The simulation advances **one game hour per tick**. A mission is about 24 game hours,
  played in about 3 minutes.

## Content and copy

- All on-screen text lives in JSON files in `src/content/` so the team can edit words
  without touching code.
- Use ONLY the placeholder text given in the brief. **Do not generate extra copy, story
  text, facts, or dialogue.** Leave team-authored slots as clearly marked placeholders.

## Data rules (see product.md for the full list)

- Every simulation number lives in `src/data/constants.ts` with a `source` field.
- Radiation constants that are not yet verified against real RadLab readings are marked
  `UNVERIFIED`, and that flag is shown on the data page.
- Live data is labelled "archived" whenever it comes from a saved file or fallback.

## Project layout (top level, inside the repo)

- `src/sim/` — pure deterministic simulation
- `src/data/constants.ts` — every NASA/game number, each with a `source`
- `src/data/storms.json` — build-time storm archive
- `src/content/*.json` — all on-screen text and team-authored slots
- `public/img/` — credited Mars imagery
- `scripts/` — build-time scripts (storm archive, RadLab sampler)
- `api/today.ts` — one serverless function for live data

## Working style

- Keep tasks small. Finish and test each phase before starting the next.
- After each phase, STOP and report what works and how to try it, then wait for go-ahead.
- Do not rewrite files that already work.
- If something in the brief is unclear, ask one short question before building it.

## Testing

- Fairness tests are required (Vitest). The simulation must satisfy them before Phase 1 is
  considered done. See the spec for the exact fairness conditions.
- Do not add tests beyond what is requested, except the required fairness tests.
- Use `vitest --run` (single run), never watch mode, in this environment.
