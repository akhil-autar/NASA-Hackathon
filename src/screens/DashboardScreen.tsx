import { Bolt } from "../components/Bolt";
import { CreditedImage } from "../components/CreditedImage";
import { nearestStorm, ARCHIVE_START_YEAR } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";
import type { Profile } from "../storage/profile";

export type DashRoute = "today" | "timeMachine" | "data" | "birthday";

interface Props {
  profile: Profile;
  onGo: (route: DashRoute) => void;
  onPlayBirthday: (storm: ArchivedStorm, note: string) => void;
}

export function DashboardScreen({ profile, onGo, onPlayBirthday }: Props) {
  const birthday = profile.birthday;
  const near = birthday ? nearestStorm(birthday) : undefined;

  const playBirthday = () => {
    if (!near) return;
    let note: string;
    if (near.shiftedYear) {
      note = `NASA's storm diary starts in ${ARCHIVE_START_YEAR}. Here is the same day that year.`;
    } else if (near.daysAway === 0) {
      note = "This is what the Sun did on your birthday.";
    } else {
      note = `The Sun was calm on your birthday. ${near.daysAway} day${
        near.daysAway === 1 ? "" : "s"
      } away, it did this.`;
    }
    onPlayBirthday(near.storm, note);
  };

  return (
    <div className="screen dashboard">
      <Bolt text="Welcome back, Commander. What shall we do?" />

      <CreditedImage
        file="img/base-site-map.jpg"
        alt="Mars from above: Jezero Crater, a real landing site. Our base sits here."
        className="base-map"
      />

      <div className="dash-grid">
        <button type="button" className="dash-card" onClick={() => onGo("today")}>
          <span className="dash-emoji">☀️</span>
          Today's Sun
        </button>
        <button
          type="button"
          className="dash-card"
          onClick={() => onGo("timeMachine")}
        >
          <span className="dash-emoji">🕹️</span>
          Storm Time Machine
        </button>
        {near && (
          <button type="button" className="dash-card" onClick={playBirthday}>
            <span className="dash-emoji">🎂</span>
            What was the Sun doing on your birthday?
          </button>
        )}
        <button type="button" className="dash-card" onClick={() => onGo("data")}>
          <span className="dash-emoji">🛰️</span>
          Our NASA data
        </button>
      </div>
    </div>
  );
}
