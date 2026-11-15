import { useTx } from "../i18n";
import stormEffects from "../content/storm-effects.json";
import featured from "../content/featured-storms.json";
import { strengthBand } from "../sim/storm";
import type { Storm } from "../sim/types";

interface Props {
  storm: Storm;
}

/**
 * "What the real storm did" — shown at the end of a Time Machine mission.
 * 1) one general line for that strength (from storm-effects.json),
 * 2) for featured storms, the team's hand-written story.
 * The real reading at Earth is in the Earth Impact card (Kp from GFZ).
 */
export function RealStormCard({ storm }: Props) {
  const tx = useTx();
  const band = strengthBand(storm);
  const effect = stormEffects[band];
  const slot = featured.slots.find((s) => s.stormId === storm.id);
  const story = slot ? tx(slot.story, slot.story_ms) : undefined;

  return (
    <section className="card">
      <h3 className="card-title">{tx("What the real storm did", "Apa yang ribut sebenar lakukan")}</h3>
      <p className="card-body">{effect}</p>
      {story && <p className="card-body">{story}</p>}
    </section>
  );
}
