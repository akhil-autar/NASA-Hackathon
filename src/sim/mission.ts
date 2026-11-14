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

export function initialState(): OutpostState {
  return {
    hour: 0,
    battery: BATTERY_START.value,
    comfort: COMFORT_START.value,
    science: 0,
    radiationBadge: 0,
    crewSheltered: true,
  };
}

export interface RunOptions {
  /** A second plan applied once, from the storm's arrival hour onward. */
  changeAtStorm?: Plan;
  /** Dim the solar panels (0..1). Default 1. */
  solarScale?: number;
  /** Extra stars from active dare cards. */
  dareStars?: number;
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
  let state = start;

  for (let i = 0; i < MISSION_HOURS.value; i++) {
    const activePlan =
      opts.changeAtStorm && state.hour >= storm.arrivalHour
        ? opts.changeAtStorm
        : plan;

    trace.push({
      ...state,
      stormStrength: stormStrengthAtHour(storm, state.hour),
    });

    state = step(state, activePlan, storm, rng, solarScale);
  }

  const outcome = scoreMission(state, trace);
  if (opts.dareStars && outcome.crewSafe) {
    return { ...outcome, stars: outcome.stars + opts.dareStars };
  }
  return outcome;
}
