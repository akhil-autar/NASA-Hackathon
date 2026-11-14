# UI Redesign — Tasks

Build one task group at a time. After each group: take screenshots at 1440/768/390, run the
section-11 checklist, confirm all sim tests pass, then STOP and report (page weight +
mission-screen frame rate from group 3 on). Do not start the next group until approved.

Frozen (never edit): `src/sim/`, `scripts/`, `src/content/*.json`. All sim tests must pass at
the end of every group.

## Group 1 — Foundations
_Done when: every screen uses the tokens; no emoji remain._
- [ ] 1.1 `src/styles/tokens.css` with exactly the brief's section-4 variables; load the
  Atkinson Hyperlegible Next font with a system-ui fallback.
- [ ] 1.2 Replace base styles so components consume only tokens (no hard-coded colours/sizes);
  add the global `prefers-reduced-motion` rule.
- [ ] 1.3 `Button` component (primary/secondary, round, ≥48px, hover/press/focus).
- [ ] 1.4 Top bar (name + text links on laptop/tablet; name + menu on phone).
- [ ] 1.5 `Icon` set (inline SVG line icons in `--ink`) and remove every emoji from the UI.
- [ ] 1.6 Rebuild `Bolt` as an SVG face (blink, mouth-while-speaking, 4 expressions).
- [ ] 1.7 Screenshots 1440/768/390; checklist; sim tests; report. **STOP.**

## Group 2 — Layouts
_Done when: screenshots at 1440/768/390 match section 5._
- [ ] 2.1 Dashboard layout at all three widths (Sun slot as still image for now; Today's Sun
  primary button; text links; labelled badges; timeline + stars rows).
- [ ] 2.2 Mission layout at all three widths (crew column, scene slot still, triangle+meters,
  bottom Bolt+Go bar; fixed Go on phone).
- [ ] 2.3 Result layout (three panels on laptop, swipeable stack on phone) with still images.
- [ ] 2.4 Text pages (Grown-ups, NASA data, What we simplified) as a 60–70ch column with a
  Mars photo header.
- [ ] 2.5 Rebuild `CrewPortrait` (round, 3 mood states) and `PowerTriangle` visuals (battery
  fill, spring dot, corner pictures+labels); `Word` popover.
- [ ] 2.6 Screenshots 1440/768/390; checklist; sim tests; report. **STOP.**

## Group 3 — Mars outpost (Scene B)
_Done when: dragging the triangle changes the scene live; game plays with 3D off._
- [ ] 3.1 Add `three`, `@react-three/fiber`, `@react-three/drei`; `Scene` lazy wrapper with
  capability checks and still fallback; visually-hidden scene description.
- [ ] 3.2 `OutpostScene` geometry (habitat, greenhouse, shelter, panels, rover, Sun) with Mars
  ground, butterscotch sky, low sun, soft shadows, filmic tone mapping; asset loading with
  coloured-material fallback.
- [ ] 3.3 Bind scene to game state (life support, shielding, science, battery, dust, storm)
  and to the live triangle before Go.
- [ ] 3.4 Performance: dpr cap 1.5, pause when hidden, adaptive quality.
- [ ] 3.5 Screenshots + checklist + sim tests + page weight + mission fps; report. **STOP.**

## Group 4 — Sun and timeline (Scenes A, C)
_Done when: timeline drag updates the Sun; fallback works._
- [ ] 4.1 `SunScene` (textured sphere, rotation, Sun-only bloom, active region on storm).
- [ ] 4.2 Time Machine timeline control bound to the archive; drag updates Sun + one-line
  summary.
- [ ] 4.3 `MessageScene` (Earth↔Mars travelling light + real delay) for late warning and
  Wait-or-act.
- [ ] 4.4 Sun-to-Mars camera move when a mission starts.
- [ ] 4.5 Screenshots + checklist + sim tests + fps; report. **STOP.**

## Group 5 — Motion and polish
_Done when: the section-11 checklist passes._
- [ ] 5.1 `Reveal` staggered entrances; meter easing; camera moves (push-in, storm cut, wide
  result) — all gated by reduced motion.
- [ ] 5.2 Control hover/press/focus feedback everywhere.
- [ ] 5.3 In-scene interactions: rover-run drag with trip-vs-warning line; water tanks drag &
  empty; wait-or-act hold.
- [ ] 5.4 Loading / error / offline states for each screen (incl. archived-storm message).
- [ ] 5.5 Final pass: screenshots, full checklist, performance numbers; report. **STOP.**

_If time or credits run short, stop after group 2 or 3 — the game must look finished at the
end of every group._
