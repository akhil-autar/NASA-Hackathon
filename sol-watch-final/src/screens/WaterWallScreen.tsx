import { useTx } from "../i18n";
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
  const tx = useTx();
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
          <h3 className="card-title">{result.success ? tx("The wall held!", "Dinding itu bertahan!") : tx("Something gave way", "Ada yang tidak bertahan")}</h3>
          <p className="card-body">
            {result.thirsty && tx("The crew went thirsty. ", "Kru kehausan. ")}
            {result.airLow && tx("The air got thin. ", "Udara menjadi nipis. ")}
            {result.shieldWeak && tx("The shield wall was too weak. ", "Dinding perisai terlalu lemah. ")}
            {result.success && tx("Drinking water, air, and the shield wall all held.", "Air minuman, udara dan dinding perisai semuanya bertahan.")}
          </p>
        </section>
        <button type="button" className="big-button" onClick={() => setDone(false)}>
          {tx("Try again", "Cuba lagi")}
        </button>
        <button type="button" className="big-button ghost" onClick={onBack}>
          {tx("Back", "Kembali")}
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <Bolt
        autoSpeak
        text={tx(
          "A wall of water is coming. Put the six tanks where they help most. Each tank does one job.",
          "Dinding air akan datang. Letakkan enam tangki di tempat yang paling membantu. Setiap tangki ada satu tugas.",
        )}
      />
      <OutpostView visual={waterVisual(a)} className="water-scene" />
      <WaterTanks total={TOTAL} assignment={a} onChange={setA} />
      <button
        type="button"
        className="big-button go"
        disabled={placed !== TOTAL}
        onClick={() => setDone(true)}
      >
        {placed === TOTAL ? tx("Lock it in", "Kunci pilihan") : tx(`Place ${TOTAL - placed} more`, `Letak ${TOTAL - placed} lagi`)}
      </button>
      <button type="button" className="big-button ghost" onClick={onBack}>
        {tx("Back", "Kembali")}
      </button>
    </div>
  );
}
