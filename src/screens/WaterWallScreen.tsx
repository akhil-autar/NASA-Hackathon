import { useState } from "react";
import { Bolt } from "../components/Bolt";
import { OutpostView } from "../components/OutpostView";
import { Stars } from "../components/Stars";
import { WaterTanks, type TankAssignment } from "../components/WaterTanks";
import type { OutpostVisual } from "../three/types";
import { scoreWaterWall } from "../sim/other-missions";

interface Props {
  onBack: () => void;
}

const TOTAL = 6;

/**
 * Build what the outpost scene shows for the water wall. The shield-wall tanks
 * drive the scene's `shielding` value, so the stack of water tanks beside the
 * shelter grows as the child moves tanks onto the wall. The `shelter` shot
 * frames the shelter door and that tank stack. Everything else is a calm,
 * well-powered base so the only thing changing is the wall.
 */
function waterVisual(a: TankAssignment): OutpostVisual {
  return {
    lifeSupport: 0.4,
    shielding: a.shieldWall / TOTAL, // tanks on the wall → shelter tank stack
    science: 0.3,
    battery: 90, // powered, so the tanks are drawn
    greenhouse: 70,
    storm: 0,
    dust: false,
    hour: 9, // mid-morning: the shelter is well lit
    crewSheltered: true,
    shot: "shelter",
  };
}

export function WaterWallScreen({ onBack }: Props) {
  const [a, setA] = useState<TankAssignment>({
    drinking: 2,
    airMaker: 2,
    shieldWall: 2,
  });
  const [done, setDone] = useState(false);

  const placed = a.drinking + a.airMaker + a.shieldWall;
  const result = scoreWaterWall(a);

  if (done) {
    return (
      <div className="screen">
        <Stars count={result.stars} />
        <OutpostView visual={waterVisual(a)} className="water-scene" />
        <section className="card">
          <h3 className="card-title">{result.success ? "The wall held!" : "Something gave way"}</h3>
          <p className="card-body">
            {result.thirsty && "The crew went thirsty. "}
            {result.airLow && "The air got thin. "}
            {result.shieldWeak && "The shield wall was too weak. "}
            {result.success && "Drinking water, air, and the shield wall all held."}
          </p>
        </section>
        <button type="button" className="big-button" onClick={() => setDone(false)}>
          Try again
        </button>
        <button type="button" className="big-button ghost" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <Bolt
        autoSpeak
        text="A wall of water is coming. Put the six tanks where they help most. Each tank does one job."
      />
      <OutpostView visual={waterVisual(a)} className="water-scene" />
      <WaterTanks total={TOTAL} assignment={a} onChange={setA} />
      <button
        type="button"
        className="big-button go"
        disabled={placed !== TOTAL}
        onClick={() => setDone(true)}
      >
        {placed === TOTAL ? "Lock it in" : `Place ${TOTAL - placed} more`}
      </button>
      <button type="button" className="big-button ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
