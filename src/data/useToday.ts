import { useEffect, useState } from "react";
import { getArchive } from "./archive";
import type { TodayResponse } from "./today-types";

/** Local fallback if the /api/today function is unreachable (e.g. dev mode). */
export function localFallback(): TodayResponse {
  const a = getArchive();
  const newest = a.storms[a.storms.length - 1] ?? null;
  const daysAgo = newest
    ? Math.max(0, Math.floor((Date.now() - Date.parse(newest.peakTime)) / 86_400_000))
    : 0;
  return {
    live: false,
    storm: newest,
    daysAgo,
    quiet: false,
    asOf: new Date().toISOString(),
    source: "Archived NASA DONKI data (live request was not available).",
  };
}

export type TodayStatus = "loading" | "ready" | "error";

/** Fetch Today's Sun data once, with an archived fallback on failure. */
export function useToday(): { data: TodayResponse | null; status: TodayStatus } {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [status, setStatus] = useState<TodayStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/today")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((d: TodayResponse) => {
        if (!cancelled) {
          setData(d);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(localFallback());
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, status };
}

/** Plain-words strength of an archived storm, for a 7-year-old. */
export function strengthWords(flareClass: "M" | "X", magnitude: number): string {
  if (flareClass === "M") return "a medium storm";
  return magnitude >= 5 ? "a giant storm" : "a strong storm";
}
