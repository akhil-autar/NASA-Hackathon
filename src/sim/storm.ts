import { CLASS_BASE_STRENGTH } from "../data/constants";
import type { Storm } from "./types";

/**
 * Storm strength as a single number. M-class is medium, X-class is strong,
 * scaled by the number after the letter. 0 when the storm is not active this
 * hour.
 */
export function stormStrengthAtHour(storm: Storm, hour: number): number {
  const active =
    hour >= storm.arrivalHour && hour < storm.arrivalHour + storm.durationHours;
  if (!active) return 0;
  const base = CLASS_BASE_STRENGTH[storm.flareClass];
  // The number after the letter spans a wide range (X1 to X9+), so we compress
  // it with a square root. A big X-flare is still clearly the strongest, but
  // not so overwhelming that no plan can survive it. This compression is a
  // game estimate (see CLASS_BASE_STRENGTH_SOURCE in constants.ts).
  return base * Math.sqrt(storm.magnitude);
}
