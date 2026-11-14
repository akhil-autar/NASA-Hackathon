import { useEffect, useMemo, useRef, useState } from "react";
import bolt from "../content/bolt.json";
import crew from "../content/crew.json";
import { RADIATION_BADGE_LIMIT } from "../data/constants";
import { Bolt } from "../components/Bolt";
import { PowerTriangle } from "../components/PowerTriangle";
import { ResultCards } from "../components/ResultCards";
import { Word } from "../components/Word";
import { initialState, runMission } from "../sim/mission";
import { stormStrengthAtHour } from "../sim/storm";
import { RealStormCard } from "../components/RealStormCard";
import type { MissionOutcome, Plan, Storm, TraceRow } from "../sim/types";
import type { CrewNames } from "../storage/profile";

type Phase = "brief" | "guess" | "plan" | "running" | "result";

const START_PLAN: Plan = { lifeSupport: 0.34, shielding: 0.33, science: 0.33 };

interface Props {
  storm: Storm;
  seed: number;
  /** Time Machine missions show the real-storm ending and no dare cards. */
  isTimeMachine?: boolean;
  crewNames?: CrewNames | null;
  onExit?: () => void;
}

export function MissionScreen({
  storm,
  seed,
  isTimeMachine,
  crewNames,
  onExit,
}: Props) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [plan, setPlan] = useState<Plan>(START_PLAN);
  const [guess, setGuess] = useState<"yes" | "no" | null>(null);
  const [hour, setHour] = useState(0);
  const [changed, setChanged] = useState(false);
  const [stormPrompt, setStormPrompt] = useState(false);

  // The full deterministic run, computed once we press Go. We re-run if the
  // child changes the plan mid-storm.
  const [planAtStorm, setPlanAtStorm] = useState<Plan | undefined>(undefined);
  const outcome: MissionOutcome | null = useMemo(() => {
    if (phase !== "running" && phase !== "result") return null;
    return runMission(initialState(), plan, storm, seed, {
      changeAtStorm: planAtStorm,
    });
  }, [phase, plan, planAtStorm, storm, seed]);

  const trace: TraceRow[] = outcome?.trace ?? [];
  const now: TraceRow | undefined = trace[Math.min(hour, trace.length - 1)];

  // Advance one game hour per tick while running.
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== "running") return;
    timer.current = window.setInterval(() => {
      setHour((h) => {
        const next = h + 1;
        // Pause once when the storm arrives, to allow one plan change.
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
  };

  // --- Phase: result ---
  if (phase === "result" && outcome) {
    const guessWasRight =
      (guess === "yes") === (outcome.finalState.battery > 0);
    return (
      <div className="screen">
        <ResultCards outcome={outcome} onPlayAgain={reset} />
        {guess && (
          <p className="guess-check">
            Your guess: the battery would {guess === "yes" ? "last" : "not last"}{" "}
            until morning. It {outcome.finalState.battery > 0 ? "lasted" : "ran out"}.{" "}
            {guessWasRight ? "You were right!" : "Not this time."}
          </p>
        )}
        {isTimeMachine && <RealStormCard storm={storm} />}
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
    return (
      <div className="screen">
        <h2 className="sol-clock">Hour {now.hour} of 24</h2>
        <div className="outpost">
          <Gauge label="Crew comfort" value={now.comfort} />
          <Gauge label="Battery" value={now.battery} />
          <Gauge label="Science" value={now.science} />
          <Gauge label="Radiation badge" value={badgePct} warn />
          <div className={strength > 0 ? "storm-banner on" : "storm-banner"}>
            {strength > 0 ? "☀️ STORM! Particles hitting the base." : "Sky is calm."}
          </div>
        </div>

        {stormPrompt && !changed && (
          <div className="storm-change">
            <Bolt
              autoSpeak
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
        <Bolt text="Set the power. Then press Go." />
        <PowerTriangle
          plan={plan}
          battery={80}
          onChange={setPlan}
        />
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
        <Bolt autoSpeak text="Will the battery last until morning?" />
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

  // --- Phase: brief ---
  return (
    <div className="screen">
      <Bolt autoSpeak text={bolt.intro}>
        A <Word term="flare">storm</Word> is coming from the Sun. You are the
        commander. Share the power wisely.
      </Bolt>

      <div className="crew-row">
        <CrewCard
          name={crewNames?.doctor ?? crew.doctor.defaultName}
          role="Doctor"
          line={crew.doctor.line}
        />
        <CrewCard
          name={crewNames?.engineer ?? crew.engineer.defaultName}
          role="Engineer"
          line={crew.engineer.line}
        />
        <CrewCard
          name={crewNames?.scientist ?? crew.scientist.defaultName}
          role="Scientist"
          line={crew.scientist.line}
        />
      </div>

      <p className="truth-line">{bolt.truth}</p>

      <button
        type="button"
        className="big-button"
        onClick={() => setPhase("guess")}
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
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className="gauge">
      <span className="gauge-label">{label}</span>
      <span className="gauge-bar">
        <span
          className={warn ? "gauge-fill warn" : "gauge-fill"}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
    </div>
  );
}

function CrewCard({
  name,
  role,
  line,
}: {
  name: string;
  role: string;
  line: string;
}) {
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
