import { useEffect, useMemo, useRef, useState } from "react";
import bolt from "../content/bolt.json";
import crew from "../content/crew.json";
import dareContent from "../content/dare-cards.json";
import {
  MARS_MESSAGE_DELAY_MAX,
  MARS_MESSAGE_DELAY_MIN,
  RADIATION_BADGE_LIMIT,
} from "../data/constants";
import { Bolt } from "../components/Bolt";
import { CreditedImage } from "../components/CreditedImage";
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

type Phase = "brief" | "rover" | "guess" | "plan" | "running" | "result";

const START_PLAN: Plan = { lifeSupport: 0.34, shielding: 0.33, science: 0.33 };

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

  // Advance one game hour per tick while running.
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== "running") return;
    timer.current = window.setInterval(() => {
      setHour((h) => {
        const next = h + 1;
        if (next === storm.arrivalHour && !changed) {
          setStormPrompt(true);
          if (timer.current) window.clearInterval(timer.current);
        }
        if (next >= trace.length) {
          if (timer.current) window.clearInterval(timer.current);
          setPhase("result");
          return trace.length - 1;
        }
        return next;
      });
    }, 220);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [phase, trace.length, storm.arrivalHour, changed]);

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
      <div className="screen">
        <ResultCards outcome={outcome} onPlayAgain={reset} />

        {saved && saved.newBadges.length > 0 && (
          <section className="card">
            <h3 className="card-title">New badge!</h3>
            <p className="card-body">
              {saved.newBadges.map((b) => BADGES[b]?.name ?? b).join(", ")}
            </p>
          </section>
        )}

        {guess && (
          <p className="guess-check">
            Your guess: the battery would {guess === "yes" ? "last" : "not last"}{" "}
            until morning. It {batteryLasted ? "lasted" : "ran out"}.{" "}
            {guessWasRight ? "You were right!" : "Not this time."}
          </p>
        )}

        {/* Rewind: try the other way and compare side by side. */}
        <section className="card">
          <h3 className="card-title">Rewind</h3>
          <p className="card-body">Try the other way at the big choice.</p>
          <div className="rewind-buttons">
            <button
              type="button"
              className="big-button ghost"
              onClick={() => setRewindPlan({ lifeSupport: 0.2, shielding: 0.6, science: 0.2 })}
            >
              What if I shielded more?
            </button>
            <button
              type="button"
              className="big-button ghost"
              onClick={() => setRewindPlan({ lifeSupport: 0.3, shielding: 0.2, science: 0.5 })}
            >
              What if I did more science?
            </button>
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

        <ShareCard
          stars={outcome.stars}
          stormDate={storm.peakTime.slice(0, 10)}
          stormLabel={`${storm.flareClass}${storm.magnitude} flare`}
        />

        {onExit && (
          <button type="button" className="big-button ghost" onClick={onExit}>
            Back to dashboard
          </button>
        )}
      </div>
    );
  }

  // --- Phase: running ---
  if (phase === "running" && now) {
    const strength = stormStrengthAtHour(storm, now.hour);
    const badgePct = Math.min(
      100,
      (now.radiationBadge / RADIATION_BADGE_LIMIT.value) * 100,
    );
    const justBeforeStorm = now.hour === storm.arrivalHour - 1;
    return (
      <div className="screen">
        <h2 className="sol-clock">Hour {now.hour} of 24</h2>

        {/* Late warning: the message travels from Earth to Mars. */}
        {justBeforeStorm && (
          <div className="late-warning">
            <Bolt
              autoSpeak={!boltAsleep}
              text="A warning is coming from Earth. It takes a while to reach Mars."
            />
            <div className="signal-track" aria-hidden="true">
              <span className="signal-end">Earth</span>
              <span className="signal" aria-hidden="true" />
              <span className="signal-end">Mars</span>
            </div>
            <p className="source-note">
              A real message takes between {MARS_MESSAGE_DELAY_MIN.value} and{" "}
              {MARS_MESSAGE_DELAY_MAX.value} minutes to reach Mars. The game
              shortens it.
            </p>
          </div>
        )}

        <div className="outpost">
          <Gauge label="Crew comfort" value={now.comfort} showNumbers={showNumbers} unit="" />
          <Gauge label="Battery" value={now.battery} showNumbers={showNumbers} unit="%" />
          <Gauge label="Science" value={now.science} showNumbers={showNumbers} unit=" pts" />
          <Gauge
            label="Radiation badge"
            value={badgePct}
            warn
            showNumbers={showNumbers}
            unit="%"
          />
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
          <div className={strength > 0 ? "storm-banner on" : "storm-banner"}>
            {strength > 0 ? "Storm! Particles hitting the base." : "Sky is calm."}
          </div>
        </div>

        {stormPrompt && !changed && (
          <div className="storm-change">
            <Bolt
              autoSpeak={!boltAsleep}
              text="The storm is here. You can change the power once now."
            />
            <PowerTriangle
              plan={plan}
              battery={now.battery}
              onChange={(p) => setPlanAtStorm(p)}
            />
            <button
              type="button"
              className="big-button"
              onClick={() => {
                setChanged(true);
                setStormPrompt(false);
              }}
            >
              Keep going
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Phase: plan ---
  if (phase === "plan") {
    return (
      <div className="screen">
        {!boltAsleep && <Bolt text="Set the power. Then press Go." />}
        <PowerTriangle plan={plan} battery={80} onChange={setPlan} />
        <button
          type="button"
          className="big-button go"
          onClick={() => {
            setPhase("running");
            setHour(0);
          }}
        >
          Go
        </button>
      </div>
    );
  }

  // --- Phase: guess ---
  if (phase === "guess") {
    return (
      <div className="screen">
        <Bolt autoSpeak={!boltAsleep} text="Will the battery last until morning?" />
        <div className="guess-buttons">
          <button
            type="button"
            className="big-button"
            onClick={() => {
              setGuess("yes");
              setPhase("plan");
            }}
          >
            Yes
          </button>
          <button
            type="button"
            className="big-button"
            onClick={() => {
              setGuess("no");
              setPhase("plan");
            }}
          >
            No
          </button>
        </div>
      </div>
    );
  }

  // --- Phase: rover (daily only) ---
  if (phase === "rover") {
    return (
      <div className="screen">
        <Bolt autoSpeak={!boltAsleep} text="Send the rover out to find rocks. But get it home before the storm!" />
        <RoverTrack
          distance={rover}
          onChange={setRover}
          safeFraction={warningFraction(storm)}
          showNumbers={showNumbers}
        />
        <button
          type="button"
          className="big-button go"
          onClick={() => setPhase("guess")}
        >
          Rover is set
        </button>
      </div>
    );
  }

  // --- Phase: brief ---
  return (
    <div className="screen">
      <Bolt autoSpeak={!boltAsleep} text={bolt.intro}>
        A <Word term="flare">storm</Word> is coming from the Sun. You are the
        commander. Share the power wisely.
      </Bolt>

      <CreditedImage
        file="img/mars-panorama.jpg"
        alt="A wide view of the Mars surface around the outpost."
        className="mission-scene"
      />

      <div className="crew-row">
        <CrewCard name={crewNames?.doctor ?? crew.doctor.defaultName} role="Doctor" line={crew.doctor.line} />
        <CrewCard name={crewNames?.engineer ?? crew.engineer.defaultName} role="Engineer" line={crew.engineer.line} />
        <CrewCard name={crewNames?.scientist ?? crew.scientist.defaultName} role="Scientist" line={crew.scientist.line} />
      </div>

      {isDaily && (
        <section className="card">
          <h3 className="card-title">Dare cards (each adds a star)</h3>
          <div className="dare-row">
            {dareContent.cards.map((c) => (
              <button
                key={c.id}
                type="button"
                className={dares.has(c.id as DareId) ? "dare-chip on" : "dare-chip"}
                onClick={() => toggleDare(c.id as DareId)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <p className="truth-line">{bolt.truth}</p>

      <button
        type="button"
        className="big-button"
        onClick={() => setPhase(isDaily ? "rover" : "guess")}
      >
        I'm ready
      </button>
    </div>
  );
}

function Gauge({
  label,
  value,
  warn,
  showNumbers,
  unit,
}: {
  label: string;
  value: number;
  warn?: boolean;
  showNumbers?: boolean;
  unit?: string;
}) {
  return (
    <div className="gauge">
      <span className="gauge-label">
        {label}
        {showNumbers ? ` — ${Math.round(value)}${unit ?? ""}` : ""}
      </span>
      <span className="gauge-bar">
        <span
          className={warn ? "gauge-fill warn" : "gauge-fill"}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
    </div>
  );
}

function CrewCard({ name, role, line }: { name: string; role: string; line: string }) {
  return (
    <div className="crew-card">
      <div className="crew-portrait" aria-hidden="true">
        {role[0]}
      </div>
      <strong>{name}</strong>
      <span className="crew-role">{role}</span>
      <p>{line}</p>
    </div>
  );
}
