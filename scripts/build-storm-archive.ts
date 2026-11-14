// Build-time script: download DONKI flares from 2010 to today in yearly
// chunks, keep the M-class and X-class flares, link each to its particle
// event (SEP, for the real warning time) and geomagnetic storm (GST, for its
// Kp score), and write a compact src/data/storms.json.
//
// Run with:  npx tsx scripts/build-storm-archive.ts
// (or any TypeScript runner). No API key is needed: it uses the public CCMC
// DONKI web service. Pass --demo to build only the last two years quickly.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  hoursBetween,
  parseClass,
  peakKp,
  type DonkiFlare,
  type DonkiGst,
  type DonkiSep,
} from "./donki.ts";
import type { ArchivedStorm, StormArchive } from "../src/data/archive-types.ts";

const BASE = "https://ccmc.gsfc.nasa.gov/DONKI/WS/get";
const START_YEAR = 2010;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fetch JSON, retrying politely on rate limits (429) and transient 5xx.
async function getJson<T>(url: string, attempt = 0): Promise<T> {
  const res = await fetch(url);
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 5) {
      throw new Error(`${res.status} after ${attempt} retries for ${url}`);
    }
    const wait = 1500 * 2 ** attempt; // 1.5s, 3s, 6s, 12s, 24s
    process.stdout.write(`  ${res.status}; retrying in ${wait}ms\n`);
    await sleep(wait);
    return getJson<T>(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : []) as T;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// DONKI's SEP and GST endpoints reject ranges longer than 60 days, so we walk
// the whole span in ~50-day windows (comfortably under the limit).
const WINDOW_DAYS = 50;

function* windows(start: Date, end: Date): Generator<[string, string]> {
  const cursor = new Date(start);
  while (cursor <= end) {
    const from = new Date(cursor);
    const to = new Date(cursor);
    to.setUTCDate(to.getUTCDate() + WINDOW_DAYS - 1);
    yield [iso(from), iso(to <= end ? to : end)];
    cursor.setUTCDate(cursor.getUTCDate() + WINDOW_DAYS);
  }
}

async function main() {
  const demo = process.argv.includes("--demo");
  const now = new Date();
  const start = new Date(
    Date.UTC(demo ? now.getUTCFullYear() - 1 : START_YEAR, 0, 1),
  );

  const flares: DonkiFlare[] = [];
  const seps: DonkiSep[] = [];
  const gsts: DonkiGst[] = [];

  for (const [from, to] of windows(start, now)) {
    process.stdout.write(`Fetching ${from}..${to}\n`);
    // Sequential, with a small pause, to stay under DONKI's rate limit.
    flares.push(
      ...(await getJson<DonkiFlare[]>(`${BASE}/FLR?startDate=${from}&endDate=${to}`)),
    );
    await sleep(300);
    seps.push(
      ...(await getJson<DonkiSep[]>(`${BASE}/SEP?startDate=${from}&endDate=${to}`)),
    );
    await sleep(300);
    gsts.push(
      ...(await getJson<DonkiGst[]>(`${BASE}/GST?startDate=${from}&endDate=${to}`)),
    );
    await sleep(300);
  }

  // Index SEP and GST by the flare ids they link to.
  const sepByFlare = new Map<string, DonkiSep>();
  for (const s of seps) {
    for (const e of s.linkedEvents ?? []) {
      if (e.activityID.includes("-FLR-")) sepByFlare.set(e.activityID, s);
    }
  }
  const gstByLinked = new Map<string, DonkiGst>();
  for (const g of gsts) {
    for (const e of g.linkedEvents ?? []) {
      gstByLinked.set(e.activityID, g);
    }
  }

  const storms: ArchivedStorm[] = [];
  for (const f of flares) {
    const cls = parseClass(f.classType);
    if (!cls) continue; // keep only M and X

    const storm: ArchivedStorm = {
      id: f.flrID,
      peakTime: f.peakTime,
      flareClass: cls.letter,
      magnitude: cls.magnitude,
      link: f.link,
    };

    const sep = sepByFlare.get(f.flrID);
    if (sep) {
      const gap = hoursBetween(f.peakTime, sep.eventTime);
      if (Number.isFinite(gap)) storm.warningHours = gap;
    }

    // A flare links to a GST via a shared CME; check the flare's own linked
    // events for anything the GST also links to.
    for (const e of f.linkedEvents ?? []) {
      const g = gstByLinked.get(e.activityID);
      const kp = g ? peakKp(g) : undefined;
      if (kp != null) {
        storm.gst = { kp };
        break;
      }
    }

    storms.push(storm);
  }

  storms.sort((a, b) => a.peakTime.localeCompare(b.peakTime));

  const archive: StormArchive = {
    builtAt: new Date().toISOString(),
    from: iso(start),
    to: iso(now),
    source:
      "NASA DONKI (https://ccmc.gsfc.nasa.gov/DONKI/). M-class and X-class " +
      "flares only, linked to SEP (warning time) and GST (Kp) where present.",
    storms,
  };

  const here = dirname(fileURLToPath(import.meta.url));
  const out = resolve(here, "../src/data/storms.json");
  writeFileSync(out, JSON.stringify(archive) + "\n");
  process.stdout.write(
    `Wrote ${storms.length} storms to ${out} ` +
      `(${(JSON.stringify(archive).length / 1024).toFixed(0)} KB)\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
