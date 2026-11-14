import parent from "../content/parent.json";
import { loadProgress } from "../storage/progress";

interface Props {
  onBack: () => void;
  onSimplified: () => void;
}

export function ParentScreen({ onBack, onSimplified }: Props) {
  const progress = loadProgress();

  return (
    <div className="screen">
      <h2>For grown-ups</h2>
      <p className="disclaimer">{parent.intro}</p>

      <section className="card">
        <h3 className="card-title">What they played</h3>
        <p className="card-body">
          Missions played: {progress.missionsPlayed}. Stars earned:{" "}
          {progress.totalStars}.
        </p>
        {progress.log.length > 0 && (
          <ul className="log-list">
            {[...progress.log].slice(-5).reverse().map((e, i) => (
              <li key={i}>{e.text}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">The idea it teaches</h3>
        <p className="card-body">{parent.tradeOff}</p>
      </section>

      <section className="card">
        <h3 className="card-title">Two questions to ask</h3>
        <ul className="log-list">
          {parent.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>

      <button type="button" className="big-button ghost" onClick={onSimplified}>
        What we made simpler
      </button>
      <button type="button" className="big-button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
