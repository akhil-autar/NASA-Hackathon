import stormEffects from "../content/storm-effects.json";
import featured from "../content/featured-storms.json";
import { strengthBand } from "../sim/storm";
import type { Storm } from "../sim/types";

interface Props {
  storm: Storm;
}

/**
 * "What the real storm did" — shown at the end of a Time Machine mission.
 * 1) the real geomagnetic storm score at Earth if DONKI has one,
 * 2) one general line for that strength (from storm-effects.json),
 * 3) for featured storms, the team's hand-written story.
 */
export function RealStormCard({ storm }: Props) {
  const band = strengthBand(storm);
  const effect = stormEffects[band];
  const story = featured.slots.find((s) => s.stormId === storm.id)?.story;

  return (
    <section className="card">
      <h3 className="card-title">What the real storm did</h3>
      {storm.gst && (
        <p className="card-body">
          This storm hit Earth too. It scored {Math.round(storm.gst.kp)} out of 9.
        </p>
      )}
      <p className="card-body">{effect}</p>
      {story && <p className="card-body">{story}</p>}
    </section>
  );
}
