import { useEffect, useState } from "react";
import type { Corner, Plan } from "../sim/types";
import { useTx } from "../i18n";

interface Props {
  plan: Plan;
  onChange: (plan: Plan) => void;
  /** Called with how many cubes are still not placed (Go waits for 0). */
  onPoolChange?: (left: number) => void;
  /** Start with every cube in the pool, so the child places all ten. */
  startEmpty?: boolean;
  /** How big the coming storm is: 1 medium, 2 strong, 3 giant. Sharpens the shelter hint. */
  stormSize?: 1 | 2 | 3;
  compact?: boolean;
}

const TOTAL = 10;
type Counts = Record<Corner, number>;

function countsFrom(plan: Plan): Counts {
  const c: Counts = {
    lifeSupport: Math.round(plan.lifeSupport * TOTAL),
    shielding: Math.round(plan.shielding * TOTAL),
    science: Math.round(plan.science * TOTAL),
  };
  // Make sure the three add up to 10 (e.g. 33/33/34 rounds to 3/3/3).
  let sum = c.lifeSupport + c.shielding + c.science;
  while (sum < TOTAL) {
    c.lifeSupport++;
    sum++;
  }
  while (sum > TOTAL) {
    const k = (Object.keys(c) as Corner[]).sort((a, b) => c[b] - c[a])[0];
    c[k]--;
    sum--;
  }
  return c;
}

const JOBS: { id: Corner; icon: string; color: string }[] = [
  { id: "lifeSupport", icon: "🌱", color: "var(--life-support)" },
  { id: "shielding", icon: "🛡️", color: "var(--shielding)" },
  { id: "science", icon: "🔬", color: "var(--science)" },
];

/**
 * The kid-friendly way to share power: 10 power cubes and 3 jobs. Tap + to give
 * a job a cube, − to take it back. Each job says, in plain words, what will
 * happen with that many cubes. Same plan underneath as the Power Triangle
 * (one cube = 10%).
 */
export function PowerCubes({ plan, onChange, onPoolChange, startEmpty, stormSize = 2, compact }: Props) {
  const tx = useTx();
  const [counts, setCounts] = useState<Counts>(() =>
    startEmpty ? { lifeSupport: 0, shielding: 0, science: 0 } : countsFrom(plan),
  );
  const used = counts.lifeSupport + counts.shielding + counts.science;
  const left = TOTAL - used;

  useEffect(() => {
    onPoolChange?.(left);
    if (left === 0) {
      onChange({
        lifeSupport: counts.lifeSupport / TOTAL,
        shielding: counts.shielding / TOTAL,
        science: counts.science / TOTAL,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts]);

  const add = (id: Corner) => left > 0 && setCounts({ ...counts, [id]: counts[id] + 1 });
  const remove = (id: Corner) => counts[id] > 0 && setCounts({ ...counts, [id]: counts[id] - 1 });

  const name: Record<Corner, string> = {
    lifeSupport: tx("Air & warmth", "Udara & kehangatan"),
    shielding: tx("Storm shelter", "Tempat perlindungan"),
    science: tx("Science", "Sains"),
  };
  const does: Record<Corner, string> = {
    lifeSupport: tx("Keeps the crew warm and the plants alive", "Memastikan kru hangat dan tanaman hidup"),
    shielding: tx("Thick walls that stop storm particles", "Dinding tebal yang menghalang zarah ribut"),
    science: tx("The rover and lab find new things", "Rover dan makmal membuat penemuan"),
  };

  // Plain-words preview of what this many cubes will do (matches the simulation).
  const hint = (id: Corner): { text: string; level: "bad" | "ok" | "good" } => {
    const n = counts[id];
    if (id === "lifeSupport") {
      if (n <= 2) return { level: "bad", text: tx("🥶 Too little! The crew will get cold.", "🥶 Terlalu sedikit! Kru akan kesejukan.") };
      if (n === 3) return { level: "ok", text: tx("🙂 Just enough to stay warm.", "🙂 Cukup-cukup untuk kekal hangat.") };
      return { level: "good", text: tx("😊 Warm and cosy. Plants are happy.", "😊 Hangat dan selesa. Tanaman gembira.") };
    }
    if (id === "shielding") {
      // From the simulation: a giant storm needs about 3 cubes to stay well under
      // NASA's limit, a strong one about 2, a medium one about 1.
      const need = stormSize === 3 ? 3 : stormSize === 2 ? 2 : 1;
      if (n === 0)
        return { level: "bad", text: tx("😟 No shelter power at all! Radiation gets in.", "😟 Tiada kuasa langsung untuk perlindungan! Radiasi masuk.") };
      if (n < need - 1)
        return { level: "bad", text: tx("😟 Thin walls. The storm may get in!", "😟 Dinding nipis. Ribut mungkin masuk!") };
      if (n < need) return { level: "ok", text: tx("🛡️ Some protection. Is it enough?", "🛡️ Ada perlindungan. Cukupkah?") };
      return { level: "good", text: tx("🏰 Strong shelter. Crew stays safe.", "🏰 Perlindungan kuat. Kru selamat.") };
    }
    if (n <= 2) return { level: "bad", text: tx("🐢 Too slow to finish the science.", "🐢 Terlalu perlahan untuk siapkan sains.") };
    if (n === 3) return { level: "ok", text: tx("🔬 Maybe just enough. Close!", "🔬 Mungkin cukup. Hampir!") };
    return { level: "good", text: tx("🚀 Lots of discoveries!", "🚀 Banyak penemuan!") };
  };

  return (
    <div className={compact ? "cubes compact" : "cubes"}>
      <div className={left > 0 ? "cubes-pool" : "cubes-pool done"} aria-live="polite">
        <span className="cubes-pool-label">
          {left > 0
            ? tx(`⚡ Power cubes to place: ${left}`, `⚡ Kiub kuasa untuk diletak: ${left}`)
            : tx("✅ All 10 cubes are working!", "✅ Kesemua 10 kiub sedang bekerja!")}
        </span>
        <span className="cubes-pool-row" aria-hidden="true">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className={i < left ? "cube free" : "cube used"} />
          ))}
        </span>
      </div>

      {JOBS.map((j) => {
        const h = hint(j.id);
        return (
          <div className="cube-job" key={j.id} style={{ ["--job" as string]: j.color }}>
            <div className="cube-job-head">
              <span className="cube-job-icon" aria-hidden="true">
                {j.icon}
              </span>
              <span className="cube-job-text">
                <strong>{name[j.id]}</strong>
                {!compact && <span className="cube-job-does">{does[j.id]}</span>}
              </span>
              <span className="cube-job-count">{counts[j.id] * 10}%</span>
            </div>
            <div className="cube-job-row">
              <button
                type="button"
                className="cube-btn"
                onClick={() => remove(j.id)}
                disabled={counts[j.id] === 0}
                aria-label={tx(`Take a cube from ${name[j.id]}`, `Ambil satu kiub daripada ${name[j.id]}`)}
              >
                −
              </button>
              <span className="cube-slots" aria-hidden="true">
                {Array.from({ length: TOTAL }, (_, i) => (
                  <span key={i} className={i < counts[j.id] ? "cube on" : "cube"} />
                ))}
              </span>
              <button
                type="button"
                className="cube-btn plus"
                onClick={() => add(j.id)}
                disabled={left === 0}
                aria-label={tx(`Give a cube to ${name[j.id]}`, `Beri satu kiub kepada ${name[j.id]}`)}
              >
                +
              </button>
            </div>
            <p className={`cube-hint ${h.level}`}>{h.text}</p>
          </div>
        );
      })}
    </div>
  );
}
