import { useEffect, useState } from "react";
import { Bolt } from "../components/Bolt";
import { getArchive } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";
import type { TodayResponse } from "../data/today-types";

interface Props {
  onPlay: (storm: ArchivedStorm, live: boolean) => void;
  onBack: () => void;
}

/** Local fallback if the /api/today function is unreachable (e.g. dev mode). */
function localFallback(): TodayResponse {
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

export function TodayScreen({ onPlay, onBack }: Props) {
  const [data, setData] = useState<TodayResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/today")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((d: TodayResponse) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(localFallback());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="screen">
        <Bolt text="Asking NASA what the Sun is doing..." />
      </div>
    );
  }

  if (!data.storm) {
    return (
      <div className="screen">
        <Bolt text="No storm to show right now. Try the Time Machine." />
        <button type="button" className="big-button" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const s = data.storm;
  let line: string;
  if (data.live && data.daysAgo === 0) {
    line = "This is today's real storm from the Sun.";
  } else if (data.quiet) {
    line = `The Sun is quiet today. Here is the last real storm, ${data.daysAgo} day${
      data.daysAgo === 1 ? "" : "s"
    } ago.`;
  } else {
    line = `The newest real storm, ${data.daysAgo} day${
      data.daysAgo === 1 ? "" : "s"
    } ago.`;
  }

  return (
    <div className="screen">
      <Bolt autoSpeak text={line} />

      <section className="card">
        <h3 className="card-title">
          {s.flareClass}
          {s.magnitude} flare {!data.live && <span className="archived-tag">archived</span>}
        </h3>
        <p className="card-body">
          {s.peakTime.slice(0, 10)}
          {s.gst ? ` · hit Earth at Kp ${Math.round(s.gst.kp)}` : ""}
        </p>
        <p className="card-body source-note">{data.source}</p>
      </section>

      <button
        type="button"
        className="big-button go"
        onClick={() => onPlay(s, data.live)}
      >
        Fly this mission
      </button>
      <button type="button" className="big-button ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
