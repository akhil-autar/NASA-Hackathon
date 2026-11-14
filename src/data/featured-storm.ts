import type { Storm } from "../sim/types";

/**
 * The one hard-coded real storm used in Phase 1.
 *
 * The X9.3 solar flare of 6 September 2017 — the strongest flare in more than
 * a decade. It was followed by a real particle event and, on 7-8 September
 * 2017, a severe (G4) geomagnetic storm at Earth that reached about Kp 8.
 *
 * Real NASA/DONKI record, not a game invention:
 *   DONKI activity id: 2017-09-06T11:53:00-FLR-001
 *   DONKI view:        https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/13010/4
 *   Peak:              2017-09-06T12:02:00Z, class X9.3
 *
 * The game hour the storm "arrives" and how long it lasts are game estimates
 * (warningSource: "game estimate") until Phase 2 reads a real flare->SEP gap
 * from DONKI.
 */
export const PHASE1_STORM: Storm = {
  id: "2017-09-06T11:53:00-FLR-001",
  peakTime: "2017-09-06T12:02:00Z",
  flareClass: "X",
  magnitude: 9.3,
  arrivalHour: 10,
  durationHours: 4,
  warningSource: "game estimate",
  gst: { kp: 8 },
  source: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/13010/4",
};
