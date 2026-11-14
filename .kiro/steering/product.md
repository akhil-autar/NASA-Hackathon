---
inclusion: always
---

# Sol Watch — Product Rules

Sol Watch (working title) is a browser game for children aged 7 to 12, built for the
2026 NASA Space Apps Challenge ("Build a Junior Astronaut Mission Trainer"). The child
commands a small outpost on Mars and keeps the crew safe. Storms come from NASA's real
space weather records, so the real Sun is the opponent.

The game name lives in one config value `APP_NAME = "Sol Watch"` so it can be changed in
one place later.

## The one idea that matters most

The game teaches real trade-offs: **every choice helps one thing and costs another.**
A simple game that teaches a real constraint beats a pretty one that does not. When a
design decision is in tension, keep the trade-off visible to the child.

## Audience and language

- Write all on-screen text for a 7-year-old: short sentences, common words, no jargon.
- Any science word (radiation, dose, sol, flare, life support, shielding) is tappable and
  opens a one-line meaning.
- Every line of text can be read aloud by the robot guide, Bolt, using the browser's
  speech synthesis. Sound has an on/off switch.
- Touch targets are at least 48px. The game must work on a phone held upright.

## Gameplay

- No choice is free. There must never be a plan that is always safe and always wins.
- Failure is kind: nobody dies. The crew flies home early and Bolt suggests one thing to
  try next time.
- Keep what the child must track to the Power Triangle and its three corners
  (Life Support, Shielding, Science).

## Truth and data (non-negotiable)

- Never invent a NASA number. Every value used by the simulation lives in
  `src/data/constants.ts` with a `source` field (a URL) or `source: "game estimate"`.
- Never present saved data as live. Anything from a saved file is labelled "archived".
- Storms are real events recorded by NASA. The Mars outpost is imagined. Say this once,
  plainly, in the game.
- Do not use the NASA logo. Credit data as "Data from NASA" with links.

## Privacy

- No accounts, no login, no analytics, no data sent to any server.
- Birthday, crew names, progress and settings are stored only in the browser's
  localStorage. Wrap every read and write in try/catch so the game still works if storage
  is blocked.

## Look and feel

Realistic NASA style: dark background, real Mars imagery, a mission-control feel. On top
of that, the crew portraits and Bolt are large and expressive so a young child has
characters to care about. Real, free-to-use Mars images (NASA imagery) live in
`public/img/`, each credited on the data page.
