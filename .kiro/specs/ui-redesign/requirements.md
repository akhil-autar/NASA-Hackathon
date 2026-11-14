# UI Redesign — Requirements

A visual redesign of Sol Watch. The game logic is finished and must not change; this is a
new skin, a proper responsive layout, real 3D scenes that show game state, and motion. The
goal: a game that looks and feels like a real place, laid out for a laptop and for a phone,
understandable by a 7-year-old in five seconds and convincing to a hackathon judge.

## Hard constraints (cannot be broken)

### C1 — Game logic is frozen
- Do not edit `src/sim/`, the data scripts (`scripts/`), or the content JSON files in
  `src/content/`. Reading them is fine; changing them is not.
- All existing tests (the Vitest fairness tests) pass at the end of every task group.

### C2 — Nothing is lost
- Every feature that works today still works after the redesign. If a change would remove
  a working feature, stop and ask.

### C3 — Playable without 3D
- If WebGL is missing, the device is slow, or the user prefers reduced motion, show still
  images instead of the 3D scenes. A broken canvas must never appear.

### C4 — Every visual shows game state
- No decoration for its own sake. If something moves or lights up, it is because the game
  state changed.

### C5 — Ask before adding libraries
- Allowed without asking: `three`, `@react-three/fiber`, `@react-three/drei`. Anything else
  needs approval. (The font is loaded from a stylesheet/asset, not an npm package.)

## Requirements

### R1 — Design system (single source)
- R1.1 One file holds the design tokens (colours, type scale, radius, space, margins) from
  the brief's section 4, and the whole UI uses only those values.
- R1.2 Colour: one ground, one surface step, one ink, one accent (`--accent #FFAE1A`), plus
  the three corner colours and one danger colour. No purple/violet/indigo anywhere.
- R1.3 Type: one family (Atkinson Hyperlegible Next, system-ui fallback), four sizes;
  nothing smaller than `--size-small` (1rem).
- R1.4 Panels separate from the background by the tone step (`--ground` → `--surface`), not
  by lines. Groups separated by space, not rules.

### R2 — No forbidden visuals
- R2.1 No emoji anywhere in the interface. Small icons are inline SVG line icons in `--ink`;
  no icon library.
- R2.2 None of: gradients (except the allowed Sun bloom), glows, neon outlines, resting drop
  shadows, glass/blur panels, grid overlays, scan lines, crosshairs, corner brackets, other
  cockpit decoration, monospace type, tiny uppercase letter-spaced labels, or rows of
  identical icon tiles.
- R2.3 Exactly one accent-coloured button per screen, and it is the largest/primary control.

### R3 — Responsive layout
- R3.1 Three compositions: laptop (≥1024px), tablet (600–1023px), phone (<600px).
- R3.2 No sideways scrolling at 1440, 768 or 390px wide.
- R3.3 Equal outer margins on both sides; no empty half of the screen on a laptop.
- R3.4 Headings in sentence case, left-aligned, at most two lines.

### R4 — Dashboard (section 5.1)
- R4.1 Laptop: the 3D Sun fills the left ~55% of the width; the first screen is fully used.
- R4.2 "Start today's mission" is the only accent button and the largest control.
- R4.3 When today's data shows a storm, the Sun shows a bright active region and the Today's
  Sun text states the strength in plain words.
- R4.4 Dragging the Time Machine timeline updates the Sun and a one-line storm summary to
  the storm under the pointer.
- R4.5 Pressing "Start today's mission" pulls the camera back from the Sun and travels to
  Mars as the mission opens.
- R4.6 Grown-ups, Class mode, NASA data, Settings are plain text links in the top bar, not
  tiles.
- R4.7 The badges row is labelled "Badges" and each badge shows its name.
- R4.8 Phone: top bar (name + menu), 3D Sun at ~45% of screen height, then Bolt's line,
  Today's Sun + button, birthday card, More missions, timeline, and stars row stacked.

### R5 — Mission screen (section 5.2)
- R5.1 Laptop: one screen, no scrolling: crew column, central 3D Mars outpost, Power
  Triangle + meters column, Bolt + Go along the bottom.
- R5.2 Dragging the triangle dot changes the three meters and the 3D scene at the same
  moment, before Go.
- R5.3 When the storm arrives, the camera cuts to the shelter and particles stream in from
  the Sun's direction.
- R5.4 Tapping/hovering a crew portrait replays that member's line and points the camera at
  their part of the outpost.
