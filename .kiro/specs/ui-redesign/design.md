# UI Redesign — Design

How the redesign is built on top of the frozen game logic. The strategy: replace the
presentation layer (styles, layout, screens, components) while calling the exact same
simulation, storage, and content modules as today.

## Principle: a thin skin over a frozen core

```
   UNCHANGED (frozen)                 REPLACED / ADDED (this redesign)
 ┌───────────────────┐   state       ┌────────────────────────────────┐
 │ src/sim/ (pure)   │ ───────────▶  │ screens (re-laid-out)          │
 │ src/data/*.json   │               │ components (rebuilt visuals)   │
 │ src/content/*.json│               │ design tokens (one CSS file)   │
 │ src/storage/*     │               │ 3D scenes (src/scenes/, lazy)  │
 │ api/today.ts      │               │ motion + responsive layout     │
 └───────────────────┘               └────────────────────────────────┘
```

Screens keep their current props and the same calls into `sim`/`storage`/`content`. Only
their JSX and styling change. This satisfies C1 (logic frozen) and C2 (nothing lost): the
data flow is identical, so every existing feature keeps working.

## 1. Design tokens (`src/styles/tokens.css`)

- A single `:root` block with exactly the brief's section-4 variables. The existing
  `src/styles.css` is replaced by a tokens file plus a base stylesheet that consumes only
  tokens. No hard-coded colours/sizes in components.
- Font: Atkinson Hyperlegible Next loaded via a `<link>`/`@font-face` from a CDN or a local
  file in `public/fonts/`; `system-ui` fallback so text always renders. (Not an npm
  package, so C5 is satisfied.)
- A `prefers-reduced-motion` media query disables transitions/animations globally while
  keeping all content.

## 2. Layout system

- A responsive app shell: a top bar (name + text links on laptop/tablet, name + menu button
  on phone) and a main area. CSS Grid for the laptop two/three-column compositions, stacking
  to one column under 600px via container-driven breakpoints at 600 and 1024px.
- Each screen defines its own grid at the three widths. A shared `useBreakpoint` hook (or CSS
  only where possible) picks the composition. Equal page margins via `--margin-page`.
- A `Scene` slot component reserves the 3D area and renders a still fallback until/unless the
  canvas mounts, so layout is identical with 3D on or off.

## 3. Rebuilt components

- `Bolt` — SVG face: two eyes (blink on an interval), a mouth that animates while
  `speechSynthesis` is speaking (poll `speaking`/`onboundary`), and an `expression` prop
  (happy | thinking | worried | asleep). Respects reduced motion (no blink/mouth motion).
- `CrewPortrait` — round SVG portrait with a `mood` prop (calm | worried | cold) derived from
  game state (e.g. comfort low → cold, radiation high → worried).
- `PowerTriangle` — keep the existing barycentric math and 10% snapping (it is UI, not sim,
  and is not frozen, but its behaviour must not regress). Add: battery-style fill that drains
  with the live battery value, an accent dot with a spring follow (transform transition), and
  a small picture + label per corner.
- `Button` — a single component with `variant="primary" | "secondary"`, round ends, ≥48px,
  and hover/press/focus states. All screens use it, enforcing one accent button per screen by
  convention (only one `primary` per screen).
- `Word` — reposition the meaning into a small popover beside the word; close on Escape or
  outside-click.
- `Icon` — a tiny set of inline SVG line icons (sound on/off, settings, back, replay voice)
  in `--ink`. Replaces every emoji.

## 4. 3D scenes (`src/scenes/`, lazy-loaded)

- Libraries: `three`, `@react-three/fiber`, `@react-three/drei` (allowed).
- `Scene` wrapper: `React.lazy` + `Suspense`, with capability checks (WebGL available,
  `prefers-reduced-motion` off, not a known-slow device) deciding whether to mount the canvas
  or show the still fallback. A `description` prop renders visually-hidden text of the current
  state (R12.3).
- `SunScene` (A): textured sphere, slow rotation, subtle displacement; bloom via drei
  `EffectComposer` on the Sun only; an `activeRegion` prop brightens a spot when a storm is
  present.
- `OutpostScene` (B): ground plane with Mars texture, butterscotch sky colour, one
  directional light low on the horizon with soft shadows, filmic tone mapping. Meshes:
  habitat (window emissive = life-support share), greenhouse (plant scale/colour = life
  support), shelter (door open/lit = shielding; crew group walks to it when storm active),
  solar panels (indicator = battery; dusty when dust set), rover (position/speed = science and
  rover-run distance), particle stream when storm strength > 0.
- `MessageScene` (C): Earth and Mars spheres with a travelling light; the real delay text
  beside it.
- Asset loading: textures from `public/textures/`, models from `public/models/`; a missing
  asset falls back to a plain `meshStandardMaterial` colour. A small registry lists assets
  used, surfaced on the NASA data page (R9.5).
- Performance: `dpr={[1, 1.5]}`, `frameloop="demand"` or pause on `visibilitychange`,
  adaptive quality via drei `AdaptiveDpr`/`PerformanceMonitor` to drop detail if fps stays
  low.

## 5. Scene ↔ game-state binding

The mission screen already computes the per-hour trace and the live plan. The scene takes a
plain `sceneState` object derived from that (shares, battery, storm strength, dust, rover
distance, phase). Dragging the triangle updates `sceneState` immediately (R5.2); the storm
tick drives the camera cut (R5.3). No sim change — the scene reads the same values the meters
read.

## 6. Motion

- Entrance: a small `Reveal` wrapper staggers children 60–90ms, translate-up 16–32px + fade,
  150–400ms ease-out, transform/opacity only; disabled under reduced motion but content stays.
- Meters: CSS transitions on width/height so values ease, never jump (R11.7).
- Camera moves: animated in the R3F render loop (lerp), gated by reduced motion.

## 7. Screen-by-screen plan

- Dashboard: grid `55% | 45%` on laptop (Sun left, Bolt + Today's Sun + birthday + more
  missions right), full-width timeline row, full-width stars/badges row; stacked on phone.
- Mission: grid `crew | scene | triangle` with a bottom Bolt+Go bar on laptop; stacked with a
  fixed Go on phone.
- Result: three panels in a row (laptop) / swipeable stack (phone), each with a scene still.
- Text pages (Grown-ups, NASA data, What we simplified): a single readable column with a Mars
  photo header; the NASA data page also lists the 3D asset credits.

## 8. Task-group sequencing

Matches the brief's section 10. Groups 1–2 are pure CSS/React (no 3D) and already make the
product look finished; groups 3–5 layer the 3D scenes and motion with fallbacks so the game
stays playable throughout. Each group ends with screenshots at 1440/768/390, the section-11
checklist, and passing sim tests.

## 9. Risks and how they're handled

- **Regressing a feature (C2):** screens keep their props and data calls; only markup/style
  changes. A pre-redesign feature inventory is checked after each group.
- **3D breaking the page (C3):** the `Scene` wrapper never mounts a canvas without passing
  capability checks, and always has a still fallback.
- **Font not loading:** `system-ui` fallback in the token stack.
- **Scope/credits:** groups are ordered so stopping after group 2 or 3 still leaves a
  finished-looking, fully playable game.
