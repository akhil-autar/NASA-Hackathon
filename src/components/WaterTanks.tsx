export type Job = "drinking" | "airMaker" | "shieldWall";

export interface TankAssignment {
  drinking: number;
  airMaker: number;
  shieldWall: number;
}

interface Props {
  total: number; // number of tanks
  assignment: TankAssignment;
  onChange: (a: TankAssignment) => void;
}

const JOBS: { id: Job; label: string; emoji: string }[] = [
  { id: "drinking", label: "Drinking", emoji: "🥤" },
  { id: "airMaker", label: "Air-maker", emoji: "💨" },
  { id: "shieldWall", label: "Shield wall", emoji: "🧱" },
];

/**
 * Drag six water tanks into three jobs. Each tank does one job only. Here we
 * use plus/minus steppers (large touch targets) rather than literal dragging,
 * so it works the same on a phone and keeps each tank assigned to one job.
 */
export function WaterTanks({ total, assignment, onChange }: Props) {
  const used = assignment.drinking + assignment.airMaker + assignment.shieldWall;
  const left = total - used;

  const change = (job: Job, delta: number) => {
    const next = { ...assignment };
    const v = next[job] + delta;
    if (v < 0) return;
    if (delta > 0 && left <= 0) return;
    next[job] = v;
    onChange(next);
  };

  return (
    <div className="water-tanks">
      <p className="water-left">Tanks left to place: {left}</p>
      {JOBS.map((j) => (
        <div className="tank-job" key={j.id}>
          <span className="tank-job-label">
            {j.emoji} {j.label}
          </span>
          <div className="tank-stepper">
            <button
              type="button"
              className="tank-btn"
              onClick={() => change(j.id, -1)}
              aria-label={`Fewer tanks on ${j.label}`}
            >
              −
            </button>
            <span className="tank-count">{assignment[j.id]}</span>
            <button
              type="button"
              className="tank-btn"
              onClick={() => change(j.id, +1)}
              aria-label={`More tanks on ${j.label}`}
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
