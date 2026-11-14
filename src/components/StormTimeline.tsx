import { useMemo, useState } from "react";
import { Button } from "./Button";
import { getArchive } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";
import { strengthWords } from "../data/useToday";

interface Props {
  onPick: (storm: ArchivedStorm) => void;
  /** Called as the pointer moves, so a parent (the Sun scene) can react. */
  onScrub?: (storm: ArchivedStorm) => void;
}

/**
 * A timeline from 2010 to today. Dragging the handle moves through the real
 * storm archive; the storm nearest the handle is summarised in one line and can
 * be played. (Group 4 connects the scrub to the 3D Sun.)
 */
export function StormTimeline({ onPick, onScrub }: Props) {
  const storms = getArchive().storms;
  const [index, setIndex] = useState(storms.length - 1);

  const bounds = useMemo(() => {
    const first = Date.parse(storms[0].peakTime);
    const last = Date.parse(storms[storms.length - 1].peakTime);
    return { first, last };
  }, [storms]);

  const current = storms[index];
  const strength = strengthWords(current.flareClass, current.magnitude);

  // Every strong (X-class) storm gets a bar on the rail. Its height shows the
  // real strength of the flare, so the biggest storms stand out.
  const ticks = useMemo(
    () =>
      storms
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.flareClass === "X")
        .map(({ s, i }) => ({
          left: (i / (storms.length - 1)) * 100,
          height: Math.min(40, 8 + Math.sqrt(s.magnitude) * 10),
        })),
    [storms],
  );

  const setByValue = (v: number) => {
    const i = Math.round((v / 100) * (storms.length - 1));
    setIndex(i);
    onScrub?.(storms[i]);
  };

  const year = new Date(bounds.first).getUTCFullYear();

  return (
    <div className="timeline">
      <div className="timeline-rail" aria-hidden="true">
        {ticks.map((t, i) => (
          <span
            key={i}
            className="timeline-tick"
            style={{ left: `${t.left}%`, height: `${t.height}px` }}
          />
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={(index / (storms.length - 1)) * 100}
        onChange={(e) => setByValue(Number(e.target.value))}
        aria-label="Move through the storm archive"
        className="timeline-range"
      />
      <div className="timeline-ends">
        <span className="quiet">{year}</span>
        <span className="quiet">today</span>
      </div>
      <p className="timeline-summary">
        {current.peakTime.slice(0, 10)}: {strength} (
        {current.flareClass}
        {current.magnitude}).
      </p>
      <Button variant="secondary" onClick={() => onPick(current)}>
        Go to this day
      </Button>
    </div>
  );
}
