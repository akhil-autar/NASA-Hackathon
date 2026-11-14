import { useEffect, useMemo, useState, type ReactNode } from "react";
import bolt from "../content/bolt.json";
import crew from "../content/crew.json";
import dareContent from "../content/dare-cards.json";
import {
  BATTERY_START,
  COMFORT_OK,
  GREENHOUSE_START,
  LIFE_SUPPORT_HOLD_SHARE,
  MARS_MESSAGE_DELAY_MAX,
  MARS_MESSAGE_DELAY_MIN,
  MISSION_HOURS,
  RADIATION_BADGE_LIMIT,
} from "../data/constants";
import { Bolt } from "../components/Bolt";
import { Button } from "../components/Button";
import { CrewPortrait, type CrewMood, type CrewRole } from "../components/CrewPortrait";
import { MessageView } from "../components/MessageView";
import { OutpostView } from "../components/OutpostView";
import { PowerTriangle } from "../components/PowerTriangle";
import { RealStormCard } from "../components/RealStormCard";
import { ResultCards } from "../components/ResultCards";
import { RoverTrack } from "../components/RoverTrack";
import { ShareCard } from "../components/ShareCard";
import { Stars } from "../components/Stars";
import { Word } from "../components/Word";
import { applyDares, type DareId } from "../sim/dares";
import {
  initialState,
  runMission,
  warningFraction,
} from "../sim/mission";
import { stormStrengthAtHour } from "../sim/storm";
import type { MissionOutcome, Plan, Storm, TraceRow } from "../sim/types";
import { award } from "../storage/award";
import { BADGES, loadProgress, saveProgress } from "../storage/progress";
import type { CrewNames } from "../storage/profile";
import { useCan3D } from "../three/capability";
import type { OutpostShot, OutpostVisual } from "../three/types";

type Phase = "brief" | "rover" | "guess" | "plan" | "running" | "result";

const START_PLAN: Plan = { lifeSupport: 0.34, shielding: 0.33, science: 0.33 };

/** One game hour takes this long on screen, so the child can watch the base. */
const TICK_MS = 900;
/** How long the clock pauses while the warning travels from Earth to Mars. */
const WARNING_MS = 3200;

/** Which part of the base each crew member cares about. */
const ROLE_SHOT: Record<CrewRole, OutpostShot> = {
  doctor: "shelter",
  engineer: "habitat",
  scientist: "rover",
};

interface Props {
  storm: Storm;
  seed: number;
  /** Time Machine missions show the real-storm ending and no dare cards. */
  isTimeMachine?: boolean;
  /** Daily mission allows dare cards and the rover run. */
  isDaily?: boolean;
  /** Dust storm: the panels are dimmed for the whole mission. */
  dustStorm?: boolean;
  crewNames?: CrewNames | null;
  showNumbers?: boolean;
  onExit?: () => void;
}

