import results from "../content/results.json";
import type { MissionOutcome } from "../sim/types";
import { Word } from "./Word";

interface Props {
  outcome: MissionOutcome;
  onPlayAgain: () => void;
}

/**
 * The three result panels — "What happened", "Why", "What it cost" — side by
 * side on laptop and stacked on phone, plus one "Real astronauts" fact. Stars,
 * the guess check, Rewind and Play again are owned by the mission screen.
 */
export function ResultCards({ outcome }: Props) {
  return (
    <>
      {!outcome.success && (
        <p className="panel result-failure">{results.failure}</p>
      )}

      <div className="result-panels">
        <Card title="What happened">{results.whatHappened}</Card>
        <Card title="Why">
          The Sun sent out tiny, fast bits called{" "}
          <Word term="radiation">particles</Word>. Thick walls stop them.
        </Card>
        <Card title="What it cost">{results.whatItCost}</Card>
      </div>

      <section className="panel panel-raised">
        <h3>Real astronauts</h3>
        <p className="quiet">{results.realAstronautsFact}</p>
      </section>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel result-panel">
      <h3>{title}</h3>
      <p>{children}</p>
    </section>
  );
}
