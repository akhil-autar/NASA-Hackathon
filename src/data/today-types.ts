import type { ArchivedStorm } from "./archive-types";

/**
 * The response from the /api/today serverless function.
 * `live` is false when the data came from the archive fallback, in which case
 * the game must label the storm "archived".
 */
export interface TodayResponse {
  live: boolean;
  /** The strongest real event to build today's mission from, or null if none. */
  storm: ArchivedStorm | null;
  /** How many days ago the storm's flare peaked (0 = today). */
  daysAgo: number;
  /** True when the sky has been quiet and we fell back to the most recent storm. */
  quiet: boolean;
  /** When this was produced, ISO. */
  asOf: string;
  /** Short note on where the data came from, for the data page. */
  source: string;
}