export function MissionScreen({
  storm: rawStorm,
  seed,
  isTimeMachine,
  isDaily,
  dustStorm,
  crewNames,
  showNumbers,
  onExit,
}: Props) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [plan, setPlan] = useState<Plan>(START_PLAN);
  const [guess, setGuess] = useState<"yes" | "no" | null>(null);
  const [hour, setHour] = useState(0);
  const [changed, setChanged] = useState(false);
  const [stormPrompt, setStormPrompt] = useState(false);
  const [rover, setRover] = useState(0.3);
  const [dares, setDares] = useState<Set<DareId>>(new Set());
  const [planAtStorm, setPlanAtStorm] = useState<Plan | undefined>(undefined);
  const [rewindPlan, setRewindPlan] = useState<Plan | null>(null);
  const [saved, setSaved] = useState<{ newBadges: string[]; logLine: string } | null>(
    null,
  );
  // The late warning: the clock pauses while the message travels to Mars.
  const [warning, setWarning] = useState(false);
  const [warned, setWarned] = useState(false);
  // Tapping a crew member points the camera at their part of the base.
  const [focus, setFocus] = useState<CrewRole | null>(null);
  const can3D = useCan3D();

  const dareList = [...dares];
  const boltAsleep = dares.has("boltAsleep");

  // Apply dare-card effects to the storm/options (daily only).
  const { storm, opts } = useMemo(() => {
    if (isDaily && dares.size > 0) return applyDares(dareList, rawStorm, seed);
    return { storm: rawStorm, opts: {} as ReturnType<typeof applyDares>["opts"] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDaily, dares, rawStorm, seed]);

  const dustScale = dustStorm ? 0.45 : undefined;
  const outcome: MissionOutcome | null = useMemo(() => {
    if (phase !== "running" && phase !== "result") return null;
    return runMission(initialState(), plan, storm, seed, {
      ...opts,
      solarScale: dustScale ?? opts.solarScale,
      changeAtStorm: planAtStorm,
      rover: isDaily ? { distance: rover } : undefined,
    });
  }, [phase, plan, planAtStorm, storm, seed, opts, rover, isDaily, dustScale]);

  // The "other way" rewind run, for the side-by-side compare.
  const rewindOutcome: MissionOutcome | null = useMemo(() => {
    if (!rewindPlan || !outcome) return null;
    return runMission(initialState(), rewindPlan, storm, seed, {
      ...opts,
      rover: isDaily ? { distance: rover } : undefined,
    });
  }, [rewindPlan, outcome, storm, seed, opts, rover, isDaily]);

  const trace: TraceRow[] = outcome?.trace ?? [];
  const now: TraceRow | undefined = trace[Math.min(hour, trace.length - 1)];

  // Save progress once, when we reach the result.
  useEffect(() => {
    if (phase === "result" && outcome && !saved) {
      const sol = loadProgress().missionsPlayed + 1;
      const res = award(loadProgress(), outcome, plan, isDaily ? dareList : [], sol);
      saveProgress(res.progress);
      setSaved({ newBadges: res.newBadges, logLine: res.logLine });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, outcome, saved]);

  // Advance one game hour per tick while running. The clock pauses while the
  // warning travels from Earth and while the child changes the plan.
  const paused = warning || (stormPrompt && !changed);
  useEffect(() => {
    if (phase !== "running" || paused) return;
    const id = window.setInterval(() => {
      setHour((h) => {
        const next = h + 1;
        if (next === storm.arrivalHour - 1 && !warned && storm.arrivalHour > 2) {
          setWarning(true);
        }
        if (next === storm.arrivalHour && !changed) {
          setStormPrompt(true);
        }
        if (next >= trace.length) {
          setPhase("result");
          return trace.length - 1;
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, paused, trace.length, storm.arrivalHour, changed, warned]);

  useEffect(() => {
    if (!warning) return;
    const id = window.setTimeout(() => {
      setWarned(true);
      setWarning(false);
    }, WARNING_MS);
    return () => window.clearTimeout(id);
  }, [warning]);

  const reset = () => {
    setPhase("brief");
    setPlan(START_PLAN);
    setGuess(null);
    setHour(0);
    setChanged(false);
    setStormPrompt(false);
    setPlanAtStorm(undefined);
    setRewindPlan(null);
    setSaved(null);
    setWarning(false);
    setWarned(false);
    setFocus(null);
  };

  const toggleDare = (id: DareId) => {
    setDares((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Phase: result ---
  if (phase === "result" && outcome) {
    const batteryLasted = outcome.finalState.battery > 0;
    const guessWasRight = (guess === "yes") === batteryLasted;
    return (
      <div className="result-screen">
        <div className="result-head">
          <Stars count={outcome.stars} />
          <h2>{outcome.success ? "Mission complete" : "The crew flew home early"}</h2>
        </div>

        <OutpostView
          className="result-scene"
          visual={{
            lifeSupport: (planAtStorm ?? plan).lifeSupport,
            shielding: (planAtStorm ?? plan).shielding,
            science: (planAtStorm ?? plan).science,
            battery: outcome.finalState.battery,
            greenhouse: outcome.finalState.greenhouse,
            storm: 0,
            dust: !!dustStorm,
            hour: 3, // the next morning

            crewSheltered: true,
            shot: "result",
          }}
        />

        <ResultCards outcome={outcome} onPlayAgain={reset} />

        {saved && saved.newBadges.length > 0 && (
          <section className="panel">
            <h3>New badge</h3>
            <p>{saved.newBadges.map((b) => BADGES[b]?.name ?? b).join(", ")}</p>
          </section>
        )}

        {guess && (
          <p className="panel guess-check">
            Your guess: the battery would {guess === "yes" ? "last" : "not last"}{" "}
            until morning. It {batteryLasted ? "lasted" : "ran out"}.{" "}
            {guessWasRight ? "You were right!" : "Not this time."}
          </p>
        )}

        {/* Rewind: try the other way and compare side by side. */}
        <section className="panel">
          <h3>Rewind</h3>
          <p>Try the other way at the big choice.</p>
          <div className="button-row">
            <Button
              onClick={() => setRewindPlan({ lifeSupport: 0.2, shielding: 0.6, science: 0.2 })}
            >
              What if I shielded more?
            </Button>
            <Button
              onClick={() => setRewindPlan({ lifeSupport: 0.3, shielding: 0.2, science: 0.5 })}
            >
              What if I did more science?
            </Button>
          </div>
          {rewindOutcome && (
            <div className="compare">
              <div className="compare-col">
                <strong>Your plan</strong>
                <Stars count={outcome.stars} />
              </div>
              <div className="compare-col">
                <strong>The other way</strong>
                <Stars count={rewindOutcome.stars} />
              </div>
            </div>
          )}
        </section>

        {isTimeMachine && <RealStormCard storm={storm} />}

        <div className="button-row">
          <ShareCard
            stars={outcome.stars}
            stormDate={storm.peakTime.slice(0, 10)}
            stormLabel={`${storm.flareClass}${storm.magnitude} flare`}
          />
          <Button variant="primary" onClick={reset}>
            Play again
          </Button>
          {onExit && <Button onClick={onExit}>Back to dashboard</Button>}
        </div>
      </div>
    );
  }

  // --- Every other phase shares one stage: crew | 3D outpost | controls ---
  const running = phase === "running" && !!now;
  const strength = running ? stormStrengthAtHour(storm, now.hour) : 0;
  const activePlan =
    running && planAtStorm && (changed || stormPrompt) && now.hour >= storm.arrivalHour
      ? planAtStorm
      : plan;
  const badgePct = running
    ? Math.min(100, (now.radiationBadge / RADIATION_BADGE_LIMIT.value) * 100)
    : 0;

  // What the 3D scene shows. Every value is game state. While planning, the
  // scene previews the plan live so the child sees each trade-off before Go.
  const previewGreenhouse = Math.max(
    15,
    Math.min(100, (plan.lifeSupport / LIFE_SUPPORT_HOLD_SHARE.value) * 80),
  );
  const baseShot: OutpostShot = running
    ? strength > 0 || stormPrompt
      ? "shelter"
      : "wide"
    : phase === "brief"
      ? "intro"
      : phase === "rover"
        ? "rover"
        : "wide";
  const visual: OutpostVisual = {
    lifeSupport: activePlan.lifeSupport,
    shielding: activePlan.shielding,
    science: activePlan.science,
    battery: running ? now.battery : BATTERY_START.value,
    greenhouse: running
      ? now.greenhouse
      : phase === "plan"
        ? previewGreenhouse
        : GREENHOUSE_START.value,
    storm: strength,
    dust: !!dustStorm || dares.has("dustyPanels" as DareId),
    hour: running ? now.hour : 0,
    crewSheltered: running ? now.crewSheltered : true,
    roverOut: phase === "rover" ? rover : undefined,
    shot: focus && !running ? ROLE_SHOT[focus] : baseShot,
  };

  const mood: CrewMood = running
    ? now.comfort < COMFORT_OK.value
      ? "cold"
      : strength > 0
        ? "worried"
        : "calm"
    : "calm";

  const title = dustStorm
    ? "Dust storm"
    : `Solar storm, ${storm.peakTime.slice(0, 10)}`;

  // --- What Bolt says, the controls, and the one main button, per phase ---
  let boltText = bolt.intro;
  let boltExpression: "happy" | "thinking" | "worried" | "asleep" = "happy";
  let boltRich: ReactNode = null;
  let controls: ReactNode = null;
  let action: ReactNode = null;

  if (phase === "brief") {
    boltExpression = boltAsleep ? "asleep" : "happy";
    boltRich = (
      <>
        A <Word term="flare">storm</Word> is coming from the Sun. You are the
        commander. Share the power wisely.
      </>
    );
    controls = (
      <>
        {isDaily && (
          <section className="panel">
            <h3>Dare cards</h3>
            <p className="quiet">Each one adds a star.</p>
            <div className="dare-row">
              {dareContent.cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={dares.has(c.id as DareId)}
                  className={dares.has(c.id as DareId) ? "dare-chip on" : "dare-chip"}
                  onClick={() => toggleDare(c.id as DareId)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>
        )}
        <p className="quiet">{bolt.truth}</p>
      </>
    );
    action = (
      <Button variant="primary" large onClick={() => setPhase(isDaily ? "rover" : "guess")}>
        I'm ready
      </Button>
    );
  } else if (phase === "rover") {
    boltText = "Send the rover out to find rocks. But get it home before the storm!";
    // Compare the trip home with the time until the storm. The rover is "too
    // far" exactly when its distance passes the warning fraction (the sim's
    // roverCaughtOutside rule). Shown in whole game hours so it reads simply.
    const warnHours = Math.round(warningFraction(storm) * MISSION_HOURS.value);
    const tripHours = Math.max(1, Math.round(rover * MISSION_HOURS.value));
    const tooFar = rover > warningFraction(storm);
    controls = (
      <section className="panel">
        <RoverTrack
          distance={rover}
          onChange={setRover}
          safeFraction={warningFraction(storm)}
          showNumbers={showNumbers}
        />
        <p className={tooFar ? "rover-trip warn" : "rover-trip"}>
          Trip home: about {tripHours} {tripHours === 1 ? "hour" : "hours"}. The
          warning gives you {warnHours} {warnHours === 1 ? "hour" : "hours"}.{" "}
          {tooFar
            ? "The rover can't get back in time."
            : "The rover gets back before the storm."}
        </p>
        {can3D && (
          <p className="quiet">Drag the rover in the scene or use the slider.</p>
        )}
      </section>
    );
    action = (
      <Button variant="primary" large onClick={() => setPhase("guess")}>
        Rover is set
      </Button>
    );
  } else if (phase === "guess") {
    boltText = "Will the battery last until morning?";
    boltExpression = "thinking";
    controls = (
      <section className="panel guess-panel">
        <h3>Make your guess</h3>
        <div className="button-row">
          <Button
            large
            onClick={() => {
              setGuess("yes");
              setPhase("plan");
            }}
          >
            Yes, it will last
          </Button>
          <Button
            large
            onClick={() => {
              setGuess("no");
              setPhase("plan");
            }}
          >
            No, it will run out
          </Button>
        </div>
      </section>
    );
  } else if (phase === "plan") {
    boltText = "Drag the dot to share the power. Watch the base change. Then press Go.";
    boltExpression = "thinking";
    controls = (
      <section className="panel">
        <PowerTriangle plan={plan} battery={BATTERY_START.value} onChange={setPlan} />
      </section>
    );
    action = (
      <Button
        variant="primary"
        large
        onClick={() => {
          setFocus(null);
          setPhase("running");
          setHour(0);
        }}
      >
        Go
      </Button>
    );
  } else if (running) {
    boltExpression = strength > 0 || warning ? "worried" : "happy";
    boltText = warning
      ? "A warning is coming from Earth. It takes a while to reach Mars."
      : stormPrompt && !changed
        ? "The storm is here. You can change the power once now."
        : strength > 0
          ? "Storm! Tiny fast particles are hitting the base."
          : "The sky is calm. The base is working.";
    controls =
      stormPrompt && !changed ? (
        <section className="panel storm-change">
          <h3>Change the power?</h3>
          <PowerTriangle
            plan={planAtStorm ?? plan}
            battery={now.battery}
            onChange={(p) => setPlanAtStorm(p)}
          />
        </section>
      ) : (
        <section className="panel outpost">
          <Gauge label="Crew comfort" value={now.comfort} showNumbers={showNumbers} unit="" />
          <Gauge label="Battery" value={now.battery} showNumbers={showNumbers} unit="%" tone="accent" />
          <Gauge label="Science" value={now.science} showNumbers={showNumbers} unit=" pts" tone="science" />
          <Gauge label="Radiation badge" value={badgePct} warn showNumbers={showNumbers} unit="%" />
          <div className="greenhouse-row">
            <span>Greenhouse</span>
            <span>
              {now.greenhouse > 60
                ? "Plants healthy"
                : now.greenhouse > 30
                  ? "Plants drooping"
                  : "Plants wilting"}
            </span>
          </div>
        </section>
      );
    if (stormPrompt && !changed) {
      action = (
        <Button
          variant="primary"
          large
          onClick={() => {
            setChanged(true);
            setStormPrompt(false);
          }}
        >
          Keep going
        </Button>
      );
    }
  }

  return (
    <div className={`mission phase-${phase}`}>
      <div className="mission-head">
        {onExit && (
          <button type="button" className="topbar-link" onClick={onExit}>
            Back
          </button>
        )}
        <h2 className="mission-title">{title}</h2>
        <span className="sol-clock" aria-live="off">
          {running ? `Hour ${now.hour} of ${MISSION_HOURS.value}` : "Before the storm"}
        </span>
      </div>

      <aside className="mission-crew" aria-label="Your crew">
        {CREW.map((c) => (
          <CrewCard
            key={c.role}
            role={c.role}
            name={crewNames?.[c.role] ?? c.defaultName}
            line={c.line}
            mood={mood}
            selected={focus === c.role}
            onSelect={() => setFocus((f) => (f === c.role ? null : c.role))}
          />
        ))}
      </aside>

      <OutpostView
        visual={visual}
        className="mission-stage"
        onRoverDrag={phase === "rover" ? setRover : undefined}
      >
        {running && (
          <span className={strength > 0 ? "stage-chip danger" : "stage-chip"}>
            {strength > 0 ? "Storm" : "Calm"}
          </span>
        )}
        {warning && (
          <div className="stage-warning panel">
            {can3D ? (
              <MessageView loopSeconds={WARNING_MS / 1000} />
            ) : (
              <div className="signal-track" aria-hidden="true">
                <span className="signal-end">Earth</span>
                <span className="signal" />
                <span className="signal-end">Mars</span>
              </div>
            )}
            <p className="quiet">
              A real message takes between {MARS_MESSAGE_DELAY_MIN.value} and{" "}
              {MARS_MESSAGE_DELAY_MAX.value} minutes to reach Mars. The game
              shortens it.
            </p>
          </div>
        )}
      </OutpostView>

      <div className="mission-controls">{controls}</div>

      <div className="mission-bolt">
        <Bolt
          key={boltText}
          autoSpeak={!boltAsleep}
          expression={boltAsleep ? "asleep" : boltExpression}
          text={boltText}
        >
          {boltRich}
        </Bolt>
        {action && <div className="mission-action">{action}</div>}
      </div>
    </div>
  );
}

// Crew config for the brief, pulling names/lines from the (frozen) content.
const CREW = [
  { role: "doctor" as const, defaultName: crew.doctor.defaultName, line: crew.doctor.line },
  { role: "engineer" as const, defaultName: crew.engineer.defaultName, line: crew.engineer.line },
  { role: "scientist" as const, defaultName: crew.scientist.defaultName, line: crew.scientist.line },
];

function Gauge({
  label,
  value,
  warn,
  showNumbers,
  unit,
  tone,
}: {
  label: string;
  value: number;
  warn?: boolean;
  showNumbers?: boolean;
  unit?: string;
  tone?: "accent" | "science";
}) {
  return (
    <div className="gauge">
      <span className="gauge-label">
        {label}
        {showNumbers ? ` — ${Math.round(value)}${unit ?? ""}` : ""}
      </span>
      <span className="gauge-bar">
        <span
          className={warn ? "gauge-fill warn" : tone ? `gauge-fill ${tone}` : "gauge-fill"}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
    </div>
  );
}

const ROLE_LABEL: Record<CrewRole, string> = {
  doctor: "Doctor",
  engineer: "Engineer",
  scientist: "Scientist",
};

function CrewCard({
  name,
  role,
  line,
  mood,
  selected,
  onSelect,
}: {
  name: string;
  role: CrewRole;
  line: string;
  mood: CrewMood;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={selected ? "crew-card selected" : "crew-card"}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <CrewPortrait role={role} name={name} mood={mood} />
      <span className="crew-text">
        <strong>{name}</strong>
        <span className="crew-role">{ROLE_LABEL[role]}</span>
        <span className="crew-line">{line}</span>
      </span>
    </button>
  );
}
