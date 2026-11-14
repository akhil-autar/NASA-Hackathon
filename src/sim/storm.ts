import { CLASS_BASE_STRENGTH } from "../data/constants";
import type { Storm } from "./types";

/** Peak strength of a storm, ignoring timing. */
export function baseStrength(storm: Storm): number {
  const base = CLASS_BASE_STRENGTH[storm.flareClass];
  // The number after the letter spans a wide range (X1 to X9+), so we compress
  // it with a square root. A big X-flare is still clearly the strongest, but
  // not so overwhelming that no plan can survive it. This compression is a
  // game estimate (see CLASS_BASE_STRENGTH_SOURCE in constants.ts).
  return base * Math.sqrt(storm.magnitude);
}

/**
 * Storm strength as a single number for a given game hour. 0 when the storm is
 * not active this hour.
 */
export function stormStrengthAtHour(storm: Storm, hour: number): number {
  const active =
    hour >= storm.arrivalHour && hour < storm.arrivalHour + storm.durationHours;
  return active ? baseStrength(storm) : 0;
}

/** Bucket a storm into weak / medium / strong for general-effect copy. */
export function strengthBand(storm: Storm): "weak" | "medium" | "strong" {
  if (storm.flareClass === "M") return "weak";
  // X-class: small numbers are medium, big ones strong.
  return storm.magnitude >= 5 ? "strong" : "medium";
}
