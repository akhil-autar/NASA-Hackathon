import { useState } from "react";
import { Bolt } from "../components/Bolt";
import { PowerTriangle } from "../components/PowerTriangle";
import { Stars } from "../components/Stars";
import crew from "../content/crew.json";
import { getArchive } from "../data/archive";
import { toStorm } from "../data/to-storm";
import { initialState, runMission } from "../sim/mission";
import type { Plan, Storm } from "../sim/types";

interface Props {
  onBack: () => void;
}

const DISCUSS_QUESTION =
  "Before we press Go: which job matters most for this storm, and what will it cost?";

const EMPTY: Plan = { lifeSupport: 0.4, shielding: 0.3, science: 0.3 };

function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function ClassScreen({ onBack }: Props) {
  // The teacher picks one storm for the whole room. Offer a few strong ones.
  const strong = getArchive()
    .storms.filter((s) => s.flareClass === "X")
    .slice(-6);
  const [storm, setStorm] = useState<Storm | null>(null);
  const [paused, setPaused] = useState(true);
  const [teams, setTeams] = useState<Plan[]>([{ ...EMPTY }]);

  if (!storm) {
    return (
      <div className="screen">
        <Bolt text="Class mode. Teacher, pick one storm for the whole room." />
        <div className="class-storm-list">
          {strong.map((s) => (
            <button
              key={s.id}
              type="button"
              className="dash-card"
              onClick={() => setStorm(toStorm(s))}
            >
              {s.flareClass}
              {s.magnitude} · {s.peakTime.slice(0, 10)}
            </button>
          ))}
        </div>
        <button type="button" className="big-button ghost" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const seed = seedFrom(storm.id);

  const setTeam = (i: number, p: Plan) =>
    setTeams((prev) => prev.map((t, j) => (j === i ? p : t)));
  const addTeam = () =>
    setTeams((prev) => (prev.length < 4 ? [...prev, { ...EMPTY }] : prev));

  return (
    <div className="screen">
      <Bolt text="Three roles, three corners. Talk it over, then compare plans." />

      <div className="crew-row">
        <ClassRole role="Doctor" line={crew.doctor.line} corner="Shielding" />
        <ClassRole role="Engineer" line={crew.engineer.line} corner="Life Support" />
        <ClassRole role="Scientist" line={crew.scientist.line} corner="Science" />
      </div>

      {paused ? (
        <section className="card">
          <h3 className="card-title">Pause and discuss</h3>
          <p className="card-body">{DISCUSS_QUESTION}</p>
          <button
            type="button"
            className="big-button go"
            onClick={() => setPaused(false)}
          >
            We've discussed — continue
          </button>
        </section>
      ) : (
        <>
          <h3 className="card-title">Compare plans (up to 4 teams)</h3>
          {teams.map((t, i) => (
            <section className="card" key={i}>
              <strong>Team {i + 1}</strong>
              <PowerTriangle plan={t} battery={80} onChange={(p) => setTeam(i, p)} />
            </section>
          ))}
          {teams.length < 4 && (
            <button type="button" className="big-button ghost" onClick={addTeam}>
              Add a team
            </button>
          )}

          <section className="card">
            <h3 className="card-title">Results</h3>
            <div className="class-results">
              {teams.map((t, i) => {
                const o = runMission(initialState(), t, storm, seed);
                return (
                  <div className="compare-col" key={i}>
                    <strong>Team {i + 1}</strong>
                    <Stars count={o.stars} />
                    <span className="source-note">
                      {o.success ? "Mission won" : "Flew home early"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <button type="button" className="big-button ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function ClassRole({
  role,
  line,
  corner,
}: {
  role: string;
  line: string;
  corner: string;
}) {
  return (
    <div className="crew-card">
      <div className="crew-portrait" aria-hidden="true">
        {role[0]}
      </div>
      <strong>{role}</strong>
      <span className="crew-role">wants {corner}</span>
      <p>{line}</p>
    </div>
  );
}
