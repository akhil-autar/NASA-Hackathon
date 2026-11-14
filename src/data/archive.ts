import type { ArchivedStorm, StormArchive } from "./archive-types";
import archiveJson from "./storms.json" with { type: "json" };

const archive = archiveJson as unknown as StormArchive;

export function getArchive(): StormArchive {
  return archive;
}

/** NASA's storm diary (DONKI) effectively starts in 2010. */
export const ARCHIVE_START_YEAR = 2010;

function dayMs(iso: string): number {
  return Date.parse(iso.slice(0, 10) + "T00:00:00Z");
}

/** The storm whose flare peaked on the given date, if any. */
export function stormOnDate(dateIso: string): ArchivedStorm | undefined {
  const target = dayMs(dateIso);
  return archive.storms.find((s) => dayMs(s.peakTime) === target);
}

/**
 * The storm nearest a given date. Returns the storm and how many days away it
 * is (0 = same day). Birthdays before NASA's diary are shifted to the same
 * day in ARCHIVE_START_YEAR (the caller explains this to the child).
 */
export function nearestStorm(
  dateIso: string,
): { storm: ArchivedStorm; daysAway: number; shiftedYear?: number } | undefined {
  if (archive.storms.length === 0) return undefined;

  let iso = dateIso;
  let shiftedYear: number | undefined;
  const year = Number(dateIso.slice(0, 4));
  if (year < ARCHIVE_START_YEAR) {
    iso = `${ARCHIVE_START_YEAR}${dateIso.slice(4)}`;
    shiftedYear = ARCHIVE_START_YEAR;
  }

  const target = dayMs(iso);
  let best = archive.storms[0];
  let bestDiff = Math.abs(dayMs(best.peakTime) - target);
  for (const s of archive.storms) {
    const diff = Math.abs(dayMs(s.peakTime) - target);
    if (diff < bestDiff) {
      best = s;
      bestDiff = diff;
    }
  }
  return {
    storm: best,
    daysAway: Math.round(bestDiff / 86_400_000),
    shiftedYear,
  };
}

/** All storms on a given calendar day, for the date picker. */
export function stormsInRange(fromIso: string, toIso: string): ArchivedStorm[] {
  const from = dayMs(fromIso);
  const to = dayMs(toIso);
  return archive.storms.filter((s) => {
    const d = dayMs(s.peakTime);
    return d >= from && d <= to;
  });
}

/** Resolve featured storm ids (from content) to real archived storms. */
export function resolveFeatured(ids: string[]): ArchivedStorm[] {
  const byId = new Map(archive.storms.map((s) => [s.id, s]));
  return ids
    .map((id) => byId.get(id))
    .filter((s): s is ArchivedStorm => s != null);
}
