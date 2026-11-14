import { useMemo } from "react";
import { useT } from "../i18n";

const now = new Date();
const THIS_YEAR = now.getUTCFullYear();
const EARLIEST_YEAR = THIS_YEAR - 13; // the game is for ages up to ~12

function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export interface BirthdayParts {
  year: number;
  month: number; // 1-12
  day: number;
}

export function partsFrom(iso: string | null | undefined): BirthdayParts {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  if (!m) return { year: THIS_YEAR - 8, month: 6, day: 15 };
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** The chosen date clamped to the month, as YYYY-MM-DD, and whether it is in the future. */
export function birthdayInfo(p: BirthdayParts): { iso: string; isFuture: boolean; safeDay: number } {
  const safeDay = Math.min(p.day, daysInMonth(p.year, p.month));
  const chosen = new Date(Date.UTC(p.year, p.month - 1, safeDay));
  const mm = String(p.month).padStart(2, "0");
  const dd = String(safeDay).padStart(2, "0");
  return { iso: `${p.year}-${mm}-${dd}`, isFuture: chosen.getTime() > now.getTime(), safeDay };
}

/** Three big scroll wheels (labelled selects) for month, day and year. */
export function BirthdayPicker({
  value,
  onChange,
}: {
  value: BirthdayParts;
  onChange: (p: BirthdayParts) => void;
}) {
  const t = useT();
  const months = t("months").split(",");
  const years = useMemo(() => {
    const out = [];
    for (let y = Math.max(THIS_YEAR, value.year); y >= Math.min(EARLIEST_YEAR, value.year); y--)
      out.push({ v: y, t: String(y) });
    return out;
  }, [value.year]);
  const { safeDay, isFuture } = birthdayInfo(value);
  const maxDay = daysInMonth(value.year, value.month);

  return (
    <>
      <div className="wheels">
        <Wheel
          label={t("welcome.month")}
          value={value.month}
          options={months.map((m, i) => ({ v: i + 1, t: m }))}
          onChange={(month) => onChange({ ...value, month })}
        />
        <Wheel
          label={t("welcome.day")}
          value={safeDay}
          options={Array.from({ length: maxDay }, (_, i) => ({ v: i + 1, t: String(i + 1) }))}
          onChange={(day) => onChange({ ...value, day })}
        />
        <Wheel
          label={t("welcome.year")}
          value={value.year}
          options={years}
          onChange={(year) => onChange({ ...value, year })}
        />
      </div>
      {isFuture && <p className="warn-text">{t("welcome.future")}</p>}
    </>
  );
}

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
