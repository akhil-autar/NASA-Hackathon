// Shared types for the simulation core. No UI types here.

/** The three corners of the Power Triangle. */
export type Corner = "lifeSupport" | "shielding" | "science";

/**
 * A plan is the single dot inside the Power Triangle, expressed as three
 * shares that snap to 10% steps and always total 100% (1.0).
 */
export interface Plan {
  lifeSupport: number; // 0..1, steps of 0.1
  shielding: number; // 0..1, steps of 0.1
  science: number; // 0..1, steps of 0.1
}

/** A real recorded space-weather event, mapped to game terms. */
export interface Storm {
  /** DONKI event id (e.g. flare id). */
  id: string;
  /** Peak time of the flare, ISO string. */
  peakTime: string;
  /** Flare class. */
  flareClass: "M" | "X";
  /** The number after the letter, e.g. 2.0 for X2.0. */
  magnitude: number;
  /** Game hour (0..MISSION_HOURS) when the storm's particles reach Mars. */
  arrivalHour: number;
  /** How many game hours the storm lasts. */
  durationHours: number;
  /** Where the arrival timing came from. */
  warningSource: "donki" | "game estimate";
  /** Linked geomagnetic storm at Earth, if DONKI has one. */
  gst?: { kp: number };
  /** Source URL or note for this storm record. */
  source: string;
}

/** The outpost state the simulation carries from hour to hour. */
export interface OutpostState {
  hour: number;
  battery: number; // 0..BATTERY_MAX
  comfort: number; // 0..COMFORT_MAX
  science: number; // 0..SCIENCE_GOAL (can exceed, we cap at goal)
  radiationBadge: number; // mSv, accumulates (full at NASA's 250 mSv limit)
  crewSheltered: boolean;
  /** Greenhouse plant health, 0..100. Tracks life support. */
  greenhouse: number;
}

/** One row of the per-hour trace, used for animation and rewind. */
export interface TraceRow extends OutpostState {
  /** Storm strength active this hour (0 when calm). */
  stormStrength: number;
}

/**
 * Rover-run choice: how far (0..1) the child sends the rover before the storm.
 * Farther gives more science but a longer trip home. If the trip home is
 * longer than the real warning time, the crew is caught outside when the storm
 * hits and the radiation badge fills faster.
 */
export interface RoverRun {
  distance: number; // 0..1
}

export interface MissionOutcome {
  finalState: OutpostState;
  trace: TraceRow[];
  crewSafe: boolean; // crew comfortable at the end
  scienceGoalMet: boolean;
  radiationLow: boolean; // badge stayed below its limit
  success: boolean; // crewSafe && scienceGoalMet && radiationLow
  stars: number; // 1..3 (+1 per active dare card, added by caller)
}
