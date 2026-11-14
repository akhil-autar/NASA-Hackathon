import {
  BATTERY_START,
  COMFORT_START,
  MISSION_HOURS,
} from "../data/constants";
import { makeRng } from "./rng";
import { scoreMission } from "./score";
import { stormStrengthAtHour } from "./storm";
import type { MissionOutcome, OutpostState, Plan, Storm, TraceRow } from "./types";
import { step } from "./step";

import { GREENHOUSE_START, ROVER_SCIENCE_AT_FULL } from "../data/constants";
import type { RoverRun } from "./types";

export function initialState(): OutpostState {
  return {
    hour: 0,
    battery: BATTERY_START.value,
    comfort: COMFORT_START.value,
    science: 0,
    radiationBadge: 0,
    crewSheltered: true,
    greenhouse: GREENHOUSE_START.value,
  };
}

export interface RunOptions {
  /** A second plan applied once, from the storm's arrival hour onward. */
  changeAtStorm?: Plan;
  /** Dim the solar panels (0..1). Default 1. */
  solarScale?: number;
  /** Extra stars from active dare cards. */
  dareStars?: number;
  /** Rover-run choice (solar-storm mission). */
  rover?: RoverRun;
}

/**
 * The real warning time for a storm, as a fraction of the mission (0..1).
 * Derived from the storm's arrival hour: the warning window is everything
 * before the storm arrives.
 */
export function warningFraction(storm: Storm): number {
  return storm.arrivalHour / MISSION_HOURS.value;
}

/**
 * True when sending the rover `distance` out means it can't get home before
 * the storm. The safe range is everything up to the warning fraction (the part
 * of the mission before the storm arrives), which is exactly what the rover
 * track shows the child.
 */
export function roverCaughtOutside(storm: Storm, distance: number): boolean {
  return distance > warningFraction(storm);
}

/**
 * Run a full mission (about 24 game hours) and return the outcome.
 * Deterministic for a given seed. The child may change the plan once when the
 * storm arrives; pass that as `changeAtStorm`.
 */
export function runMission(
  start: OutpostState,
  plan: Plan,
  storm: Storm,
  seed: number,
  opts: RunOptions = {},
): MissionOutcome {
  const rng = makeRng(seed);
  const solarScale = opts.solarScale ?? 1;
  const trace: TraceRow[] = [];

  // The rover run adds science up front and may catch the crew outside.
  let state = start;
  let caughtOutside = false;
  if (opts.rover) {
    const d = Math.max(0, Math.min(1, opts.rover.distance));
    state = {
      ...state,
      science: Math.min(100, state.science + d * ROVER_SCIENCE_AT_FULL.value),
    };
    caughtOutside = roverCaughtOutside(storm, d);
  }

  for (let i = 0; i < MISSION_HOURS.value; i++) {
    const activePlan =
      opts.changeAtStorm && state.hour >= storm.arrivalHour
        ? opts.changeAtStorm
        : plan;

    // If the rover trip ran long, the crew is still outside for the first
    // hour of the storm, so shielding cannot protect them then.
    const sheltered =
      caughtOutside && state.hour === storm.arrivalHour
        ? false
        : state.crewSheltered;

    trace.push({
      ...state,
      crewSheltered: sheltered,
      stormStrength: stormStrengthAtHour(storm, state.hour),
    });

    state = step({ ...state, crewSheltered: sheltered }, activePlan, storm, rng, solarScale);
    // The crew gets back inside after that first caught hour.
    state = { ...state, crewSheltered: true };
  }

  const outcome = scoreMission(state, trace);
  if (opts.dareStars && outcome.crewSafe) {
    return { ...outcome, stars: outcome.stars + opts.dareStars };
  }
  return outcome;
}
