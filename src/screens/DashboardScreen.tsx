import { Bolt } from "../components/Bolt";
import { CreditedImage } from "../components/CreditedImage";
import { Stars } from "../components/Stars";
import { nearestStorm, ARCHIVE_START_YEAR } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";
import type { Profile } from "../storage/profile";
import { BADGES, loadProgress } from "../storage/progress";

export type DashRoute =
  | "today"
  | "timeMachine"
  | "missions"
  | "data"
  | "settings"
  | "parent"
  | "class";

interface Props {
  profile: Profile;
  onGo: (route: DashRoute) => void;
  onPlayBirthday: (storm: ArchivedStorm) => void;
}

export function DashboardScreen({ profile, onGo, onPlayBirthday }: Props) {
  const birthday = profile.birthday;
  const near = birthday ? nearestStorm(birthday) : undefined;
  const progress = loadProgress();

  return (
    <div className="screen dashboard">
      <Bolt text="Welcome back, Commander. What shall we do?" />

      <CreditedImage
        file="img/base-site-map.jpg"
        alt="Mars from above: Jezero Crater, a real landing site. Our base sits here."
        className="base-map"
      />

      {/* Stars and badges */}
      <section className="card">
        <div className="stars-row">
          <strong>Stars earned: {progress.totalStars}</strong>
          <Stars count={Math.min(3, progress.totalStars)} />
        </div>
        {progress.badges.length > 0 && (
          <div className="badge-row">
            {progress.badges.map((b) => (
              <span key={b} className="badge" title={BADGES[b]?.name ?? b}>
                {BADGES[b]?.emoji ?? "🏅"}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="dash-grid">
        <button type="button" className="dash-card" onClick={() => onGo("today")}>
          <span className="dash-emoji">☀️</span>
          Today's Sun
        </button>
        <button type="button" className="dash-card" onClick={() => onGo("timeMachine")}>
          <span className="dash-emoji">🕹️</span>
          Storm Time Machine
        </button>
        <button type="button" className="dash-card" onClick={() => onGo("missions")}>
          <span className="dash-emoji">🧪</span>
          More missions
        </button>
        {near && (
          <button
            type="button"
            className="dash-card"
            onClick={() => onPlayBirthday(near.storm)}
          >
            <span className="dash-emoji">🎂</span>
            Sun on your birthday
          </button>
        )}
        <button type="button" className="dash-card" onClick={() => onGo("class")}>
          <span className="dash-emoji">👩‍🏫</span>
          Class mode
        </button>
        <button type="button" className="dash-card" onClick={() => onGo("parent")}>
          <span className="dash-emoji">👪</span>
          For grown-ups
        </button>
        <button type="button" className="dash-card" onClick={() => onGo("data")}>
          <span className="dash-emoji">🛰️</span>
          Our NASA data
        </button>
        <button type="button" className="dash-card" onClick={() => onGo("settings")}>
          <span className="dash-emoji">⚙️</span>
          Settings
        </button>
      </div>

      {/* Commander's log */}
      {progress.log.length > 0 && (
        <section className="card">
          <h3 className="card-title">Commander's log</h3>
          <ul className="log-list">
            {[...progress.log]
              .slice(-5)
              .reverse()
              .map((e, i) => (
                <li key={i}>{e.text}</li>
              ))}
          </ul>
        </section>
      )}

      {near?.shiftedYear && (
        <p className="source-note">
          NASA's storm diary starts in {ARCHIVE_START_YEAR}, so your birthday
          storm uses that year.
        </p>
      )}
    </div>
  );
}
