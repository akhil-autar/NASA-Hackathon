# UI Redesign — Final pass (task 5.5)

The section-11 checklist (requirements R13.2) run against the branch
`ui-redesign-g3-3d` after groups 3–5 and the group-5 build tasks. Items that
need a running browser on real hardware are marked **team** — those are the
real-device verification being done on the Vercel preview.

## Build / page weight (from `npm run build`, gzip)

| Chunk | Raw | Gzip | When it loads |
|---|---|---|---|
| `index.html` | 0.55 kB | 0.33 kB | first |
| app CSS | 27.79 kB | 5.80 kB | first |
| app JS (`index`) | 210.34 kB | 67.61 kB | first |
| `storm-archive` | 421.00 kB | 43.91 kB | when the archive is read |
| three.js vendor (`util`) | 821.92 kB | 221.74 kB | **only when a 3D scene mounts** |
| `OutpostCanvas` | 24.23 kB | 7.92 kB | mission scene |
| `SunCanvas` | 8.43 kB | 3.23 kB | dashboard Sun |
| `MessageCanvas` | 4.87 kB | 2.06 kB | late warning / wait-or-act |

Initial download (HTML + CSS + app JS) is about **74 kB gzip**. The three.js
bundle (~222 kB gzip) is code-split and fetched lazily on first scene mount, so
a device with 3D off never downloads it. Mission-screen frame rate on a laptop
and a mid-range phone: **team** (R10.3 target 60 / 30 fps; `AdaptiveQuality`
lowers dpr automatically if the rate stays low).

## Checklist

- [x] **No emoji in the UI** (R2.1). No emoji in any rendered component. The
  only star glyphs (`★`/`☆`) are U+2605/U+2606 geometric symbols rendered flat
  in `--accent` (Stars) or drawn onto the off-screen share-image canvas
  (ShareCard); neither is a colour emoji. Flagging for a human eye, but these
  predate the 3D work and passed the group-1/2 checklist.
- [x] **Nothing from the "Do not" list** (R2.2). No CSS gradients, blur/glass,
  neon, resting shadows, scan lines, crosshairs, corner brackets or monospace
  in `styles.css` / `styles/`. The one gradient is on the share-image canvas
  (not the page); the only glow is the Sun bloom, which is allowed.
- [x] **One accent button per screen** (R2.3). Verified per screen; Mission has
  several `variant="primary"` buttons but they are in mutually exclusive phase
  branches, so exactly one renders at a time. ShareCard is `btn-secondary`.
- [x] **Playable with 3D off** (C3). `useCan3D()` returns false when WebGL is
  missing, the player turns off the Settings "3D graphics" switch, or the device
  prefers reduced motion; `SceneFrame` then shows the NASA still underneath, and
  a `SceneBoundary` catches any canvas error. Every scene screen keeps working.
- [x] **Keyboard alone** (R12.2, R5.6, R11.1). PowerTriangle is a focusable
  `role="slider"` with arrow-key handling and `aria-valuetext`; controls are
  real `<button>`s with accessible names; sliders have `aria-label`s.
- [x] **3D canvas has a state description** (R12.3). `SceneFrame` renders a
  visually-hidden `role="status"` sentence built from the same game state the
  scene draws (`OutpostView.describe`, Sun/message descriptions).
- [x] **Loading / error / offline states incl. the archived-storm message**
  (R12.1). Dashboard and Today show "NASA's data could not be reached. Showing
  an archived storm." when the live request fails (task 5.4).
- [x] **Alt text on all images** (R12.4). Every `<img>` has an `alt`.
- [x] **Reduced motion keeps all content, removes movement** (R11.8). Global
  `prefers-reduced-motion` rule in `base.css`; 3D is not mounted at all under
  reduced motion, so the still is shown.
- [x] **All sim tests pass** (C1). `npm test` 4/4; `npm run typecheck` and
  `npm run build` clean.
- [ ] **No sideways scroll / clipped text / >2-line heading / empty half at
  1440, 768, 390** (R3.2–R3.4). **team** — needs the browser at each width.
- [ ] **A stranger understands each screen in five seconds** (R13.2). **team.**
- [ ] **Screenshots at 1440 / 768 / 390, reviewed and fixed** (R13.1). **team.**
- [ ] **Text contrast ≥ 4.5:1** (R12.4). **team** — spot-check on the preview;
  tokens were chosen for contrast but should be confirmed on real text.

## Notes for the preview review

- The three.js chunk is the one weight worth watching; it is deferred, so the
  dashboard's first paint does not pay for it until the Sun scene mounts.
- If mission fps is low on a phone, `AdaptiveQuality` should drop dpr toward
  0.75; confirm it recovers when the scene calms.
