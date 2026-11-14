import results from "../content/results.json";
import type { MissionOutcome } from "../sim/types";
import { Stars } from "./Stars";
import { Word } from "./Word";

interface Props {
  outcome: MissionOutcome;
  onPlayAgain: () => void;
}

/**
 * The end-of-mission result cards: What happened, Why, What it cost, then one
 * Real astronauts fact. Copy comes from results.json (brief placeholders).
 */
export function ResultCards({ outcome, onPlayAgain }: Props) {
  return (
    <div className="results">
      <Stars count={outcome.stars} />

      {!outcome.success && <Card title="The crew flies home early">{results.failure}</Card>}

      <Card title="What happened">{results.whatHappened}</Card>
      <Card title="Why">
        The Sun sent out tiny, fast bits called{" "}
        <Word term="radiation">particles</Word>. Thick walls stop them.
      </Card>
      <Card title="What it cost">{results.whatItCost}</Card>
      <Card title="Real astronauts" muted>
        {results.realAstronautsFact}
      </Card>

      <button type="button" className="big-button" onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  );
}

function Card({
  title,
  children,
  muted,
}: {
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={muted ? "card muted" : "card"}>
      <h3 className="card-title">{title}</h3>
      <p className="card-body">{children}</p>
    </section>
  );
}
