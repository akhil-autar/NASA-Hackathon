import { Bolt } from "../components/Bolt";

export type MissionKind = "dust" | "water" | "call";

interface Props {
  onPick: (kind: MissionKind) => void;
  onBack: () => void;
}

export function MissionsMenuScreen({ onPick, onBack }: Props) {
  return (
    <div className="screen">
      <Bolt text="More missions. Pick a problem to solve." />
      <div className="dash-grid">
        <button type="button" className="dash-card" onClick={() => onPick("dust")}>
          <span className="dash-emoji">🌫️</span>
          Dust storm
        </button>
        <button type="button" className="dash-card" onClick={() => onPick("water")}>
          <span className="dash-emoji">💧</span>
          Water wall
        </button>
        <button type="button" className="dash-card" onClick={() => onPick("call")}>
          <span className="dash-emoji">📞</span>
          Call to Earth
        </button>
      </div>
      <button type="button" className="big-button ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
