import { useState } from "react";
import { Bolt } from "../components/Bolt";
import { Stars } from "../components/Stars";
import { WaterTanks, type TankAssignment } from "../components/WaterTanks";
import { scoreWaterWall } from "../sim/other-missions";

interface Props {
  onBack: () => void;
}

const TOTAL = 6;

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
