import { useEffect, useState } from "react";
import type { KpReading } from "./kp";

export type KpState =
  | { status: "loading" }
  | { status: "ok"; reading: KpReading }
  | { status: "none"; reading: KpReading }
  | { status: "error" };

// One request per storm date for the whole visit.
const cache = new Map<string, Promise<KpReading>>();

function load(date: string): Promise<KpReading> {
  let p = cache.get(date);
  if (!p) {
    p = fetch(`/api/kp?date=${encodeURIComponent(date)}`).then(async (r) => {
      if (!r.ok) throw new Error(`kp ${r.status}`);
      return (await r.json()) as KpReading;
    });
    // A failed request may be tried again later.
    p.catch(() => cache.delete(date));
    cache.set(date, p);
  }
  return p;
}

/** The real Kp reading (from GFZ Potsdam) for the days after a flare. */
export function useKp(peakTime: string | undefined): KpState {
  const date = peakTime?.slice(0, 10);
  const [state, setState] = useState<KpState>({ status: "loading" });
  useEffect(() => {
    if (!date) return;
    let alive = true;
    setState({ status: "loading" });
    load(date)
      .then((reading) => {
        if (!alive) return;
        setState(reading.available ? { status: "ok", reading } : { status: "none", reading });
      })
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [date]);
  return state;
}
