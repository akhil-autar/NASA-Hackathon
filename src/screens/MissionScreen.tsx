import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { AvatarFigure } from "../avatar/AvatarFigure";
import { SUITS, VISORS, type AvatarLook } from "../avatar/look";
import { Bolt } from "../components/Bolt";
import { GameOver } from "../components/GameOver";
import { HowToPlay, howToSeen, markHowToSeen } from "../components/HowToPlay";
import { PowerCubes } from "../components/PowerCubes";
import { QuizPop } from "../components/QuizPop";
import { quizFor } from "../content/quiz";
import { useLang, useT, useTx, type Key } from "../i18n";
import { explain } from "../sim/explain";
import { roverCaughtOutside } from "../sim/mission";
import { isSpeaking } from "../speech/speak";
import { Button } from "../components/Button";
import { CrewPortrait, type CrewMood, type CrewRole } from "../components/CrewPortrait";
import { MessageView } from "../components/MessageView";
import { OutpostView } from "../components/OutpostView";
import { PowerTriangle } from "../components/PowerTriangle";
import { RealStormCard } from "../components/RealStormCard";
import { EarthImpactCard } from "../components/EarthImpactCard";
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
import type { OutpostShot, OutpostVisual, PlayerVisual } from "../three/types";

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
  /** The player's own astronaut. */
  look: AvatarLook;
  onExit?: () => void;
}

/** Storm size in words (translation key), from the real flare class. */
function stormWordKey(storm: Storm): Key {
  if (storm.flareClass === "M") return "storm.medium";
  return storm.magnitude >= 5 ? "storm.giant" : "storm.strong";
}

