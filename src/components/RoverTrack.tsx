interface Props {
  distance: number; // 0..1
  onChange: (d: number) => void;
  /** Warning time as a fraction of the track (where "too far" begins). */
  safeFraction: number;
  showNumbers?: boolean;
}

/**
 * The rover run: drag the rover along a track before the storm. Farther gives
 * more science but a longer trip home. Past the safe mark, the crew can't get
 * back before the storm hits.
 */
export function RoverTrack({ distance, onChange, safeFraction, showNumbers }: Props) {
  const tooFar = distance > safeFraction;
  return (
    <div className="rover-track">
      <div className="rover-rail">
        <div
          className="rover-safe"
          style={{ width: `${safeFraction * 100}%` }}
          aria-hidden="true"
        />
        <div
          className="rover-dot"
          style={{ left: `${distance * 100}%` }}
          aria-hidden="true"
        >
          🤖
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(distance * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-label="How far to send the rover"
        className="rover-range"
      />
      <p className={tooFar ? "rover-note warn" : "rover-note"}>
        {showNumbers
          ? `Distance ${Math.round(distance * 100)}% · safe up to ${Math.round(
              safeFraction * 100,
            )}%`
          : tooFar
            ? "Too far! The rover can't get home before the storm."
            : "The rover can get home in time."}
      </p>
    </div>
  );
}
