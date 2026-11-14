export type CrewRole = "doctor" | "engineer" | "scientist";
export type CrewMood = "calm" | "worried" | "cold";

interface Props {
  role: CrewRole;
  name: string;
  mood?: CrewMood;
  size?: number;
}

// One tint per role so the three crew read as different people.
const ROLE_TINT: Record<CrewRole, string> = {
  doctor: "var(--shielding)",
  engineer: "var(--life-support)",
  scientist: "var(--science)",
};

/** A large round crew portrait drawn in SVG, with three face states. */
export function CrewPortrait({ role, name, mood = "calm", size = 72 }: Props) {
  const tint = ROLE_TINT[role];

  // Mouth per mood.
  const mouth =
    mood === "worried"
      ? "M40 66 q8 -7 16 0"
      : mood === "cold"
        ? "M42 66 h12"
        : "M40 64 q8 7 16 0";

  // Cold crew have a slight blue cheek; worried have raised brows.
  return (
    <svg
      className="crew-portrait-svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      role="img"
      aria-label={`${name}, looking ${mood}`}
    >
      <circle cx="48" cy="48" r="46" fill="var(--surface-raised)" />
      <circle cx="48" cy="48" r="46" fill="none" stroke={tint} strokeWidth="3" />
      {/* helmet visor arc */}
      <path d="M20 40 a28 20 0 0 1 56 0" fill="none" stroke={tint} strokeWidth="2" opacity="0.6" />
      {/* eyes */}
      <circle cx="38" cy="46" r="4" fill="var(--ink)" />
      <circle cx="58" cy="46" r="4" fill="var(--ink)" />
      {/* brows for worried */}
      {mood === "worried" && (
        <>
          <line x1="32" y1="38" x2="42" y2="40" stroke="var(--ink)" strokeWidth="2" />
          <line x1="64" y1="38" x2="54" y2="40" stroke="var(--ink)" strokeWidth="2" />
        </>
      )}
      {/* cold cheeks */}
      {mood === "cold" && (
        <>
          <circle cx="32" cy="58" r="4" fill="var(--shielding)" opacity="0.5" />
          <circle cx="64" cy="58" r="4" fill="var(--shielding)" opacity="0.5" />
        </>
      )}
      <path d={mouth} fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
