import { useMemo, useState } from "react";
import { Button } from "./Button";
import { getArchive, resolveFeatured } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";
import featured from "../content/featured-storms.json";
import { useT, useTx, type Key } from "../i18n";

function stormKey(c: "M" | "X", m: number): Key {
  if (c === "M") return "storm.medium";
  return m >= 5 ? "storm.giant" : "storm.strong";
}

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

  const t = useT();
  const tx = useTx();
  const current = storms[index];
  const strength = t(stormKey(current.flareClass, current.magnitude));
  // Famous real storms, one tap away.
  const famous = useMemo(() => {
    const found = resolveFeatured(featured.slots.map((f) => f.stormId).filter(Boolean));
    return found.map((st) => ({
      storm: st,
      slot: featured.slots.find((f) => f.stormId === st.id)!,
    }));
  }, []);

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
        aria-label={tx("Move through the storm archive", "Gerak melalui arkib ribut")}
        className="timeline-range"
      />
      <div className="timeline-ends">
        <span className="quiet">{year}</span>
        <span className="quiet">{tx("today", "hari ini")}</span>
      </div>
      <p className="timeline-summary">
        {current.peakTime.slice(0, 10)}: {strength} (
        {current.flareClass}
        {current.magnitude}).
      </p>
      <Button variant="secondary" onClick={() => onPick(current)}>
        {tx("Go to this day", "Pergi ke hari ini")}
      </Button>
      {famous.length > 0 && (
        <div className="famous-storms">
          <span className="quiet">{tx("Famous real storms", "Ribut sebenar yang terkenal")}</span>
          <div className="featured-row">
            {famous.map(({ storm: st, slot }) => (
              <button
                key={st.id}
                type="button"
                className="featured-slot"
                title={tx(slot.story, slot.story_ms)}
                onClick={() => onPick(st)}
              >
                <strong>
                  {st.flareClass}
                  {st.magnitude}
                </strong>{" "}
                · {st.peakTime.slice(0, 10)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
