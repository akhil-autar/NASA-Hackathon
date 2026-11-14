import {
  COMFORT_OK,
  RADIATION_BADGE_LIMIT,
  SCIENCE_GOAL,
} from "../data/constants";
import type { MissionOutcome, OutpostState, TraceRow } from "./types";

/**
 * Turn a final state and trace into a mission outcome with stars.
 * Stars: 1 for crew home safe, 2 if the science goal is also met, 3 if the
 * radiation badge also stayed low. Dare-card bonuses are added by the caller.
 */
export function scoreMission(
  finalState: OutpostState,
  trace: TraceRow[],
): MissionOutcome {
  const crewSafe = finalState.comfort >= COMFORT_OK.value;
  const scienceGoalMet = finalState.science >= SCIENCE_GOAL.value;
  const radiationLow = finalState.radiationBadge < RADIATION_BADGE_LIMIT.value;

  let stars = 0;
  if (crewSafe) {
    stars = 1;
    if (scienceGoalMet) {
      stars = 2;
      if (radiationLow) stars = 3;
    }
  }

  return {
    finalState,
    trace,
    crewSafe,
    scienceGoalMet,
    radiationLow,
    success: crewSafe && scienceGoalMet && radiationLow,
    stars,
  };
}
