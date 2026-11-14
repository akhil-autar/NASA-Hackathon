import {
  DEFAULT_STORM_ARRIVAL_HOUR,
  MISSION_HOURS,
} from "./constants";
import type { ArchivedStorm } from "./archive-types";
import type { Storm } from "../sim/types";

/**
 * Turn a real archived/live storm into the simulation's Storm. The real
 * warning gap (flare -> particles) can be many hours or days, so the game
 * shortens it into the mission's 24 hours: the storm arrives part-way through,
 * leaving the child time to act. When DONKI has no linked particle event we
 * use a labelled game estimate.
 */
export function toStorm(a: ArchivedStorm): Storm {
  let arrivalHour = DEFAULT_STORM_ARRIVAL_HOUR.value;
  let warningSource: Storm["warningSource"] = "game estimate";

  if (a.warningHours != null) {
    warningSource = "donki";
    // Map the real gap onto the first ~16 hours of the mission so there is
    // always time to react and still finish the sol. Longer real gaps arrive
    // a little later in the mission, shorter gaps sooner.
    const span = MISSION_HOURS.value - 8; // leave 8 hours after arrival
    const scaled = Math.min(a.warningHours, 48) / 48; // 0..1 over up to 2 days
    arrivalHour = Math.max(4, Math.round(4 + scaled * (span - 4)));
  }

  return {
    id: a.id,
    peakTime: a.peakTime,
    flareClass: a.flareClass,
    magnitude: a.magnitude,
    arrivalHour,
    durationHours: 4,
    warningSource,
    gst: a.gst,
    source: a.link,
  };
}
