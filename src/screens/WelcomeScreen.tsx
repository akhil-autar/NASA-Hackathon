import { useMemo, useState } from "react";
import { Bolt } from "../components/Bolt";
import crew from "../content/crew.json";
import type { CrewNames, Profile } from "../storage/profile";

interface Props {
  onDone: (p: Profile) => void;
  onSkip: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const now = new Date();
const THIS_YEAR = now.getUTCFullYear();
const EARLIEST_YEAR = THIS_YEAR - 13; // the game is for ages up to ~12

function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** A simple scroll wheel: a labelled <select>, large and tappable. */
function Wheel({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: { v: number; t: string }[];
  onChange: (v: number) => void;
}) {
  return (
    <label className="wheel">
      <span className="wheel-label">{label}</span>
      <select
        className="wheel-select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
    </label>
  );
}

export function WelcomeScreen({ onDone, onSkip }: Props) {
  const [year, setYear] = useState(THIS_YEAR - 8);
  const [month, setMonth] = useState(6); // 1-12
  const [day, setDay] = useState(15);
  const [names, setNames] = useState<CrewNames>({
    doctor: crew.doctor.defaultName,
    engineer: crew.engineer.defaultName,
    scientist: crew.scientist.defaultName,
  });

  // No future dates: clamp the day to the month, and don't allow a date after
  // today.
  const years = useMemo(() => {
    const out = [];
    for (let y = THIS_YEAR; y >= EARLIEST_YEAR; y--) out.push({ v: y, t: String(y) });
    return out;
  }, []);
  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);

  const chosen = new Date(Date.UTC(year, month - 1, safeDay));
  const isFuture = chosen.getTime() > now.getTime();

  const finish = () => {
    const mm = String(month).padStart(2, "0");
    const dd = String(safeDay).padStart(2, "0");
    onDone({
      birthday: `${year}-${mm}-${dd}`,
      crew: names,
      onboarded: true,
    });
  };

  return (
    <div className="screen">
      <Bolt autoSpeak text="Hello, Commander! When is your birthday?" />

      <div className="wheels">
        <Wheel
          label="Month"
          value={month}
          options={MONTHS.map((t, i) => ({ v: i + 1, t }))}
          onChange={setMonth}
        />
        <Wheel
          label="Day"
          value={safeDay}
          options={Array.from({ length: maxDay }, (_, i) => ({
            v: i + 1,
            t: String(i + 1),
          }))}
          onChange={setDay}
        />
        <Wheel label="Year" value={year} options={years} onChange={setYear} />
      </div>
      {isFuture && (
        <p className="warn-text">That day hasn't happened yet. Pick an earlier day.</p>
      )}

      <Bolt text="Name your crew, or keep these names." />
      <div className="name-fields">
        <NameField
          label="Doctor"
          value={names.doctor}
          onChange={(v) => setNames({ ...names, doctor: v })}
        />
        <NameField
          label="Engineer"
          value={names.engineer}
          onChange={(v) => setNames({ ...names, engineer: v })}
        />
        <NameField
          label="Scientist"
          value={names.scientist}
          onChange={(v) => setNames({ ...names, scientist: v })}
        />
      </div>

      <button
        type="button"
        className="big-button go"
        disabled={isFuture}
        onClick={finish}
      >
        Start
      </button>
      <button type="button" className="big-button ghost" onClick={onSkip}>
        Skip
      </button>

      <p className="parent-note">This stays on your device. We don't collect it.</p>
    </div>
  );
}

function NameField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="name-field">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        maxLength={16}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
