import { useEffect, useMemo, useState } from "react";
import { Bolt } from "../components/Bolt";
import { PowerCubes } from "../components/PowerCubes";
import { say } from "../components/ResultCards";
import { Stars } from "../components/Stars";
import { QUIZ } from "../content/quiz";
import { getArchive } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";
import { toStorm } from "../data/to-storm";
import { COMFORT_OK, RADIATION_BADGE_LIMIT, SCIENCE_GOAL } from "../data/constants";
import { useLang, useT, useTx, type Key } from "../i18n";
import { explain } from "../sim/explain";
import { initialState, runMission } from "../sim/mission";
import type { MissionOutcome, Plan, Storm } from "../sim/types";

interface Props {
  onBack: () => void;
}

type Step = "setup" | "brief" | "plan" | "race" | "results" | "quiz" | "final";

interface Team {
  id: number;
  icon: string;
  name: { en: string; ms: string };
  color: string;
  plan: Plan | null;
  /** Predicted stars, 1..3. */
  guess: number | null;
  quiz: number;
}

const TEAM_LOOKS = [
  { icon: "🦊", name: { en: "Foxes", ms: "Musang" }, color: "#f08a2c" },
  { icon: "🐬", name: { en: "Dolphins", ms: "Lumba-lumba" }, color: "#3aa0d4" },
  { icon: "🦅", name: { en: "Eagles", ms: "Helang" }, color: "#e3d5b8" },
  { icon: "🐢", name: { en: "Turtles", ms: "Penyu" }, color: "#5fbf8f" },
];

const QUIZ_ROUNDS = 5;
const DISCUSS_SECONDS = 60;

function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function sizeKey(s: { flareClass: "M" | "X"; magnitude: number }): Key {
  if (s.flareClass === "M") return "storm.medium";
  return s.magnitude >= 5 ? "storm.giant" : "storm.strong";
}

/**
 * Class mode: a team battle for the whole room on one big screen.
 * 1. Teams and a real storm. 2. Meet the crew and discuss (timer).
 * 3. Each team places its 10 power cubes and predicts its stars.
 * 4. All missions launch together as a race. 5. Podium.
 * 6. Quiz round, the teacher awards points. 7. Final scoreboard.
 */
