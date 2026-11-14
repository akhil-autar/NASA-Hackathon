import { useState } from "react";
import { Bolt } from "../components/Bolt";
import featured from "../content/featured-storms.json";
import { nearestStorm, resolveFeatured, stormOnDate } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";

interface Props {
  onPlay: (storm: ArchivedStorm) => void;
  onBack: () => void;
}

const now = new Date();
const TODAY = now.toISOString().slice(0, 10);

export function TimeMachineScreen({ onPlay, onBack }: Props) {
  const [date, setDate] = useState("2017-09-06");
  const [message, setMessage] = useState<string | null>(null);

  const featuredStorms = resolveFeatured(
    featured.slots.map((s) => s.stormId).filter(Boolean),
  );

  const pick = () => {
    const exact = stormOnDate(date);
    if (exact) {
      onPlay(exact);
      return;
    }
    const near = nearestStorm(date);
    if (!near) {
      setMessage("No storm found. Try another date.");
      return;
    }
    if (near.daysAway === 0) {
      onPlay(near.storm);
      return;
    }
    setMessage(
      `The Sun was calm that day. ${near.daysAway} day${
        near.daysAway === 1 ? "" : "s"
      } away, it did this.`,
    );
    // Give the child a beat to read, then play the nearest storm.
    window.setTimeout(() => onPlay(near.storm), 1600);
  };

  return (
    <div className="screen">
      <Bolt autoSpeak text="Pick any day. See what the Sun was doing." />

      {featuredStorms.length > 0 && (
        <div className="featured-row">
          {featuredStorms.map((s) => (
            <button
              key={s.id}
              type="button"
              className="featured-slot"
              onClick={() => onPlay(s)}
            >
              {s.flareClass}
              {s.magnitude} · {s.peakTime.slice(0, 10)}
            </button>
          ))}
        </div>
      )}
      {featuredStorms.length === 0 && (
        <p className="placeholder-note">
          Featured storms appear here once the team fills in
          featured-storms.json.
        </p>
      )}

      <label className="date-pick">
        <span>Choose a date</span>
        <input
          type="date"
          value={date}
          min="2010-01-01"
          max={TODAY}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      {message && <p className="warn-text">{message}</p>}

      <button type="button" className="big-button go" onClick={pick}>
        Go to this day
      </button>
      <button type="button" className="big-button ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
