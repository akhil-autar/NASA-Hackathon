// Vercel serverless function: the real Kp index for the days after a flare.
//
//   GET /api/kp?date=YYYY-MM-DD   (the flare's peak day)
//
// Asks GFZ Potsdam's official Kp web service for that day and the three days
// after it, and returns the highest reading. Nothing is typed in by hand: every
// number comes straight from GFZ (licence CC BY 4.0). Final ("definitive")
// values are cached for 30 days; early values for an hour.

// Type-only import: erased at build time, so this function has no runtime
// dependency on the game's source files (same as api/today.ts).
import type { KpReading } from "../src/data/kp";

// --- Kept in step with src/data/kp.ts (which has the tests) ---
const GFZ_API = "https://kp.gfz.de/app/json/";
const KP_WINDOW_DAYS = 3;

interface GfzKpJson {
  datetime?: string[];
  Kp?: (number | null)[];
  status?: string[];
}

function kpWindow(peakDay: string): { from: string; to: string } {
  const start = new Date(`${peakDay.slice(0, 10)}T00:00:00Z`);
  const end = new Date(start.getTime() + KP_WINDOW_DAYS * 86_400_000);
  const day = (d: Date) => d.toISOString().slice(0, 10);
  return { from: day(start), to: day(end) };
}

function gfzUrl(from: string, to: string): string {
  return `${GFZ_API}?start=${from}T00:00:00Z&end=${to}T23:59:59Z&index=Kp`;
}

function maxKpFrom(json: GfzKpJson): { maxKp: number; maxTime: string; status: string } | null {
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

interface Req {
  query: Record<string, string | string[] | undefined>;
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

const FIRST_DAY = "1932-01-01";

export default async function handler(req: Req, res: Res) {
  const raw = req.query.date;
  const date = Array.isArray(raw) ? raw[0] : raw;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    res.status(400).json({ error: "Use ?date=YYYY-MM-DD" });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  if (date < FIRST_DAY || date > today) {
    res.status(400).json({ error: `Kp exists from ${FIRST_DAY} to today` });
    return;
  }

  const { from, to } = kpWindow(date);
  const sourceUrl = gfzUrl(from, to);
  try {
    const r = await fetch(sourceUrl, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`GFZ ${r.status}`);
    const json = (await r.json()) as GfzKpJson;
    const max = maxKpFrom(json);
    const allFinal = (json.status ?? []).length > 0 && (json.status ?? []).every((s) => s === "def");
    const body: KpReading = max
      ? { available: true, ...max, from, to, sourceUrl }
      : { available: false, maxKp: 0, maxTime: "", status: "", from, to, sourceUrl };
    res.setHeader(
      "Cache-Control",
      allFinal && to < today
        ? "public, s-maxage=2592000, stale-while-revalidate=86400"
        : "public, s-maxage=3600, stale-while-revalidate=600",
    );
    res.status(200).json(body);
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: "GFZ could not be reached", detail: String(e), sourceUrl });
  }
}
