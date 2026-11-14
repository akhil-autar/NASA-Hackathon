import { Bolt } from "../components/Bolt";
import type { Settings } from "../storage/settings";

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onChange, onBack }: Props) {
  return (
    <div className="screen">
      <Bolt text="Settings. You can change how the game looks and sounds." />

      <Toggle
        label="Sound and Bolt's voice"
        on={settings.soundOn}
        onToggle={() => onChange({ soundOn: !settings.soundOn })}
      />
      <Toggle
        label="Show me the numbers"
        hint="Swap the pictures for real values and units."
        on={settings.showNumbers}
        onToggle={() => onChange({ showNumbers: !settings.showNumbers })}
      />

      <button type="button" className="big-button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="setting-toggle"
      onClick={onToggle}
      aria-pressed={on}
    >
      <span className="setting-text">
        <span>{label}</span>
        {hint && <span className="setting-hint">{hint}</span>}
      </span>
      <span className={on ? "switch on" : "switch"}>{on ? "ON" : "OFF"}</span>
    </button>
  );
}