- R5.5 The Go button is the only accent control.
- R5.6 Arrow keys move the triangle dot; Enter presses Go.
- R5.7 Phone: 3D scene top ~40%, crew faces along its lower edge, Bolt's line, the triangle
  in the lower half within thumb reach, Go fixed at the bottom.

### R6 — Result screen (section 5.3)
- R6.1 "What happened", "Why", "What it cost" are three side-by-side panels on laptop and a
  swipeable stack on phone.
- R6.2 Each shows a still from the 3D scene at that moment (or a fallback still).
- R6.3 Stars, the guess result, Rewind and "Play again" follow beneath.

### R7 — Text pages (section 5.4)
- R7.1 Grown-ups, NASA data, What we simplified: one column 60–70 characters wide, with a
  real Mars photograph across the top and its credit beneath.

### R8 — Rebuilt components (section 6)
- R8.1 Bolt: an SVG robot face with eyes and a mouth; eyes blink; mouth moves while
  speaking; expressions happy, thinking, worried, asleep (for the "Bolt is asleep" dare).
- R8.2 Crew portraits: large round portraits with three face states (calm, worried,
  cold/tired) that change with game state.
- R8.3 Power Triangle: filled like a battery that drains; accent dot follows the pointer
  with a slight spring and snaps to 10% steps; each corner has a small picture and a label.
- R8.4 Buttons: one primary (accent fill) and one secondary (surface-raised fill), each with
  hover, press and visible focus states.
- R8.5 Word meanings: a small panel beside the tapped word; closes on Escape or tap-outside.

### R9 — 3D scenes (section 7)
- R9.1 Scene A (Sun): slowly turning sphere, real solar texture, gentle surface movement,
  soft bloom allowed on the Sun only.
- R9.2 Scene B (Mars outpost): real Mars ground texture, butterscotch sky, low Sun, long
  shadows; habitat/greenhouse/shelter/panels/rover/Sun built from simple geometry.
- R9.3 Scene B maps game state → visuals per the brief's table (life support → window
  brightness and greenhouse; shielding → shelter door and crew movement; science → rover;
  battery → panel indicator and triangle fill; dust → dimmer light + dusty panels; storm →
  particle stream).
- R9.4 Scene C (message): Earth and Mars with a point of light travelling between them, with
  the real delay written beside it; used for the late warning and Wait-or-act.
- R9.5 Assets load from `public/textures/` and `public/models/`; a missing file falls back
  to a plain coloured material and the scene still works. Every asset used is listed on the
  NASA data page.
- R9.6 Camera: slow push-in on mission start, cut to the shelter on storm arrival, wide shot
  for the result.

### R10 — Performance (section 7)
- R10.1 Load 3D code only when a scene is needed; show a still image while it loads.
- R10.2 Cap pixel ratio at 1.5 on phones; pause rendering when the tab/scene is hidden.
- R10.3 Target 60fps on laptop, 30fps on a mid-range phone; lower detail automatically if
  the rate stays low.

### R11 — Interaction and motion (section 8)
- R11.1 Every control has hover, press and visible keyboard-focus states.
- R11.2 Rover run: drag the rover along its track inside the 3D scene; a line compares the
  trip home with the warning time.
- R11.3 Water tanks: drag each tank to a place; it visibly empties there.
- R11.4 Wait or act: press-and-hold; the message travels while the air meter drains.
- R11.5 Screen parts enter in order (heading, text, controls), 60–90ms apart, rising
  16–32px while fading in. Content must appear even if a script fails.
- R11.6 Interface motion uses transform and opacity only, 150–400ms, ease-out.
- R11.7 Meters animate to new values; they never jump.
- R11.8 With reduced motion on, keep all content and remove the movement.

### R12 — States and accessibility (section 9)
- R12.1 Loading, error and offline states for each screen, including "NASA's data could not
  be reached. Showing an archived storm."
- R12.2 Every control works from the keyboard and has an accessible name.
- R12.3 The 3D canvas has a text description of the current scene state.
- R12.4 Text contrast ≥ 4.5:1; all images have alt text.

### R13 — Verification per task group (section 11)
- R13.1 Screenshots of every changed screen at 1440, 768 and 390px, reviewed and fixed
  before reporting.
- R13.2 The section-11 checklist passes: a stranger understands each screen in five seconds;
  no sideways scroll/clipped text/over-two-line heading/empty half; equal margins; one
  accent button per screen; nothing from the "Do not" list; playable with 3D off and
  keyboard alone; all sim tests pass; report page weight and mission-screen frame rate.
