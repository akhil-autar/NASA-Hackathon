// Vercel serverless function: build "Today's Sun" from the last 7 days of real
// DONKI space-weather events. Everyone who loads it on the same date gets the
// same storm. Cached for an hour. If the live call fails (or the sky is quiet)
// it falls back to the newest storm in the build-time archive, labelled
// "archived" so the game never presents saved data as live.

import type { ArchivedStorm, StormArchive } from "../src/data/archive-types";
import type { TodayResponse } from "../src/data/today-types";
import archive from "../src/data/storms.json" with { type: "json" };

// --- DONKI field shapes (from real responses, September 2017) ---
interface Flr {
  flrID: string;
  peakTime: string;
  classType: string;
  link: string;
  linkedEvents: { activityID: string }[] | null;
}
interface Sep {
  sepID: string;
  eventTime: string;
  linkedEvents: { activityID: string }[] | null;
}
interface Gst {
  startTime: string;
  allKpIndex: { kpIndex: number }[] | null;
  linkedEvents: { activityID: string }[] | null;
}

function parseClass(
  classType: string,
): { letter: "M" | "X"; magnitude: number } | null {
  const m = /^([A-Z])([\d.]+)$/.exec(classType.trim());
  if (!m || (m[1] !== "M" && m[1] !== "X")) return null;
  const magnitude = Number(m[2]);
  if (!Number.isFinite(magnitude)) return null;
  return { letter: m[1] as "M" | "X", magnitude };
}

function hoursBetween(a: string, b: string): number {
  return Math.max(0, Math.round((Math.abs(Date.parse(b) - Date.parse(a)) / 3_600_000) * 10) / 10);
}

function daysAgo(iso: string): number {
  const ms = Date.now() - Date.parse(iso);
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Strength = base x sqrt(magnitude); used only to pick the strongest event. */
function strength(flareClass: "M" | "X", magnitude: number): number {
  return (flareClass === "X" ? 2.2 : 1.0) * Math.sqrt(magnitude);
}

async function donki<T>(endpoint: string, from: string, to: string, key: string): Promise<T> {
  const url = `https://api.nasa.gov/DONKI/${endpoint}?startDate=${from}&endDate=${to}&api_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DONKI ${endpoint} ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : []) as T;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Pick the strongest flare and attach its linked SEP (warning) and GST (Kp). */
function strongest(flares: Flr[], seps: Sep[], gsts: Gst[]): ArchivedStorm | null {
  const sepByFlare = new Map<string, Sep>();
  for (const s of seps) {
    for (const e of s.linkedEvents ?? []) {
      if (e.activityID.includes("-FLR-")) sepByFlare.set(e.activityID, s);
    }
  }
  const gstByLinked = new Map<string, Gst>();
  for (const g of gsts) {
    for (const e of g.linkedEvents ?? []) gstByLinked.set(e.activityID, g);
  }

  let best: ArchivedStorm | null = null;
  let bestStrength = -1;
  for (const f of flares) {
    const cls = parseClass(f.classType);
    if (!cls) continue;
    const s = strength(cls.letter, cls.magnitude);
    if (s <= bestStrength) continue;

    const storm: ArchivedStorm = {
      id: f.flrID,
      peakTime: f.peakTime,
      flareClass: cls.letter,
      magnitude: cls.magnitude,
      link: f.link,
    };
    const sep = sepByFlare.get(f.flrID);
    if (sep) storm.warningHours = hoursBetween(f.peakTime, sep.eventTime);
    for (const e of f.linkedEvents ?? []) {
      const g = gstByLinked.get(e.activityID);
      const kp = g?.allKpIndex?.length
        ? Math.max(...g.allKpIndex.map((k) => k.kpIndex))
        : undefined;
      if (kp != null) {
        storm.gst = { kp };
        break;
      }
    }
    best = storm;
    bestStrength = s;
  }
  return best;
}

function fallback(): TodayResponse {
  const a = archive as unknown as StormArchive;
  const newest = a.storms[a.storms.length - 1] ?? null;
  return {
    live: false,
    storm: newest,
    daysAgo: newest ? daysAgo(newest.peakTime) : 0,
    quiet: false,
    asOf: new Date().toISOString(),
    source: "Archived NASA DONKI data (live request was not available).",
  };
}

export default async function handler(req: unknown, res: {
  setHeader: (k: string, v: string) => void;
  status: (n: number) => { json: (b: unknown) => void };
}) {
  void req;
  res.setHeader("Content-Type", "application/json");
  // Cache at the edge for an hour; allow a day of stale-while-revalidate.
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const key = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.NASA_API_KEY;
  if (!key) {
    res.status(200).json(fallback());
    return;
  }

  try {
    const now = new Date();
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - 7);
    const [flares, seps, gsts] = await Promise.all([
      donki<Flr[]>("FLR", iso(from), iso(now), key),
      donki<Sep[]>("SEP", iso(from), iso(now), key),
      donki<Gst[]>("GST", iso(from), iso(now), key),
    ]);

    const storm = strongest(flares, seps, gsts);
    if (storm) {
      const body: TodayResponse = {
        live: true,
        storm,
        daysAgo: daysAgo(storm.peakTime),
        quiet: false,
        asOf: new Date().toISOString(),
        source: "Live NASA DONKI data (last 7 days).",
      };
      res.status(200).json(body);
      return;
    }

    // Sky is quiet: no M/X flare in the last 7 days. Show the most recent real
    // storm from the archive and say how long ago it was.
    const fb = fallback();
    res.status(200).json({ ...fb, quiet: true, source: "The Sun has been quiet. Showing the most recent real storm." });
  } catch {
    res.status(200).json(fallback());
  }
}
