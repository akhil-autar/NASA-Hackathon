import simplified from "../content/simplified.json";

interface Props {
  onBack: () => void;
}

export function SimplifiedScreen({ onBack }: Props) {
  return (
    <div className="screen">
      <h2>What we made simpler</h2>
      <p className="disclaimer">
        To make the game fun and quick, we changed a few real things.
      </p>
      <ul className="simple-list">
        {simplified.items.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <button type="button" className="big-button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
