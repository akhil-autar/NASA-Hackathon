import parent from "../content/parent.json";
import { Button } from "../components/Button";
import { TextPage } from "../components/TextPage";
import { loadProgress } from "../storage/progress";

interface Props {
  onBack: () => void;
  onSimplified: () => void;
}

export function ParentScreen({ onBack, onSimplified }: Props) {
  const progress = loadProgress();

  return (
    <TextPage
      title="For grown-ups"
      headerImage="img/base-site-map.jpg"
      headerAlt="Jezero Crater on Mars, seen from orbit."
      onBack={onBack}
    >
      <p>{parent.intro}</p>

      <section className="panel">
        <h3>What they played</h3>
        <p>
          Missions played: {progress.missionsPlayed}. Stars earned:{" "}
          {progress.totalStars}.
        </p>
        {progress.log.length > 0 && (
          <ul className="prose-list">
            {[...progress.log].slice(-5).reverse().map((e, i) => (
              <li key={i}>{e.text}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h3>The idea it teaches</h3>
        <p>{parent.tradeOff}</p>
      </section>

      <section className="panel">
        <h3>Two questions to ask</h3>
        <ul className="prose-list">
          {parent.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>

      <Button onClick={onSimplified}>What we made simpler</Button>
    </TextPage>
  );
}
