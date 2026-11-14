import { useState } from "react";
import { Bolt } from "../components/Bolt";
import { Button } from "../components/Button";
import { SunView } from "../components/SunView";
import { Stars } from "../components/Stars";
import { StormTimeline } from "../components/StormTimeline";
import { nearestStorm, ARCHIVE_START_YEAR } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";
import { strengthWords, useToday } from "../data/useToday";
import type { Profile } from "../storage/profile";
import { BADGES, loadProgress } from "../storage/progress";
import { useCan3D } from "../three/capability";
import { activityFor } from "../three/types";

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
  onPlayStorm: (storm: ArchivedStorm, live: boolean) => void;
  onPlayBirthday: (storm: ArchivedStorm) => void;
}

export function DashboardScreen({
  profile,
  onGo,
  onPlayStorm,
  onPlayBirthday,
}: Props) {
  const near = profile.birthday ? nearestStorm(profile.birthday) : undefined;
  const progress = loadProgress();
  const { data, status } = useToday();
  const [logOpen, setLogOpen] = useState(false);
  // The storm under the Time Machine handle. While set, the Sun shows it.
  const [scrubbed, setScrubbed] = useState<ArchivedStorm | null>(null);
  const can3D = useCan3D();

  const storm = data?.storm ?? null;
  const strength = storm
    ? strengthWords(storm.flareClass, storm.magnitude)
    : null;

  const todayLine =
    status === "loading"
      ? "Asking NASA what the Sun is doing."
      : storm && data?.live && data.daysAgo === 0
        ? `The Sun made ${strength} today.`
        : storm && data?.quiet
          ? `The Sun is quiet today. The last real storm was ${strength}.`
          : storm
            ? `The newest real storm was ${strength}.`
            : "No storm to show right now.";

  // The Sun shows the storm under the timeline handle, or else today's storm.
  const shown = scrubbed ?? storm;
  const shownWords = shown ? strengthWords(shown.flareClass, shown.magnitude) : null;
  const sunCaption = scrubbed
    ? `${scrubbed.peakTime.slice(0, 10)}: ${shownWords}`
    : status === "loading"
      ? "Looking at the Sun"
      : storm && data?.live && data.daysAgo === 0
        ? `Today: ${shownWords}`
        : storm
          ? `${storm.peakTime.slice(0, 10)}: ${shownWords}`
          : "The Sun is quiet";
  const sunDescription = shown
    ? `The Sun. ${sunCaption}. Flare class ${shown.flareClass}${shown.magnitude}.`
    : "The Sun, quiet.";
  const sunVisual = {
    activity: activityFor(shown?.flareClass ?? null, shown?.magnitude ?? 0),
    seed: shown ? Date.parse(shown.peakTime) % 100000 : 1,
  };

  return (
    <div className="dashboard">
      <div className="dash-top">
        <SunView visual={sunVisual} description={sunDescription} className="dash-sun">
          <div className="sun-caption">
            <span className="sun-caption-main">{sunCaption}</span>
            {shown && (
              <span className="quiet">
                Real flare, class {shown.flareClass}
                {shown.magnitude}
              </span>
            )}
          </div>
          {can3D && <span className="sun-hint quiet">Drag to turn the Sun</span>}
        </SunView>

        <div className="dash-side">
          <Bolt text="Welcome back, Commander." expression="happy" />

          <section className="panel dash-today">
            <h2>Today's Sun</h2>
            <p>{todayLine}</p>
            {status === "error" && storm ? (
              <p className="quiet offline-note" role="status">
                NASA's data could not be reached. Showing an archived storm.
              </p>
            ) : (
              !data?.live &&
              storm &&
              status !== "loading" && (
                <p className="quiet">Showing an archived storm.</p>
              )
            )}
            <Button
              variant="primary"
              large
              block
              disabled={!storm}
              onClick={() => storm && onPlayStorm(storm, !!data?.live)}
            >
              Start today's mission
            </Button>
          </section>

          <div className="dash-side-row">
            {near && (
              <button
                type="button"
                className="panel dash-mini"
                onClick={() => onPlayBirthday(near.storm)}
              >
                <span className="dash-mini-title">Your birthday Sun</span>
                <span className="quiet">
                  {near.storm.flareClass}
                  {near.storm.magnitude} · {near.storm.peakTime.slice(0, 10)}
                </span>
              </button>
            )}
            <button
              type="button"
              className="panel dash-mini"
              onClick={() => onGo("missions")}
            >
              <span className="dash-mini-title">More missions</span>
              <span className="quiet">Dust, water, Earth</span>
            </button>
          </div>
        </div>
      </div>

      <section className="panel dash-timeline">
        <h2>Storm Time Machine</h2>
        <StormTimeline onPick={(s) => onPlayStorm(s, false)} onScrub={setScrubbed} />
      </section>

      <section className="panel dash-stats">
        <div className="dash-stats-main">
          <span className="dash-stars">
            Stars <strong>{progress.totalStars}</strong>
          </span>
          <Stars count={Math.min(3, progress.totalStars)} />
          {progress.badges.length > 0 && (
            <div className="badge-block">
              <span className="badge-label">Badges</span>
              <div className="badge-row">
                {progress.badges.map((b) => (
                  <span key={b} className="badge">
                    {BADGES[b]?.name ?? b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        {progress.log.length > 0 && (
          <div className="dash-log">
            <button
              type="button"
              className="topbar-link"
              onClick={() => setLogOpen((o) => !o)}
              aria-expanded={logOpen}
            >
              Commander's log
            </button>
            {logOpen && (
              <ul className="log-list">
                {[...progress.log].slice(-5).reverse().map((e, i) => (
                  <li key={i}>{e.text}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {near?.shiftedYear && (
        <p className="quiet dash-note">
          NASA's storm diary starts in {ARCHIVE_START_YEAR}, so your birthday
          storm uses that year.
        </p>
      )}
    </div>
  );
}
