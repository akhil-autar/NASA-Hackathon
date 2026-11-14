import { useState } from "react";
import { toStorm } from "../data/to-storm";
import type { ArchivedStorm } from "../data/archive-types";
import type { Storm } from "../sim/types";
import { DashboardScreen, type DashRoute } from "../screens/DashboardScreen";
import { DataScreen } from "../screens/DataScreen";
import { MissionScreen } from "../screens/MissionScreen";
import { ParentScreen } from "../screens/ParentScreen";
import { ClassScreen } from "../screens/ClassScreen";
import { CallToEarthScreen } from "../screens/CallToEarthScreen";
import { MissionsMenuScreen, type MissionKind } from "../screens/MissionsMenuScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SimplifiedScreen } from "../screens/SimplifiedScreen";
import { TimeMachineScreen } from "../screens/TimeMachineScreen";
import { WaterWallScreen } from "../screens/WaterWallScreen";
import { getArchive } from "../data/archive";
import { TodayScreen } from "../screens/TodayScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { TopBar, type TopBarLink } from "../components/TopBar";
import { setSoundOn } from "../speech/speak";
import { loadProfile, saveProfile, type Profile } from "../storage/profile";
import { loadSettings, saveSettings, type Settings } from "../storage/settings";

type View =
  | { name: "welcome" }
  | { name: "dashboard" }
  | { name: "today" }
  | { name: "timeMachine" }
  | { name: "data" }
  | { name: "settings" }
  | { name: "parent" }
  | { name: "class" }
  | { name: "simplified" }
  | { name: "missions" }
  | { name: "water" }
  | { name: "call" }
  | {
      name: "mission";
      storm: Storm;
      isTimeMachine: boolean;
      isDaily: boolean;
      dustStorm?: boolean;
      archived: ArchivedStorm;
    };

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
  const [settings, setSettings] = useState<Settings>(() => {
    const s = loadSettings();
    setSoundOn(s.soundOn);
    return s;
  });
  const [view, setView] = useState<View>(() =>
    loadProfile().onboarded ? { name: "dashboard" } : { name: "welcome" },
  );
  const [lastArchived, setLastArchived] = useState<ArchivedStorm | null>(null);

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    if (patch.soundOn !== undefined) setSoundOn(next.soundOn);
  };

  const goDash = () => setView({ name: "dashboard" });
  const goRoute = (r: DashRoute) => {
    if (r === "today") setView({ name: "today" });
    else if (r === "timeMachine") setView({ name: "timeMachine" });
    else if (r === "missions") setView({ name: "missions" });
    else if (r === "data") setView({ name: "data" });
    else if (r === "settings") setView({ name: "settings" });
    else if (r === "parent") setView({ name: "parent" });
    else if (r === "class") setView({ name: "class" });
  };

  const playStorm = (
    a: ArchivedStorm,
    kind: "timeMachine" | "daily" | "birthday",
  ) => {
    setLastArchived(a);
    setView({
      name: "mission",
      storm: toStorm(a),
      isTimeMachine: kind !== "daily",
      isDaily: kind === "daily",
      archived: a,
    });
  };

  const pickMission = (kind: MissionKind) => {
    if (kind === "water") setView({ name: "water" });
    else if (kind === "call") setView({ name: "call" });
    else if (kind === "dust") {
      // Dust storm uses a real storm but dims the panels for the whole sol.
      const storms = getArchive().storms;
      const a = storms[storms.length - 1];
      setLastArchived(a);
      setView({
        name: "mission",
        storm: toStorm(a),
        isTimeMachine: false,
        isDaily: false,
        dustStorm: true,
        archived: a,
      });
    }
  };

  const topBarLinks: TopBarLink[] = [
    { label: "Grown-ups", onClick: () => setView({ name: "parent" }) },
    { label: "Class mode", onClick: () => setView({ name: "class" }) },
    { label: "NASA data", onClick: () => setView({ name: "data" }) },
    { label: "Settings", onClick: () => setView({ name: "settings" }) },
  ];

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
        <TodayScreen onPlay={(s) => playStorm(s, "daily")} onBack={goDash} />
      );
      break;
    case "timeMachine":
      body = (
        <TimeMachineScreen
          onPlay={(s) => playStorm(s, "timeMachine")}
          onBack={goDash}
        />
      );
      break;
    case "data":
      body = <DataScreen lastStorm={lastArchived} onBack={goDash} />;
      break;
    case "settings":
      body = (
        <SettingsScreen
          settings={settings}
          onChange={updateSettings}
          onBack={goDash}
        />
      );
      break;
    case "parent":
      body = (
        <ParentScreen
          onBack={goDash}
          onSimplified={() => setView({ name: "simplified" })}
        />
      );
      break;
    case "class":
      body = <ClassScreen onBack={goDash} />;
      break;
    case "simplified":
      body = <SimplifiedScreen onBack={goDash} />;
      break;
    case "missions":
      body = <MissionsMenuScreen onPick={pickMission} onBack={goDash} />;
      break;
    case "water":
      body = <WaterWallScreen onBack={goDash} />;
      break;
    case "call":
      body = <CallToEarthScreen onBack={goDash} />;
      break;
    case "mission":
      body = (
        <MissionScreen
          key={view.storm.id + (view.isDaily ? "-daily" : "")}
          storm={view.storm}
          seed={seedFrom(view.storm.id)}
          isTimeMachine={view.isTimeMachine}
          isDaily={view.isDaily}
          dustStorm={view.dustStorm}
          crewNames={profile.crew}
          showNumbers={settings.showNumbers}
          onExit={goDash}
        />
      );
      break;
    default:
      body = (
        <DashboardScreen
          profile={profile}
          onGo={goRoute}
          onPlayBirthday={(s) => playStorm(s, "birthday")}
        />
      );
  }

  return (
    <div className="app">
      {view.name !== "welcome" && (
        <TopBar
          links={topBarLinks}
          soundOn={settings.soundOn}
          onToggleSound={() => updateSettings({ soundOn: !settings.soundOn })}
        />
      )}
      <main className="app-main">{body}</main>
      <footer className="app-footer">
        <p>
          Data from NASA. Storms are real DONKI events; the Mars base is
          make-believe.
        </p>
      </footer>
    </div>
  );
}
