import { makeRng } from "./rng";
import type { RunOptions } from "./mission";
import type { Storm } from "./types";

export type DareId =
  | "dustyPanels"
  | "fuzzyForecast"
  | "boltAsleep"
  | "longHaul";

export interface DareState {
  active: Set<DareId>;
}

/** How many extra stars the active dare cards are worth (one each). */
export function dareStars(active: Iterable<DareId>): number {
  return [...active].length;
}

/**
 * Turn the active dare cards into simulation options. Dusty panels dim the
 * solar refill. Fuzzy forecast moves the storm's arrival by a seeded amount
 * (so the warning is "wrong"). Bolt asleep and Long haul affect the UI, not
 * the per-hour sim, so they are handled in the screen.
 */
export function applyDares(
  active: Iterable<DareId>,
  storm: Storm,
  seed: number,
): { storm: Storm; opts: RunOptions } {
  const set = new Set(active);
  const opts: RunOptions = { dareStars: dareStars(set) };
  let out = storm;

  if (set.has("dustyPanels")) {
    opts.solarScale = 0.55; // noticeably less solar power
  }

  if (set.has("fuzzyForecast")) {
    // The warning is off by a few hours in a seeded direction.
    const rng = makeRng(seed ^ 0x9e3779b9);
    const shift = Math.round(rng.range(-3, 4)); // -3..+3
    const arrival = Math.max(4, Math.min(18, storm.arrivalHour + shift));
    out = { ...storm, arrivalHour: arrival };
  }

  return { storm: out, opts };
}
