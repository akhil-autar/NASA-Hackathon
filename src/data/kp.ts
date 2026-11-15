// The Kp index: how hard Earth's magnetic field was shaken, from 0 (calm) to 9
// (extreme). The official Kp index comes from GFZ Potsdam in Germany
// (https://kp.gfz.de, licence CC BY 4.0). These helpers are shared by the
// server function (api/kp.ts) and the game, and are covered by tests.

/** GFZ web service. Same URL pattern as GFZ's own Python and Matlab clients. */
export const GFZ_API = "https://kp.gfz.de/app/json/";
export const GFZ_PAGE = "https://kp.gfz.de/en/";
export const GFZ_CITATION =
  "Matzka, J., Bronkalla, O., Tornow, K., Elger, K. and Stolle, C. (2021). Geomagnetic Kp index. V. 1.0. GFZ Data Services.";
export const GFZ_DOI = "https://doi.org/10.5880/Kp.0001";
/** Where the plain-words descriptions come from. */
export const NOAA_SCALES = "https://www.swpc.noaa.gov/noaa-scales-explanation";

/**
 * After a big flare, the cloud it throws out usually takes one to three days
 * to reach Earth. We look at the flare's day and the three days after it.
 */
export const KP_WINDOW_DAYS = 3;

/** What /api/kp sends back. */
export interface KpReading {
  /** True when GFZ had readings for these days. */
  available: boolean;
  /** Highest Kp in the window, e.g. 8.333. */
  maxKp: number;
  /** Start of the 3-hour block with the highest Kp (ISO, UTC). */
  maxTime: string;
  /** "def" = final values. Anything else = early (nowcast) values. */
  status: string;
  /** First and last day searched (YYYY-MM-DD). */
  from: string;
  to: string;
  /** The exact GFZ request, so anyone can check the number. */
  sourceUrl: string;
}

/** The days to search for a flare that peaked at `peakTime`. */
export function kpWindow(peakTime: string): { from: string; to: string } {
  const start = new Date(`${peakTime.slice(0, 10)}T00:00:00Z`);
  const end = new Date(start.getTime() + KP_WINDOW_DAYS * 86_400_000);
  const day = (d: Date) => d.toISOString().slice(0, 10);
  return { from: day(start), to: day(end) };
}

/** The GFZ request for those days. */
export function gfzUrl(from: string, to: string): string {
  return `${GFZ_API}?start=${from}T00:00:00Z&end=${to}T23:59:59Z&index=Kp`;
}

/** The parts of GFZ's JSON reply we use. */
export interface GfzKpJson {
  datetime?: string[];
  Kp?: (number | null)[];
  status?: string[];
}

/** Find the highest Kp in a GFZ reply. Missing values (-1 or null) are skipped. */
export function maxKpFrom(
  json: GfzKpJson,
): { maxKp: number; maxTime: string; status: string } | null {
  const kp = json.Kp ?? [];
  const times = json.datetime ?? [];
  let best = -1;
  let at = -1;
  kp.forEach((v, i) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 9) return;
    if (v > best) {
      best = v;
      at = i;
    }
  });
  if (at < 0) return null;
  return { maxKp: best, maxTime: times[at] ?? "", status: json.status?.[at] ?? "" };
}

/**
 * Kp as scientists write it: thirds are shown with - and +.
 * 8.000 -> "8o", 8.333 -> "8+", 7.667 -> "8-".
 */
export function kpLabel(kp: number): string {
  const thirds = Math.round(kp * 3);
  const whole = Math.round(thirds / 3);
  const rest = thirds - whole * 3;
  return `${whole}${rest === 0 ? "o" : rest > 0 ? "+" : "-"}`;
}

/** The whole number a child sees: "Kp 8". */
export function kpWhole(kp: number): number {
  return Math.min(9, Math.max(0, Math.round(kp)));
}

export type KpLevel = "calm" | "unsettled" | "minor" | "moderate" | "strong" | "severe" | "extreme";

/** NOAA's geomagnetic storm scale: Kp 5 = G1 up to Kp 9 = G5. */
export function kpLevel(kp: number): { level: KpLevel; g: number } {
  const k = kpWhole(kp);
  if (k >= 9) return { level: "extreme", g: 5 };
  if (k === 8) return { level: "severe", g: 4 };
  if (k === 7) return { level: "strong", g: 3 };
  if (k === 6) return { level: "moderate", g: 2 };
  if (k === 5) return { level: "minor", g: 1 };
  if (k >= 3) return { level: "unsettled", g: 0 };
  return { level: "calm", g: 0 };
}

/**
 * Plain words for each level, following NOAA's geomagnetic storm scale. They
 * say what storms of that size can do, not what happened in one town.
 */
export const KP_WORDS: Record<KpLevel, { title: [string, string]; words: [string, string] }> = {
  calm: {
    title: ["Earth stayed calm", "Bumi kekal tenang"],
    words: [
      "Earth's magnetic field barely moved. Auroras stayed close to the poles.",
      "Medan magnet Bumi hampir tidak bergerak. Aurora kekal dekat kutub.",
    ],
  },
  unsettled: {
    title: ["Earth felt a wobble", "Bumi rasa goyangan"],
    words: [
      "Earth's magnetic field shook a little. Auroras stayed near the poles.",
      "Medan magnet Bumi bergoyang sedikit. Aurora kekal dekat kutub.",
    ],
  },
  minor: {
    title: ["A small storm on Earth", "Ribut kecil di Bumi"],
    words: [
      "Auroras can be seen a little farther from the poles than usual.",
      "Aurora boleh dilihat lebih jauh sedikit dari kutub berbanding biasa.",
    ],
  },
  moderate: {
    title: ["A medium storm on Earth", "Ribut sederhana di Bumi"],
    words: [
      "Auroras can be seen farther from the poles than usual. Power lines near the poles need watching.",
      "Aurora boleh dilihat lebih jauh dari kutub berbanding biasa. Talian elektrik dekat kutub perlu diperhatikan.",
    ],
  },
  strong: {
    title: ["A strong storm on Earth", "Ribut kuat di Bumi"],
    words: [
      "Auroras can be seen far from the poles. GPS can make small mistakes.",
      "Aurora boleh dilihat jauh dari kutub. GPS boleh membuat kesilapan kecil.",
    ],
  },
  severe: {
    title: ["A severe storm on Earth", "Ribut teruk di Bumi"],
    words: [
      "Auroras seen far from the poles. Power grids and satellites need extra care.",
      "Aurora dilihat jauh dari kutub. Grid elektrik dan satelit perlu dijaga lebih.",
    ],
  },
  extreme: {
    title: ["An extreme storm on Earth", "Ribut melampau di Bumi"],
    words: [
      "The biggest kind! Auroras can reach places much closer to the equator. Power grids and satellites can have trouble.",
      "Jenis paling besar! Aurora boleh sampai ke tempat yang lebih dekat dengan khatulistiwa. Grid elektrik dan satelit boleh menghadapi masalah.",
    ],
  },
};

/**
 * Roughly how far from the pole the auroras reached, for the drawing only:
 * about 67 degrees of latitude on a calm day, moving toward the equator as Kp
 * rises (about 40 degrees at Kp 9).
 */
export function auroraLatitude(kp: number): number {
  return 67 - 3 * Math.min(9, Math.max(0, kp));
}
