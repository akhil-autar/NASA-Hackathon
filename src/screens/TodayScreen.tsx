import { Bolt } from "../components/Bolt";
import type { ArchivedStorm } from "../data/archive-types";
import { useToday } from "../data/useToday";

interface Props {
  onPlay: (storm: ArchivedStorm, live: boolean) => void;
  onBack: () => void;
}

export function TodayScreen({ onPlay, onBack }: Props) {
  const { data, status } = useToday();

  // Loading: still waiting for NASA's answer.
  if (status === "loading" || !data) {
    return (
      <div className="screen">
        <Bolt text="Asking NASA what the Sun is doing..." />
        <p className="quiet" role="status">
          Loading today's storm.
        </p>
      </div>
    );
  }

  // Offline / error, and no storm at all to fall back to.
  if (!data.storm) {
    return (
      <div className="screen">
        <Bolt text="No storm to show right now. Try the Time Machine." />
        {status === "error" && (
          <p className="quiet offline-note" role="status">
            NASA's data could not be reached. Showing an archived storm.
          </p>
        )}
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

      {status === "error" && (
        <p className="quiet offline-note" role="status">
          NASA's data could not be reached. Showing an archived storm.
        </p>
      )}

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