export function ClassScreen({ onBack }: Props) {
  const t = useT();
  const tx = useTx();
  const lang = useLang();

  const [step, setStep] = useState<Step>("setup");
  const [teamCount, setTeamCount] = useState(3);
  const [teams, setTeams] = useState<Team[]>([]);
  const [picked, setPicked] = useState<ArchivedStorm | null>(null);
  const [active, setActive] = useState(0);

  // Three real storms, one of each size, for the teacher to choose from.
  const choices = useMemo(() => {
    const all = getArchive().storms;
    const byId = (id: string) => all.find((s) => s.id === id);
    const medium = [...all].reverse().find((s) => s.flareClass === "M" && s.magnitude >= 2) ?? all[all.length - 1];
    return [
      medium,
      byId("2024-05-10T06:27:00-FLR-001") ?? all.find((s) => s.flareClass === "X")!,
      byId("2017-09-06T11:53:00-FLR-001") ?? all.find((s) => s.flareClass === "X")!,
    ];
  }, []);

  const storm: Storm | null = useMemo(() => (picked ? toStorm(picked) : null), [picked]);
  const seed = picked ? seedFrom(picked.id) : 1;
  const stormSize: 1 | 2 | 3 = !storm ? 2 : storm.flareClass === "M" ? 1 : storm.magnitude >= 5 ? 3 : 2;
  const stormWord = picked ? t(sizeKey(picked)) : "";

  const outcomes = useMemo(() => {
    if (!storm) return [] as (MissionOutcome | null)[];
    return teams.map((tm) => (tm.plan ? runMission(initialState(), tm.plan, storm, seed) : null));
  }, [teams, storm, seed]);

  const teamName = (tm: Team) => `${tm.icon} ${tm.name[lang]}`;
  const missionPoints = (i: number) => {
    const o = outcomes[i];
    if (!o) return 0;
    const guessRight = teams[i].guess === o.stars ? 1 : 0;
    return o.stars + guessRight;
  };

  const start = () => {
    setTeams(
      TEAM_LOOKS.slice(0, teamCount).map((l, i) => ({ id: i, ...l, plan: null, guess: null, quiz: 0 })),
    );
    setActive(0);
    setStep("brief");
  };

  const restart = () => {
    setStep("setup");
    setPicked(null);
    setTeams([]);
  };

  const header = (
    <div className="class-steps" aria-label={tx("Class mission steps", "Langkah misi kelas")}>
      {(["setup", "brief", "plan", "race", "results", "quiz", "final"] as Step[]).map((s, i) => (
        <span key={s} className={s === step ? "class-step on" : "class-step"}>
          {i + 1}
        </span>
      ))}
    </div>
  );

  // --- 1. Setup ---
  if (step === "setup") {
    return (
      <div className="screen class-mode">
        {header}
        <Bolt
          autoSpeak
          text={tx(
            "Class mission battle! Split the class into teams. Every team runs the same Mars base against the same real storm. Who will do best?",
            "Pertandingan misi kelas! Bahagikan kelas kepada pasukan. Setiap pasukan menjaga pangkalan Marikh yang sama menentang ribut sebenar yang sama. Siapa paling hebat?",
          )}
        />
        <section className="panel">
          <h3>{tx("How many teams?", "Berapa pasukan?")}</h3>
          <div className="class-team-count">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={n === teamCount ? "lang-option on" : "lang-option"}
                onClick={() => setTeamCount(n)}
              >
                {TEAM_LOOKS.slice(0, n).map((l) => l.icon).join(" ")} · {n}
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <h3>{tx("Pick a real NASA storm", "Pilih ribut sebenar NASA")}</h3>
          <div className="class-storms">
            {choices.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={picked?.id === s.id ? "class-storm on" : "class-storm"}
                onClick={() => setPicked(s)}
              >
                <span className="class-storm-icon" aria-hidden="true">
                  {["🌤️", "⛈️", "🌋"][i]}
                </span>
                <strong>{t(sizeKey(s)).replace(/^\w/, (c) => c.toUpperCase())}</strong>
                <span className="quiet">
                  {s.flareClass}
                  {s.magnitude} · {s.peakTime.slice(0, 10)}
                </span>
                <span className="class-storm-level">{["★", "★★", "★★★"][i]}</span>
              </button>
            ))}
          </div>
        </section>
        <button type="button" className="big-button go" disabled={!picked} onClick={start}>
          {tx("Start the class mission 🚀", "Mulakan misi kelas 🚀")}
        </button>
        <TeacherNotes />
        <button type="button" className="big-button ghost" onClick={onBack}>
          {t("common.back")}
        </button>
      </div>
    );
  }

  if (!storm || !picked) return null;

  // --- 2. Brief + discuss ---
  if (step === "brief") {
    return (
      <div className="screen class-mode">
        {header}
        <Bolt
          autoSpeak
          text={tx(
            `A real storm from ${picked.peakTime.slice(0, 10)} is coming: ${stormWord}! Meet your crew. Each one wants something different.`,
            `Ribut sebenar dari ${picked.peakTime.slice(0, 10)} akan datang: ${stormWord}! Kenali kru kamu. Setiap seorang mahukan sesuatu yang berbeza.`,
          )}
        />
        <div className="class-roles">
          {[
            { icon: "🩺", role: "doctor", job: "🛡️", jobName: tx("Storm shelter", "Tempat perlindungan") },
            { icon: "🔧", role: "engineer", job: "🌱", jobName: tx("Air & warmth", "Udara & kehangatan") },
            { icon: "🔬", role: "scientist", job: "🔬", jobName: tx("Science", "Sains") },
          ].map((r) => (
            <div className="class-role panel" key={r.role}>
              <span className="class-role-icon" aria-hidden="true">
                {r.icon}
              </span>
              <strong>{t(`role.${r.role}` as Key)}</strong>
              <span className="class-role-wants">
                {tx("Wants", "Mahu")}: {r.job} {r.jobName}
              </span>
              <p>“{t(`crew.${r.role}.line` as Key)}”</p>
            </div>
          ))}
        </div>
        <DiscussTimer
          question={tx(
            "Talk in your team: which job matters most for this storm? What will it cost the other jobs?",
            "Bincang dalam pasukan: tugas mana paling penting untuk ribut ini? Apa kesannya kepada tugas lain?",
          )}
        />
        <button type="button" className="big-button go" onClick={() => setStep("plan")}>
          {tx("Teams, make your plans ⚡", "Pasukan, buat pelan kamu ⚡")}
        </button>
      </div>
    );
  }

  // --- 3. Each team plans ---
  if (step === "plan") {
    const tm = teams[active];
    const allReady = teams.every((x) => x.plan && x.guess);
    const setTeam = (patch: Partial<Team>) =>
      setTeams((prev) => prev.map((x, j) => (j === active ? { ...x, ...patch } : x)));
    return (
      <div className="screen class-mode">
        {header}
        <div className="class-tabs" role="tablist">
          {teams.map((x, i) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={i === active}
              type="button"
              className={i === active ? "class-tab on" : "class-tab"}
              style={{ ["--team" as string]: x.color }}
              onClick={() => setActive(i)}
            >
              {teamName(x)} {x.plan && x.guess ? "✅" : ""}
            </button>
          ))}
        </div>
        <section className="panel class-plan" style={{ ["--team" as string]: tm.color }}>
          <h3>
            {teamName(tm)}: {tx("place your 10 power cubes", "letakkan 10 kiub kuasa kamu")}
          </h3>
          <PowerCubes
            key={tm.id}
            plan={tm.plan ?? { lifeSupport: 0.4, shielding: 0.3, science: 0.3 }}
            startEmpty={!tm.plan}
            stormSize={stormSize}
            onChange={(p) => setTeam({ plan: p })}
            onPoolChange={(left) => left > 0 && tm.plan && setTeam({ plan: null })}
          />
          <h3>{tx("How many stars will you get?", "Berapa bintang kamu akan dapat?")}</h3>
          <div className="class-guess">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={tm.guess === n ? "class-guess-btn on" : "class-guess-btn"}
                onClick={() => setTeam({ guess: n })}
              >
                {"⭐".repeat(n)}
              </button>
            ))}
          </div>
          <p className="quiet">
            {tx("Guess right for a bonus point!", "Teka dengan betul untuk mata bonus!")}
          </p>
          {active < teams.length - 1 && tm.plan && tm.guess && (
            <button type="button" className="btn btn-secondary" onClick={() => setActive(active + 1)}>
              {tx("Next team ➜", "Pasukan seterusnya ➜")}
            </button>
          )}
        </section>
        <button
          type="button"
          className="big-button go"
          disabled={!allReady}
          onClick={() => setStep("race")}
        >
          {allReady
            ? tx("Launch all missions! 🚀", "Lancarkan semua misi! 🚀")
            : tx("Every team needs 10 cubes and a guess", "Setiap pasukan perlukan 10 kiub dan satu tekaan")}
        </button>
      </div>
    );
  }

  // --- 4. The race: all missions play side by side ---
  if (step === "race") {
    return (
      <div className="screen class-mode">
        {header}
        <Race
          teams={teams}
          outcomes={outcomes as MissionOutcome[]}
          storm={storm}
          teamName={teamName}
          onDone={() => setStep("results")}
        />
      </div>
    );
  }

  // --- 5. Podium ---
  if (step === "results") {
    const order = teams
      .map((tm, i) => ({ tm, i, o: outcomes[i]!, pts: missionPoints(i) }))
      .sort((a, b) => b.pts - a.pts || a.o.finalState.radiationBadge - b.o.finalState.radiationBadge);
    return (
      <div className="screen class-mode">
        {header}
        <Bolt
          autoSpeak
          text={tx(
            `${teamName(order[0].tm)} lead after the storm! Let's see why each team won or lost stars.`,
            `${teamName(order[0].tm)} mendahului selepas ribut! Mari lihat kenapa setiap pasukan menang atau hilang bintang.`,
          )}
        />
        <div className="class-podium">
          {order.map(({ tm, o, pts }, rank) => {
            const x = explain({
              outcome: o,
              plan: tm.plan!,
              storm,
              roverCaught: false,
              stormWordKey: sizeKey(picked),
            });
            const guessRight = tm.guess === o.stars;
            return (
              <section
                key={tm.id}
                className={`panel class-result rank-${rank + 1}`}
                style={{ ["--team" as string]: tm.color }}
              >
                <div className="class-result-head">
                  <span className="class-rank">{["🥇", "🥈", "🥉", "🏅"][rank]}</span>
                  <strong>{teamName(tm)}</strong>
                  <span className="class-points">
                    {pts} {tx("pts", "mata")}
                  </span>
                </div>
                <Stars count={o.stars} />
                <p className="class-plan-line">
                  🌱 {Math.round(tm.plan!.lifeSupport * 100)}% · 🛡️ {Math.round(tm.plan!.shielding * 100)}% · 🔬{" "}
                  {Math.round(tm.plan!.science * 100)}%
                </p>
                <p>{say(t, x.happened)}</p>
                <p className="quiet">{say(t, x.why)}</p>
                <p className={guessRight ? "class-bonus on" : "class-bonus"}>
                  {guessRight
                    ? tx("🎯 Guessed right: +1 bonus point!", "🎯 Teka betul: +1 mata bonus!")
                    : tx(`Guessed ${"⭐".repeat(tm.guess ?? 1)}`, `Teka ${"⭐".repeat(tm.guess ?? 1)}`)}
                </p>
              </section>
            );
          })}
        </div>
        <section className="panel">
          <h3>{tx("Talk about it", "Bincangkan")}</h3>
          <p>
            {tx(
              "Which team used the most cubes on the shelter? Did it help? What did it cost them?",
              "Pasukan mana paling banyak kiub untuk tempat perlindungan? Adakah ia membantu? Apa kosnya?",
            )}
          </p>
        </section>
        <button type="button" className="big-button go" onClick={() => setStep("quiz")}>
          {tx("Quiz round! 🧠", "Pusingan kuiz! 🧠")}
        </button>
      </div>
    );
  }

  // --- 6. Quiz round ---
  if (step === "quiz") {
    return (
      <div className="screen class-mode">
        {header}
        <ClassQuiz
          seed={seed}
          teams={teams}
          teamName={teamName}
          onPoint={(id) =>
            setTeams((prev) => prev.map((x) => (x.id === id ? { ...x, quiz: x.quiz + 1 } : x)))
          }
          onDone={() => setStep("final")}
        />
      </div>
    );
  }

  // --- 7. Final scoreboard ---
  const totals = teams
    .map((tm, i) => ({ tm, mission: missionPoints(i), total: missionPoints(i) + tm.quiz }))
    .sort((a, b) => b.total - a.total);
  const top = totals[0].total;
  const winners = totals.filter((x) => x.total === top);
  return (
    <div className="screen class-mode">
      {header}
      <div className="class-final">
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.25}s` }} />
          ))}
        </div>
        <span className="class-trophy" aria-hidden="true">
          🏆
        </span>
        <h2>
          {winners.map((w) => teamName(w.tm)).join(" & ")} {tx("win!", "menang!")}
        </h2>
        <Bolt
          autoSpeak
          text={tx(
            `Well done, everyone! The winner is ${winners.map((w) => w.tm.name.en).join(" and ")}. Remember: every choice costs something, just like for real astronauts.`,
            `Syabas semua! Pemenangnya ialah ${winners.map((w) => w.tm.name.ms).join(" dan ")}. Ingat: setiap pilihan ada kosnya, sama seperti angkasawan sebenar.`,
          )}
        />
        <table className="class-score">
          <thead>
            <tr>
              <th>{tx("Team", "Pasukan")}</th>
              <th>{tx("Mission", "Misi")}</th>
              <th>{tx("Quiz", "Kuiz")}</th>
              <th>{tx("Total", "Jumlah")}</th>
            </tr>
          </thead>
          <tbody>
            {totals.map(({ tm, mission, total }) => (
              <tr key={tm.id} className={total === top ? "win" : ""}>
                <td>{teamName(tm)}</td>
                <td>{mission}</td>
                <td>{tm.quiz}</td>
                <td>
                  <strong>{total}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="big-button go" onClick={restart}>
        {tx("New class mission", "Misi kelas baharu")}
      </button>
      <button type="button" className="big-button ghost" onClick={onBack}>
        {t("common.back")}
      </button>
    </div>
  );
}

// --- Discussion timer -------------------------------------------------------

function DiscussTimer({ question }: { question: string }) {
  const tx = useTx();
  const [left, setLeft] = useState(DISCUSS_SECONDS);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || left <= 0) return;
    const id = window.setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => window.clearTimeout(id);
  }, [running, left]);
  const pct = (left / DISCUSS_SECONDS) * 100;
  return (
    <section className="panel class-timer">
      <h3>💬 {tx("Team talk", "Bincang pasukan")}</h3>
      <p>{question}</p>
      <div className="class-timer-row">
        <span className={left === 0 ? "class-timer-clock done" : "class-timer-clock"}>
          {left === 0 ? "⏰" : `${left}s`}
        </span>
        <span className="class-timer-bar">
          <span style={{ width: `${pct}%` }} />
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (left === 0) setLeft(DISCUSS_SECONDS);
            setRunning((r) => !r || left === 0);
          }}
        >
          {left === 0 ? tx("Again", "Lagi") : running ? tx("Pause", "Jeda") : tx("Start timer", "Mula pemasa")}
        </button>
      </div>
    </section>
  );
}

// --- The race ---------------------------------------------------------------

function Race({
  teams,
  outcomes,
  storm,
  teamName,
  onDone,
}: {
  teams: Team[];
  outcomes: MissionOutcome[];
  storm: Storm;
  teamName: (t: Team) => string;
  onDone: () => void;
}) {
  const tx = useTx();
  const hours = outcomes[0]?.trace.length ?? 24;
  const [h, setH] = useState(0);
  useEffect(() => {
    if (h >= hours - 1) return;
    const id = window.setTimeout(() => setH((x) => x + 1), 280);
    return () => window.clearTimeout(id);
  }, [h, hours]);
  const done = h >= hours - 1;
  const storming = h >= storm.arrivalHour && h < storm.arrivalHour + storm.durationHours;

  return (
    <>
      <div className={storming ? "race-sky storm" : "race-sky"}>
        <span>
          {storming ? tx("⛈️ STORM!", "⛈️ RIBUT!") : h % 24 >= 12 ? tx("🌙 Night", "🌙 Malam") : tx("☀️ Day", "☀️ Siang")}
        </span>
        <span>
          {tx("Hour", "Jam")} {h} / {hours - 1}
        </span>
      </div>
      <div className="race-lanes">
        {teams.map((tm, i) => {
          const row = outcomes[i].trace[Math.min(h, outcomes[i].trace.length - 1)];
          const rad = Math.min(100, (row.radiationBadge / RADIATION_BADGE_LIMIT.value) * 100);
          const warm = Math.max(0, Math.min(100, row.comfort));
          const sci = Math.min(100, (row.science / SCIENCE_GOAL.value) * 100);
          const out = rad >= 100 || warm < COMFORT_OK.value;
          return (
            <section key={tm.id} className={out ? "race-lane out" : "race-lane"} style={{ ["--team" as string]: tm.color }}>
              <strong className="race-team">
                {teamName(tm)} {out ? "😵" : storming ? "😬" : "🙂"}
              </strong>
              <RaceBar icon="🌡️" value={warm} tone="var(--life-support)" line={COMFORT_OK.value} />
              <RaceBar icon="☢️" value={rad} tone="var(--danger)" line={100} />
              <RaceBar icon="🔬" value={sci} tone="var(--science)" />
            </section>
          );
        })}
      </div>
      <button type="button" className="big-button go" disabled={!done} onClick={onDone}>
        {done ? tx("See the results 🏆", "Lihat keputusan 🏆") : tx("Missions running…", "Misi sedang berjalan…")}
      </button>
    </>
  );
}

function RaceBar({ icon, value, tone, line }: { icon: string; value: number; tone: string; line?: number }) {
  return (
    <div className="race-bar">
      <span aria-hidden="true">{icon}</span>
      <span className="race-track">
        <span className="race-fill" style={{ width: `${value}%`, background: tone }} />
        {line !== undefined && <span className="race-line" style={{ left: `${Math.min(99.5, line)}%` }} />}
      </span>
    </div>
  );
}

// --- Quiz round -------------------------------------------------------------

function ClassQuiz({
  seed,
  teams,
  teamName,
  onPoint,
  onDone,
}: {
  seed: number;
  teams: Team[];
  teamName: (t: Team) => string;
  onPoint: (id: number) => void;
  onDone: () => void;
}) {
  const tx = useTx();
  const lang = useLang();
  const questions = useMemo(() => {
    const start = seed % QUIZ.length;
    return Array.from({ length: QUIZ_ROUNDS }, (_, i) => QUIZ[(start + i) % QUIZ.length]);
  }, [seed]);
  const [n, setN] = useState(0);
  const [shown, setShown] = useState(false);
  const [given, setGiven] = useState<Set<number>>(new Set());
  const q = questions[n];
  const last = n === questions.length - 1;

  return (
    <>
      <span className="quiz-pop-tag">
        🧠 {tx("Question", "Soalan")} {n + 1} / {questions.length}
      </span>
      <section className="panel class-quiz">
        <h2>{q.q[lang]}</h2>
        <div className="quiz-options big">
          {q.options.map((o, i) => (
            <div key={i} className={shown ? (i === q.answer ? "quiz-option right" : "quiz-option dim") : "quiz-option"}>
              <span className="quiz-icon">{["A", "B", "C"][i]}</span>
              <span className="quiz-icon" aria-hidden="true">
                {o.icon}
              </span>
              {o.text[lang]}
            </div>
          ))}
        </div>
        {!shown ? (
          <button type="button" className="btn btn-primary btn-lg" onClick={() => setShown(true)}>
            {tx("Show the answer", "Tunjuk jawapan")}
          </button>
        ) : (
          <>
            <p className="quiz-verdict right">{q.why[lang]}</p>
            <h3>{tx("Which teams got it right? Tap to give a point:", "Pasukan mana betul? Tekan untuk beri mata:")}</h3>
            <div className="class-tabs">
              {teams.map((tm) => (
                <button
                  key={tm.id}
                  type="button"
                  className={given.has(tm.id) ? "class-tab on" : "class-tab"}
                  style={{ ["--team" as string]: tm.color }}
                  disabled={given.has(tm.id)}
                  onClick={() => {
                    onPoint(tm.id);
                    setGiven(new Set(given).add(tm.id));
                  }}
                >
                  {teamName(tm)} {given.has(tm.id) ? "+1 ✅" : ""}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => {
                if (last) onDone();
                else {
                  setN(n + 1);
                  setShown(false);
                  setGiven(new Set());
                }
              }}
            >
              {last ? tx("Final scores 🏆", "Markah akhir 🏆") : tx("Next question ➜", "Soalan seterusnya ➜")}
            </button>
          </>
        )}
      </section>
      <div className="class-mini-score">
        {teams.map((tm) => (
          <span key={tm.id} style={{ ["--team" as string]: tm.color }}>
            {teamName(tm)}: {tm.quiz}
          </span>
        ))}
      </div>
    </>
  );
}

// --- Notes for the teacher --------------------------------------------------

function TeacherNotes() {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  return (
    <section className="panel">
      <button type="button" className="topbar-link" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} {tx("For the teacher (about 20 minutes)", "Untuk guru (kira-kira 20 minit)")}
      </button>
      {open && (
        <ul className="prose-list">
          <li>
            {tx(
              "Learning goal: every choice has a cost (trade-offs), using real NASA solar storm data.",
              "Matlamat: setiap pilihan ada kos (keseimbangan), menggunakan data ribut suria sebenar NASA.",
            )}
          </li>
          <li>
            {tx(
              "Science ideas: radiation comes from the Sun, shielding blocks it, solar panels only work in daylight, messages to Mars take minutes.",
              "Idea sains: radiasi datang dari Matahari, perisai menghalangnya, panel solar hanya berfungsi pada waktu siang, mesej ke Marikh mengambil masa beberapa minit.",
            )}
          </li>
          <li>
            {tx(
              "Run it on one big screen. Each team gets a turn on the plan step. Points: mission stars + 1 for a correct prediction + quiz points.",
              "Guna satu skrin besar. Setiap pasukan dapat giliran pada langkah pelan. Mata: bintang misi + 1 untuk ramalan betul + mata kuiz.",
            )}
          </li>
          <li>
            {tx(
              "Ask after the race: would your plan still win against a bigger storm? Why?",
              "Tanya selepas perlumbaan: adakah pelan kamu masih menang menentang ribut yang lebih besar? Kenapa?",
            )}
          </li>
        </ul>
      )}
    </section>
  );
}
