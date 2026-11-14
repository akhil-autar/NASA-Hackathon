import simplified from "../content/simplified.json";
import { TextPage } from "../components/TextPage";

interface Props {
  onBack: () => void;
}

export function SimplifiedScreen({ onBack }: Props) {
  return (
    <TextPage
      title="What we made simpler"
      headerImage="img/mars-panorama.jpg"
      headerAlt="The Mars surface, seen by a NASA rover."
      onBack={onBack}
    >
      <p>To make the game fun and quick, we changed a few real things.</p>
      <ul className="prose-list">
        {simplified.items.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </TextPage>
  );
}
