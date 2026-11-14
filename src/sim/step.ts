import {
  BASE_DRAW_PER_HOUR,
  BATTERY_MAX,
  COMFORT_MAX,
  COMFORT_SWING_PER_HOUR,
  DAYLIGHT_HOURS,
  DOSE_RATE_BACKGROUND,
  DOSE_RATE_UNSHIELDED,
  LIFE_SUPPORT_HOLD_SHARE,
  SCIENCE_GOAL,
  SCIENCE_PER_HOUR_AT_FULL,
  SHIELD_LEAKAGE_AT_FULL,
  SOLAR_REFILL_PER_HOUR,
} from "../data/constants";
import type { Rng } from "./rng";
import { stormStrengthAtHour } from "./storm";
import type { OutpostState, Plan, Storm } from "./types";

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** True during the daylight part of the mission (solar panels make power). */
function isDaylight(hour: number): boolean {
  // Daylight is the first DAYLIGHT_HOURS of each 24-hour sol.
  return hour % 24 < DAYLIGHT_HOURS.value;
}

/**
 * Advance the outpost one game hour. Pure and deterministic: the same inputs
 * always give the same output. `solarScale` lets missions dim the panels
 * (dust storms, dusty-panel dare card); default 1.
 */
export function step(
  state: OutpostState,
  plan: Plan,
  storm: Storm,
  _rng: Rng,
  solarScale = 1,
): OutpostState {
  const hour = state.hour;
  const strength = stormStrengthAtHour(storm, hour);

  // --- Battery: refill from sun, then drain by use ---
  const refill = isDaylight(hour)
    ? SOLAR_REFILL_PER_HOUR.value * solarScale
    : 0;
  let battery = clamp(state.battery + refill, 0, BATTERY_MAX.value);

  // How much power the outpost is allowed to use this hour depends on how much
  // battery is available. If the battery is empty, no corner gets anything.
  const draw = Math.min(battery, BASE_DRAW_PER_HOUR.value);
  const powered = draw / BASE_DRAW_PER_HOUR.value; // 0..1
  battery = clamp(battery - draw, 0, BATTERY_MAX.value);

  // Effective shares: each corner only works as far as the battery could power
  // the outpost this hour.
  const ls = plan.lifeSupport * powered;
  const sh = plan.shielding * powered;
  const sci = plan.science * powered;

  // --- Life support / comfort ---
  const comfortDelta =
    ((ls - LIFE_SUPPORT_HOLD_SHARE.value) / LIFE_SUPPORT_HOLD_SHARE.value) *
    COMFORT_SWING_PER_HOUR.value;
  const comfort = clamp(state.comfort + comfortDelta, 0, COMFORT_MAX.value);

  // --- Greenhouse: plants follow life support, more slowly ---
  const greenhouse = clamp(
    state.greenhouse + comfortDelta * 0.5,
    0,
    COMFORT_MAX.value,
  );

  // --- Science ---
  const science = clamp(
    state.science + sci * SCIENCE_PER_HOUR_AT_FULL.value,
    0,
    SCIENCE_GOAL.value,
  );

  // --- Radiation badge ---
  let radiationBadge = state.radiationBadge + DOSE_RATE_BACKGROUND.value;
  if (strength > 0) {
    // Shielding reduces the dose. At full shielding only SHIELD_LEAKAGE_AT_FULL
    // gets through; at zero shielding all of it does.
    const leakage = 1 - sh * (1 - SHIELD_LEAKAGE_AT_FULL.value);
    const exposure = state.crewSheltered ? leakage : 1;
    radiationBadge += DOSE_RATE_UNSHIELDED.value * strength * exposure;
  }

  return {
    hour: hour + 1,
    battery,
    comfort,
    science,
    radiationBadge,
    crewSheltered: state.crewSheltered,
    greenhouse,
  };
}
