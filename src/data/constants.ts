// Every number the simulation uses lives here, each with a `source`.
// A source is either a real URL or the literal "game estimate".
// Radiation values that are not yet checked against real RadLab readings are
// marked UNVERIFIED; the data page shows that flag.

export interface Constant {
  value: number;
  unit?: string;
  source: string;
  /** True when the value has not yet been checked against real NASA readings. */
  unverified?: boolean;
  /** Short note for the data page. */
  note?: string;
}

// --- Mission clock -------------------------------------------------------
export const MISSION_HOURS: Constant = {
  value: 24,
  unit: "game hours",
  source: "game estimate",
  note: "A mission is about one Mars day, played in about 3 minutes.",
};

// --- Battery / Power Triangle -------------------------------------------
// The triangle is the battery. It drains as power is used and refills from
// the solar panels. All values are a game model, not a NASA measurement.
export const BATTERY_MAX: Constant = {
  value: 100,
  unit: "%",
  source: "game estimate",
};

export const BATTERY_START: Constant = {
  value: 80,
  unit: "%",
  source: "game estimate",
};

// Power the outpost draws each hour to run all three corners at full.
// The dot splits this between the three corners.
export const BASE_DRAW_PER_HOUR: Constant = {
  value: 6,
  unit: "% of battery / hour",
  source: "game estimate",
};

// Solar refill per hour in normal daylight (dust/night reduce it).
// Over a sol, daylight refill must roughly cover the all-day draw, so the
// battery can survive a balanced plan but still empties under heavy use.
export const SOLAR_REFILL_PER_HOUR: Constant = {
  value: 13,
  unit: "% of battery / hour",
  source: "game estimate",
};

// Share of the mission that is daylight (solar panels make power).
export const DAYLIGHT_HOURS: Constant = {
  value: 12,
  unit: "hours",
  source: "game estimate",
};

// --- Life support --------------------------------------------------------
export const COMFORT_MAX: Constant = {
  value: 100,
  unit: "comfort",
  source: "game estimate",
};

export const COMFORT_START: Constant = {
  value: 70,
  unit: "comfort",
  source: "game estimate",
};

// Life Support share (0..1) at which comfort holds steady. Above it, comfort
// rises; below it, comfort falls.
export const LIFE_SUPPORT_HOLD_SHARE: Constant = {
  value: 0.33,
  source: "game estimate",
};

export const COMFORT_SWING_PER_HOUR: Constant = {
  value: 6,
  unit: "comfort / hour",
  source: "game estimate",
};

// Crew is "comfortable" at mission end when comfort is at or above this.
export const COMFORT_OK: Constant = {
  value: 45,
  unit: "comfort",
  source: "game estimate",
};

// --- Science -------------------------------------------------------------
export const SCIENCE_GOAL: Constant = {
  value: 100,
  unit: "science points",
  source: "game estimate",
};

// Science points earned per hour at a full (100%) Science share.
export const SCIENCE_PER_HOUR_AT_FULL: Constant = {
  value: 11,
  unit: "science points / hour",
  source: "game estimate",
};

// --- Radiation (UNVERIFIED until RadLab sampler is run in Phase 2) -------
// Placeholder values based on the shape of RadLab fields (uGy/hour,
// uSv/hour). These MUST be replaced with real averages and un-flagged.
export const RADIATION_BADGE_LIMIT: Constant = {
  value: 100,
  unit: "mSv (game units)",
  source: "game estimate",
  note: "The badge 'fills' at this amount; a real dose limit comes later.",
};

// Dose rate the badge gains each storm hour when fully unshielded, scaled by
// storm strength. Replace with RadLab-derived numbers in Phase 2.
export const DOSE_RATE_UNSHIELDED: Constant = {
  value: 4,
  unit: "mSv / storm hour (game units)",
  source: "https://visualization.osdr.nasa.gov/radlab/api",
  unverified: true,
  note: "Placeholder. Replace with RadLab absorbed/equivalent dose averages.",
};

// Fraction of dose let through at a full (100%) Shielding share (0 = perfect).
export const SHIELD_LEAKAGE_AT_FULL: Constant = {
  value: 0.08,
  source: "game estimate",
  unverified: true,
};

// Background dose per hour when there is no storm.
export const DOSE_RATE_BACKGROUND: Constant = {
  value: 0.3,
  unit: "mSv / hour (game units)",
  source: "https://visualization.osdr.nasa.gov/radlab/api",
  unverified: true,
};

// --- Storm strength mapping ---------------------------------------------
// Real flare class -> storm strength. M is medium, X is strong, scaled by the
// number after the letter (e.g. X2.0). Tuned so fairness tests pass.
export const CLASS_BASE_STRENGTH: { M: number; X: number } = {
  M: 1.0,
  X: 2.2,
};
export const CLASS_BASE_STRENGTH_SOURCE: Constant = {
  value: 0,
  source: "game estimate",
  note:
    "Mapping from NOAA/NASA flare classes (M/X) to a game strength number. " +
    "Strength = base x sqrt(magnitude) so a big X-flare is strong but still " +
    "beatable with a strong-shielding plan.",
};

// --- Late warning (real range, game shortens it) ------------------------
export const MARS_MESSAGE_DELAY_MIN: Constant = {
  value: 3,
  unit: "minutes",
  source: "https://mars.nasa.gov/#red_planet/3",
  note: "Real one-way light time Earth<->Mars ranges about 3 to 22 minutes.",
};
export const MARS_MESSAGE_DELAY_MAX: Constant = {
  value: 22,
  unit: "minutes",
  source: "https://mars.nasa.gov/#red_planet/3",
};

// Hour of the mission the storm arrives, when DONKI gives no flare->SEP gap.
export const DEFAULT_STORM_ARRIVAL_HOUR: Constant = {
  value: 10,
  unit: "hour of mission",
  source: "game estimate",
};
