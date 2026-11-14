import { useState } from "react";
import { APP_NAME } from "../config";
import { PHASE1_STORM } from "../data/featured-storm";
import { MissionScreen } from "../screens/MissionScreen";
import { isSoundOn, setSoundOn } from "../speech/speak";
import { loadJson, saveJson } from "../storage/local";

export function App() {
  const [sound, setSound] = useState<boolean>(() =>
    loadJson<boolean>("soundOn", isSoundOn()),
  );
  // Same storm + seed for a deterministic Phase 1 mission.
  const seed = 2017_09_06;

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundOn(next);
    saveJson("soundOn", next);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>{APP_NAME}</h1>
        <button
          type="button"
          className="sound-toggle"
          onClick={toggleSound}
          aria-pressed={sound}
        >
          {sound ? "🔊 Sound on" : "🔇 Sound off"}
        </button>
      </header>

      <main>
        <MissionScreen storm={PHASE1_STORM} seed={seed} />
      </main>

      <footer className="app-footer">
        <p>
          Data from NASA. Storm: X9.3 flare, 6 September 2017.{" "}
          <a
            href={PHASE1_STORM.source}
            target="_blank"
            rel="noreferrer noopener"
          >
            DONKI record
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