export function MissionScreen({
  storm: rawStorm,
  seed,
  isTimeMachine,
  isDaily,
  dustStorm,
  crewNames,
  showNumbers,
  look,
  onExit,
}: Props) {
  const t = useT();
  const tx = useTx();
  const lang = useLang();
  // Kid-friendly controls: 10 power cubes (the triangle stays as an option).
  const [cubesLeft, setCubesLeft] = useState(10);
  const [stormCubesLeft, setStormCubesLeft] = useState(0);
  const [useTriangle, setUseTriangle] = useState(false);
  // The picture guide shows before the very first mission, and from the ? button.
  const [showHowTo, setShowHowTo] = useState(() => !howToSeen());
  // Bolt's quick question: once per mission, in a calm moment.
  const [quizState, setQuizState] = useState<"pending" | "open" | "done">("pending");
  const [brainStar, setBrainStar] = useState(false);
  const question = useMemo(() => quizFor(seed), [seed]);
  const [phase, setPhase] = useState<Phase>("brief");
  // Game over: first the astronaut falls in the scene, then the card, and the
  // child can open the full result details from there.
  const [goStage, setGoStage] = useState<"fall" | "card" | "details">("fall");
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
  const quizHour = useMemo(() => {
    if (storm.arrivalHour > 6) return 3;
    const after = storm.arrivalHour + storm.durationHours + 2;
    return after < MISSION_HOURS.value - 2 ? after : -1;
  }, [storm.arrivalHour, storm.durationHours]);
  const paused = warning || (stormPrompt && !changed) || quizState === "open" || showHowTo;
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
        if (next === quizHour) {
          setQuizState((q) => (q === "pending" ? "open" : q));
        }
        if (next >= trace.length) {
          setPhase("result");
          return trace.length - 1;
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, paused, trace.length, storm.arrivalHour, changed, warned, quizHour]);

  // The warning stays up for at least WARNING_MS, and until Bolt has finished
  // saying it (so the next line never cuts Bolt off), up to 9 seconds.
  useEffect(() => {
    if (!warning) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - started;
      if (elapsed >= WARNING_MS && (!isSpeaking() || elapsed > 9000)) {
        window.clearInterval(id);
        setWarned(true);
        setWarning(false);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [warning]);

  // What really happened, in words (only once the mission is over).
  const explanation = useMemo(() => {
    if (phase !== "result" || !outcome) return null;
    return explain({
      outcome,
      plan,
      planAtStorm,
      storm,
      roverCaught: !!isDaily && roverCaughtOutside(storm, rover),
      stormWordKey: stormWordKey(storm),
    });
  }, [phase, outcome, plan, planAtStorm, storm, isDaily, rover]);

  // Game over: let the fall play in the scene before the card appears.
  useEffect(() => {
    if (explanation?.kind !== "gameOver" || goStage !== "fall") return;
    const id = window.setTimeout(() => setGoStage("card"), 3000);
    return () => window.clearTimeout(id);
  }, [explanation, goStage]);

  const player = (state: PlayerVisual["state"]): PlayerVisual => ({
    suit: SUITS[look.suit].color,
    trim: SUITS[look.suit].trim,
    visor: VISORS[look.visor],
    extra: look.extra,
    state,
  });
  const playerName = look.name || t("avatar.defaultName");

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
    setGoStage("fall");
    setCubesLeft(10);
    setStormCubesLeft(0);
    setQuizState("pending");
    setBrainStar(false);
  };

  const toggleDare = (id: DareId) => {
    setDares((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Phase: game over (the storm got you, or the base froze) ---
  if (phase === "result" && outcome && explanation?.kind === "gameOver" && goStage !== "details") {
    const radiationCause = explanation.cause === "radiation" || explanation.cause === "caught";
    return (
      <div className={radiationCause ? "game-over-screen" : "game-over-screen cold"}>
        <OutpostView
          className="game-over-scene"
          visual={{
            lifeSupport: (planAtStorm ?? plan).lifeSupport,
            shielding: (planAtStorm ?? plan).shielding,
            science: (planAtStorm ?? plan).science,
            battery: outcome.finalState.battery,
            greenhouse: outcome.finalState.greenhouse,
            storm: radiationCause ? 3 : 0,
            dust: !!dustStorm,
            hour: radiationCause ? 10 : 17,
            crewSheltered: true,
            shot: "fall",
            player: player("down"),
          }}
        >
          <span className="stage-chip danger">{radiationCause ? t("chip.storm") : "❄"}</span>
        </OutpostView>
        {goStage === "card" && (
          <GameOver
            explanation={explanation}
            look={look}
            onTryAgain={reset}
            onDetails={() => setGoStage("details")}
          />
        )}
      </div>
    );
  }

  // --- Phase: result ---
  if (phase === "result" && outcome && explanation) {
    const batteryLasted = outcome.finalState.battery > 0;
    const guessWasRight = (guess === "yes") === batteryLasted;
    const headline =
      explanation.kind === "win"
        ? t("r.complete")
        : explanation.kind === "noScience"
          ? t("r.partial")
          : t("go.title");
    return (
      <div className="result-screen">
        <div className="result-head">
          <Stars count={outcome.stars} />
          <h2>{headline}</h2>
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
            player: player(explanation.kind === "gameOver" ? "down" : "idle"),
          }}
        />

        <ResultCards explanation={explanation} />

        {quizState === "done" && (
          <p className={brainStar ? "panel brain-star on" : "panel brain-star"}>
            {brainStar
              ? tx("🧠 Brain star! You answered Bolt's question right.", "🧠 Bintang otak! Kamu jawab soalan Bolt dengan betul.")
              : tx("🧠 Bolt's question: try again next mission for a brain star!", "🧠 Soalan Bolt: cuba lagi misi seterusnya untuk bintang otak!")}
          </p>
        )}

        {saved && saved.newBadges.length > 0 && (
          <section className="panel">
            <h3>{t("r.badge")}</h3>
            <p>{saved.newBadges.map((b) => (lang === "ms" ? BADGES[b]?.name_ms : BADGES[b]?.name) ?? b).join(", ")}</p>
          </section>
        )}

        {guess && (
          <p className="panel guess-check">
            {t("r.guess", {
              g: guess === "yes" ? t("guess.last") : t("guess.notLast"),
              a: batteryLasted ? t("guess.lasted") : t("guess.ranOut"),
              v: guessWasRight ? t("guess.right") : t("guess.wrong"),
            })}
          </p>
        )}

        {/* Rewind: try the other way and compare side by side. */}
        <section className="panel">
          <h3>{t("r.rewind")}</h3>
          <p>{t("r.rewindSub")}</p>
          <div className="button-row">
            <Button
              onClick={() => setRewindPlan({ lifeSupport: 0.2, shielding: 0.6, science: 0.2 })}
            >
              {t("r.moreShield")}
            </Button>
            <Button
              onClick={() => setRewindPlan({ lifeSupport: 0.3, shielding: 0.2, science: 0.5 })}
            >
              {t("r.moreScience")}
            </Button>
          </div>
          {rewindOutcome && (
            <div className="compare">
              <div className="compare-col">
                <strong>{t("r.yourPlan")}</strong>
                <Stars count={outcome.stars} />
              </div>
              <div className="compare-col">
                <strong>{t("r.otherWay")}</strong>
                <Stars count={rewindOutcome.stars} />
              </div>
            </div>
          )}
        </section>

        {!dustStorm && <EarthImpactCard storm={storm} showNumbers={showNumbers} />}
        {isTimeMachine && <RealStormCard storm={storm} />}

        <div className="button-row">
          <ShareCard
            stars={outcome.stars}
            stormDate={storm.peakTime.slice(0, 10)}
            stormLabel={`${storm.flareClass}${storm.magnitude} flare`}
          />
          <Button variant="primary" onClick={reset}>
            {t("r.playAgain")}
          </Button>
          {onExit && <Button onClick={onExit}>{t("r.backDash")}</Button>}
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
  // The camera stays with the player at the command post, so the child plays
  // from inside the base.
  const baseShot: OutpostShot = running
    ? "commander"
    : phase === "brief"
      ? "intro"
      : phase === "rover"
        ? "rover"
        : "commander";
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
    player: player("idle"),
  };

  const mood: CrewMood = running
    ? now.comfort < COMFORT_OK.value
      ? "cold"
      : strength > 0
        ? "worried"
        : "calm"
    : "calm";

  const title = dustStorm
    ? t("m.titleDust")
    : t("m.titleSolar", { d: storm.peakTime.slice(0, 10) });

  const stormSize: 1 | 2 | 3 =
    storm.flareClass === "M" ? 1 : storm.magnitude >= 5 ? 3 : 2;
  const stormSizeWord = t(stormSize === 1 ? "storm.medium" : stormSize === 2 ? "storm.strong" : "storm.giant");

  // --- What Bolt says, the controls, and the one main button, per phase ---
  let boltText = t("m.brief");
  let boltExpression: "happy" | "thinking" | "worried" | "asleep" = "happy";
  let boltRich: ReactNode = null;
  let controls: ReactNode = null;
  let action: ReactNode = null;

  if (phase === "brief") {
    boltExpression = boltAsleep ? "asleep" : "happy";
    boltRich = (
      <>
        {t("m.briefA")}
        <Word term="flare">{t("m.briefWord")}</Word>
        {t("m.briefB")}
      </>
    );
    controls = (
      <>
        {isDaily && (
          <section className="panel">
            <h3>{t("m.dares")}</h3>
            <p className="quiet">{t("m.daresSub")}</p>
            <div className="dare-row">
              {dareContent.cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={dares.has(c.id as DareId)}
                  className={dares.has(c.id as DareId) ? "dare-chip on" : "dare-chip"}
                  onClick={() => toggleDare(c.id as DareId)}
                >
                  {t(`dare.${c.id}` as Key)}
                </button>
              ))}
            </div>
          </section>
        )}
        <p className="quiet">{t("m.truth")}</p>
      </>
    );
    action = (
      <Button variant="primary" large onClick={() => setPhase(isDaily ? "rover" : "guess")}>
        {t("m.ready")}
      </Button>
    );
  } else if (phase === "rover") {
    boltText = t("m.roverBolt");
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
          {t("m.trip", {
            t: tripHours,
            tu: tripHours === 1 ? t("common.hour") : t("common.hours"),
            w: warnHours,
            wu: warnHours === 1 ? t("common.hour") : t("common.hours"),
          })}{" "}
          {tooFar ? t("m.tooFar") : t("m.inTime")}
        </p>
        {can3D && <p className="quiet">{t("m.dragRover")}</p>}
      </section>
    );
    action = (
      <Button variant="primary" large onClick={() => setPhase("guess")}>
        {t("m.roverSet")}
      </Button>
    );
  } else if (phase === "guess") {
    boltText = t("m.guessQ");
    boltExpression = "thinking";
    controls = (
      <section className="panel guess-panel">
        <h3>{t("m.guessTitle")}</h3>
        <div className="button-row">
          <Button
            large
            onClick={() => {
              setGuess("yes");
              setPhase("plan");
            }}
          >
            {t("m.guessYes")}
          </Button>
          <Button
            large
            onClick={() => {
              setGuess("no");
              setPhase("plan");
            }}
          >
            {t("m.guessNo")}
          </Button>
        </div>
      </section>
    );
  } else if (phase === "plan") {
    boltText = t("m.planBolt");
    boltExpression = "thinking";
    boltText = useTriangle
      ? t("m.planBolt")
      : tx(
          `${stormSizeWord[0].toUpperCase()}${stormSizeWord.slice(1)} is coming. Put all 10 power cubes to work, then press Go.`,
          `${stormSizeWord[0].toUpperCase()}${stormSizeWord.slice(1)} akan datang. Letakkan kesemua 10 kiub kuasa, kemudian tekan Mula.`,
        );
    controls = (
      <section className="panel">
        {useTriangle ? (
          <PowerTriangle plan={plan} battery={BATTERY_START.value} onChange={setPlan} />
        ) : (
          <PowerCubes
            plan={plan}
            onChange={setPlan}
            onPoolChange={setCubesLeft}
            startEmpty
            stormSize={stormSize}
          />
        )}
        <button
          type="button"
          className="topbar-link"
          onClick={() => {
            setUseTriangle((u) => !u);
            setCubesLeft(0);
          }}
        >
          {useTriangle
            ? tx("◻ Use power cubes", "◻ Guna kiub kuasa")
            : tx("△ Use the triangle (harder)", "△ Guna segi tiga (lebih sukar)")}
        </button>
      </section>
    );
    const notReady = !useTriangle && cubesLeft > 0;
    action = (
      <Button
        variant="primary"
        large
        disabled={notReady}
        onClick={() => {
          setFocus(null);
          setPhase("running");
          setHour(0);
        }}
      >
        {notReady
          ? tx(`Place ${cubesLeft} more ⚡`, `Letak ${cubesLeft} lagi ⚡`)
          : t("m.go")}
      </Button>
    );
  } else if (running) {
    boltExpression = strength > 0 || warning ? "worried" : "happy";
    const coldSoon = now.comfort < COMFORT_OK.value + 12;
    const radHigh = badgePct > 70;
    const batLow = now.battery < 15;
    boltText = warning
      ? t("m.warnBolt")
      : stormPrompt && !changed
        ? tx(
            `The storm is here! It is ${stormSizeWord}. You can move your power cubes ONE time now. Does the shelter need more?`,
            `Ribut sudah tiba! Ini ${stormSizeWord}. Kamu boleh alihkan kiub kuasa SEKALI sekarang. Perlukah tempat perlindungan lebih?`,
          )
        : radHigh
          ? tx("☢️ Radiation is getting high! Your shelter is working hard.", "☢️ Radiasi semakin tinggi! Tempat perlindungan kamu sedang bekerja keras.")
          : coldSoon
            ? tx("🥶 Brrr! The crew is getting cold. Air & warmth needs power.", "🥶 Brrr! Kru semakin sejuk. Udara & kehangatan perlukan kuasa.")
            : batLow
              ? tx("🔋 The battery is almost empty! The panels wait for sunrise.", "🔋 Bateri hampir habis! Panel menunggu matahari terbit.")
              : strength > 0
                ? t("m.stormHit")
                : now.hour % 24 >= 12
                  ? tx("🌙 Night time. No sun for the panels, so the base uses the battery.", "🌙 Waktu malam. Tiada cahaya untuk panel, jadi pangkalan guna bateri.")
                  : tx("☀️ Daytime. The solar panels are charging the battery.", "☀️ Waktu siang. Panel solar sedang mengecas bateri.");
    controls =
      stormPrompt && !changed ? (
        <section className="panel storm-change">
          <h3>{t("m.changeQ")}</h3>
          {useTriangle ? (
            <PowerTriangle
              plan={planAtStorm ?? plan}
              battery={now.battery}
              onChange={(p) => setPlanAtStorm(p)}
            />
          ) : (
            <PowerCubes
              plan={planAtStorm ?? plan}
              onChange={(p) => setPlanAtStorm(p)}
              onPoolChange={setStormCubesLeft}
              stormSize={stormSize}
              compact
            />
          )}
        </section>
      ) : (
        <section className="panel outpost">
          <Gauge
            label={`🌡️ ${t("g.comfort")}`}
            face={now.comfort < COMFORT_OK.value ? "🥶" : now.comfort < COMFORT_OK.value + 12 ? "😐" : "😊"}
            value={now.comfort}
            showNumbers={showNumbers}
            unit=""
            line={COMFORT_OK.value}
            lineLabel={tx("too cold below", "terlalu sejuk di bawah")}
          />
          <Gauge
            label={`🔋 ${t("g.battery")}`}
            face={now.battery < 15 ? "😟" : "🙂"}
            value={now.battery}
            showNumbers={showNumbers}
            unit="%"
            tone="accent"
          />
          <Gauge
            label={`🔬 ${t("g.science")}`}
            face={now.science >= 100 ? "🎉" : "🔎"}
            value={now.science}
            showNumbers={showNumbers}
            unit=" pts"
            tone="science"
          />
          <Gauge
            label={`☢️ ${t("g.rad")}`}
            face={badgePct >= 100 ? "😵" : badgePct > 70 ? "😬" : "😎"}
            value={badgePct}
            warn
            showNumbers={showNumbers}
            unit="%"
            line={100}
            lineLabel={tx("NASA limit", "had NASA")}
          />
          <div className="greenhouse-row">
            <span>{t("g.greenhouse")}</span>
            <span>
              {now.greenhouse > 60
                ? t("g.healthy")
                : now.greenhouse > 30
                  ? t("g.drooping")
                  : t("g.wilting")}
            </span>
          </div>
        </section>
      );
    if (stormPrompt && !changed) {
      action = (
        <Button
          variant="primary"
          large
          disabled={!useTriangle && stormCubesLeft > 0}
          onClick={() => {
            setChanged(true);
            setStormPrompt(false);
          }}
        >
          {!useTriangle && stormCubesLeft > 0
            ? tx(`Place ${stormCubesLeft} more ⚡`, `Letak ${stormCubesLeft} lagi ⚡`)
            : t("m.keepGoing")}
        </Button>
      );
    }
  }

  return (
    <div className={`mission phase-${phase}`}>
      <div className="mission-head">
        {onExit && (
          <button type="button" className="topbar-link" onClick={onExit}>
            {t("common.back")}
          </button>
        )}
        <h2 className="mission-title">{title}</h2>
        <button
          type="button"
          className="help-button"
          onClick={() => setShowHowTo(true)}
          aria-label={tx("How to play", "Cara bermain")}
        >
          ❓ {tx("How to play", "Cara bermain")}
        </button>
        <span className="sol-clock" aria-live="off">
          {running ? t("m.clock", { h: now.hour, t: MISSION_HOURS.value }) : t("m.before")}
        </span>
      </div>

      <aside className="mission-crew" aria-label={t("m.yourCrew")}>
        <div className="crew-card player-card">
          <AvatarFigure look={look} size={56} />
          <span className="crew-text">
            <strong>{playerName}</strong>
            <span className="crew-role">{t("m.you")}</span>
          </span>
        </div>
        {CREW.map((c) => (
          <CrewCard
            key={c.role}
            role={c.role}
            name={crewNames?.[c.role] ?? c.defaultName}
            roleLabel={t(`role.${c.role}` as Key)}
            line={t(`crew.${c.role}.line` as Key)}
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
            {strength > 0 ? t("chip.storm") : t("chip.calm")}
          </span>
        )}
        {running && !warning && (
          <div className="stage-hud" aria-hidden="true">
            <span className="hud-name">
              <AvatarFigure look={look} size={30} /> {playerName}
            </span>
            <HudBar label={t("g.rad")} value={badgePct} tone="danger" />
            <HudBar label={t("g.battery")} value={now.battery} tone="accent" />
          </div>
        )}
        {warning && (
          <div className="stage-warning panel" role="status">
            <strong className="stage-warning-title">⚠ {t("m.msgTitle")}</strong>
            {can3D ? (
              <MessageView loopSeconds={WARNING_MS / 1000} />
            ) : (
              <div className="signal-track" aria-hidden="true">
                <span className="signal-end">{t("msg.earth")}</span>
                <span className="signal" />
                <span className="signal-end">{t("msg.mars")}</span>
              </div>
            )}
            <p className="quiet">
              {t("m.msgDelay", {
                a: MARS_MESSAGE_DELAY_MIN.value,
                b: MARS_MESSAGE_DELAY_MAX.value,
              })}
            </p>
          </div>
        )}
      </OutpostView>

      <div className="mission-controls">{controls}</div>

      {showHowTo && (
        <HowToPlay
          onDone={() => {
            markHowToSeen();
            setShowHowTo(false);
          }}
        />
      )}
      {quizState === "open" && running && (
        <div className="quiz-overlay">
          <QuizPop
            question={question}
            onDone={(ok) => {
              setBrainStar(ok);
              setQuizState("done");
            }}
          />
        </div>
      )}

      <div className="mission-bolt">
        <Bolt
          key={boltText}
          autoSpeak={!boltAsleep && !showHowTo && quizState !== "open"}
          queue={running}
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
  face,
  line,
  lineLabel,
}: {
  label: string;
  value: number;
  warn?: boolean;
  showNumbers?: boolean;
  unit?: string;
  tone?: "accent" | "science";
  /** A face that shows at a glance how this part is doing. */
  face?: string;
  /** A marker line on the bar (e.g. too cold, NASA limit), 0..100. */
  line?: number;
  lineLabel?: string;
}) {
  return (
    <div className="gauge">
      <span className="gauge-label">
        {face && (
          <span className="gauge-face" aria-hidden="true">
            {face}
          </span>
        )}
        {label}
        {showNumbers ? ` — ${Math.round(value)}${unit ?? ""}` : ""}
      </span>
      <span className="gauge-bar">
        <span
          className={warn ? "gauge-fill warn" : tone ? `gauge-fill ${tone}` : "gauge-fill"}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
        {line !== undefined && (
          <span
            className="gauge-line"
            style={{ left: `${Math.min(99.5, line)}%` }}
            title={lineLabel}
            aria-label={lineLabel}
          />
        )}
      </span>
    </div>
  );
}

function HudBar({ label, value, tone }: { label: string; value: number; tone: "danger" | "accent" }) {
  return (
    <span className="hud-bar">
      <span className="hud-bar-label">{label}</span>
      <span className="hud-bar-track">
        <span
          className={`hud-bar-fill ${tone}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
    </span>
  );
}

function CrewCard({
  name,
  role,
  roleLabel,
  line,
  mood,
  selected,
  onSelect,
}: {
  name: string;
  role: CrewRole;
  roleLabel: string;
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
        <span className="crew-role">{roleLabel}</span>
        <span className="crew-line">{line}</span>
      </span>
    </button>
  );
}
