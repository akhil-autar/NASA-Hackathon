// Every number the simulation uses lives here, each with a `source`.
// A source is either a real URL or the literal "game estimate".

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

// --- Radiation ----------------------------------------------------------
// The radiation badge is measured in real units (mSv) and anchored to real
// NASA numbers. The storm dose rate and the shield leakage are game estimates,
// clearly labelled, sized so a strong unshielded storm can break the NASA limit.

// The badge is "full" at NASA's short-term limit for one solar particle event.
export const RADIATION_BADGE_LIMIT: Constant = {
  value: 250,
  unit: "mSv",
  source:
    "https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf",
  note: "NASA-STD-3001: crew dose from one solar particle event must stay under 250 mSv.",
};

// Dose the badge gains each storm hour when fully unshielded, scaled by
// storm strength (from the real DONKI flare class).
export const DOSE_RATE_UNSHIELDED: Constant = {
  value: 10,
  unit: "mSv / storm hour",
  source: "game estimate",
  note: "Sized so a strong storm with no shielding passes NASA's 250 mSv limit.",
};

// Fraction of dose let through at a full (100%) Shielding share (0 = perfect).
export const SHIELD_LEAKAGE_AT_FULL: Constant = {
  value: 0.08,
  source: "game estimate",
  note: "A full storm shelter (water and regolith walls) lets about 8% through.",
};

// Background dose per hour when there is no storm: the real everyday dose on
// the surface of Mars, measured by Curiosity's RAD instrument.
export const DOSE_RATE_BACKGROUND: Constant = {
  value: 0.027,
  unit: "mSv / hour",
  source: "https://doi.org/10.1126/science.1244797",
  note: "Curiosity RAD measured 0.64 mSv per day at Gale Crater (Hassler et al. 2014, Science).",
};

// --- Rover run -----------------------------------------------------------
// Science earned from the rover trip at full distance (added once, before the
// storm). Longer distance = more science but a longer trip home.
export const ROVER_SCIENCE_AT_FULL: Constant = {
  value: 45,
  unit: "science points",
  source: "game estimate",
};

// --- Greenhouse ----------------------------------------------------------
export const GREENHOUSE_START: Constant = {
  value: 70,
  unit: "plant health",
  source: "game estimate",
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
