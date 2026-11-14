import { useMemo, useState } from "react";
import { APP_NAME } from "../config";
import { toStorm } from "../data/to-storm";
import type { ArchivedStorm } from "../data/archive-types";
import type { Storm } from "../sim/types";
import { DashboardScreen, type DashRoute } from "../screens/DashboardScreen";
import { DataScreen } from "../screens/DataScreen";
import { MissionScreen } from "../screens/MissionScreen";
import { TimeMachineScreen } from "../screens/TimeMachineScreen";
import { TodayScreen } from "../screens/TodayScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { isSoundOn, setSoundOn } from "../speech/speak";
import { loadJson, saveJson } from "../storage/local";
import { loadProfile, saveProfile, type Profile } from "../storage/profile";

type View =
  | { name: "welcome" }
  | { name: "dashboard" }
  | { name: "today" }
  | { name: "timeMachine" }
  | { name: "data" }
  | { name: "mission"; storm: Storm; isTimeMachine: boolean; archived: ArchivedStorm };

// A seed from the storm id keeps a given storm deterministic across replays.
function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function App() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [view, setView] = useState<View>(() =>
    loadProfile().onboarded ? { name: "dashboard" } : { name: "welcome" },
  );
  const [lastArchived, setLastArchived] = useState<ArchivedStorm | null>(null);
  const [sound, setSound] = useState<boolean>(() =>
    loadJson<boolean>("soundOn", isSoundOn()),
  );

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundOn(next);
    saveJson("soundOn", next);
  };

  const goDash = () => setView({ name: "dashboard" });
  const goRoute = (r: DashRoute) => {
    if (r === "today") setView({ name: "today" });
    else if (r === "timeMachine") setView({ name: "timeMachine" });
    else if (r === "data") setView({ name: "data" });
  };

  const playStorm = (a: ArchivedStorm, isTimeMachine: boolean) => {
    setLastArchived(a);
    setView({
      name: "mission",
      storm: toStorm(a),
      isTimeMachine,
      archived: a,
    });
  };

  const header = useMemo(
    () => (
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
    ),
    [sound],
  );

  let body: React.ReactNode;
  switch (view.name) {
    case "welcome":
      body = (
        <WelcomeScreen
          onDone={(p) => {
            setProfile(p);
            saveProfile(p);
            goDash();
          }}
          onSkip={() => {
            const p = { ...profile, onboarded: true };
            setProfile(p);
            saveProfile(p);
            goDash();
          }}
        />
      );
      break;
    case "today":
      body = (
        <TodayScreen onPlay={(s, live) => playStorm(s, !live)} onBack={goDash} />
      );
      break;
    case "timeMachine":
      body = (
        <TimeMachineScreen onPlay={(s) => playStorm(s, true)} onBack={goDash} />
      );
      break;
    case "data":
      body = <DataScreen lastStorm={lastArchived} onBack={goDash} />;
      break;
    case "mission":
      body = (
        <MissionScreen
          key={view.storm.id}
          storm={view.storm}
          seed={seedFrom(view.storm.id)}
          isTimeMachine={view.isTimeMachine}
          crewNames={profile.crew}
          onExit={goDash}
        />
      );
      break;
    default:
      body = (
        <DashboardScreen
          profile={profile}
          onGo={goRoute}
          onPlayBirthday={(s) => playStorm(s, true)}
        />
      );
  }

  return (
    <div className="app">
      {header}
      <main>{body}</main>
      <footer className="app-footer">
        <p>
          Data from NASA. Storms are real DONKI events; the Mars base is
          make-believe.
        </p>
      </footer>
    </div>
  );
}
