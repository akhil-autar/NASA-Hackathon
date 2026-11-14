// Shared helpers for talking to NASA's DONKI space-weather database and
// turning its records into the compact shape the game uses.
//
// Field shapes were taken from real DONKI responses (September 2017):
//   FLR: { flrID, peakTime, classType: "X9.3", link, linkedEvents: [{activityID}] }
//   SEP: { sepID, eventTime, link, linkedEvents: [{activityID}] }
//   GST: { gstID, startTime, allKpIndex: [{kpIndex, observedTime, source}], link }
//
// Two hosts expose DONKI:
//   - https://api.nasa.gov/DONKI/*   (needs api_key; used by the live function)
//   - https://ccmc.gsfc.nasa.gov/DONKI/WS/get/*  (no key; used at build time)

export interface DonkiFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  endTime: string | null;
  classType: string; // e.g. "M4.2", "X9.3"
  link: string;
  linkedEvents: { activityID: string }[] | null;
}

export interface DonkiSep {
  sepID: string;
  eventTime: string;
  link: string;
  linkedEvents: { activityID: string }[] | null;
}

export interface DonkiGst {
  gstID: string;
  startTime: string;
  allKpIndex: { kpIndex: number; observedTime: string; source: string }[] | null;
  link: string;
  linkedEvents: { activityID: string }[] | null;
}

/** Parse a DONKI classType ("X9.3") into letter + magnitude. */
export function parseClass(
  classType: string,
): { letter: "M" | "X"; magnitude: number } | null {
  const m = /^([A-Z])([\d.]+)$/.exec(classType.trim());
  if (!m) return null;
  const letter = m[1];
  if (letter !== "M" && letter !== "X") return null;
  const magnitude = Number(m[2]);
  if (!Number.isFinite(magnitude)) return null;
  return { letter, magnitude };
}

/** Highest Kp value in a GST's allKpIndex array (0..9), or undefined. */
export function peakKp(gst: DonkiGst): number | undefined {
  if (!gst.allKpIndex || gst.allKpIndex.length === 0) return undefined;
  return Math.max(...gst.allKpIndex.map((k) => k.kpIndex));
}

/** Hours between two ISO times, rounded to one decimal (never negative). */
export function hoursBetween(aIso: string, bIso: string): number {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
  return Math.max(0, Math.round((Math.abs(b - a) / 3_600_000) * 10) / 10);
}
