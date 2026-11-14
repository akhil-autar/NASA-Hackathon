import { SUITS, VISORS, type AvatarLook, type PatchId } from "./look";

interface Props {
  look: AvatarLook;
  size?: number;
  /** "down" tips the astronaut over (game over). */
  pose?: "stand" | "wave" | "down";
  className?: string;
  title?: string;
}

/** A friendly 2D astronaut drawn from the player's look. */
export function AvatarFigure({ look, size = 160, pose = "stand", className, title }: Props) {
  const suit = SUITS[look.suit];
  const visor = VISORS[look.visor];
  // Lying down: tip over at the feet, shrink a little, and slide left so the
  // whole astronaut stays inside the picture.
  const tilt = pose === "down" ? "translate(-40 0) translate(60 112) rotate(80) scale(0.8) translate(-60 -112)" : undefined;
  return (
    <svg
      className={className ? `avatar-figure ${className}` : "avatar-figure"}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={title ?? look.name}
    >
      <ellipse cx="60" cy="113" rx="30" ry="5" fill="rgba(0,0,0,0.35)" />
      <g transform={tilt}>
        {/* backpack */}
        <rect x="33" y="50" width="54" height="40" rx="8" fill={suit.trim} />
        {/* legs */}
        <rect x="42" y="86" width="15" height="24" rx="6" fill={suit.color} />
        <rect x="63" y="86" width="15" height="24" rx="6" fill={suit.color} />
        <rect x="40" y="104" width="19" height="8" rx="3" fill={suit.trim} />
        <rect x="61" y="104" width="19" height="8" rx="3" fill={suit.trim} />
        {/* body */}
        <rect x="38" y="52" width="44" height="42" rx="12" fill={suit.color} />
        <rect x="38" y="78" width="44" height="6" fill={suit.trim} opacity="0.7" />
        {/* arms */}
        <rect x="26" y="56" width="14" height="30" rx="7" fill={suit.color} />
        {pose === "wave" ? (
          <g transform="translate(86 60)">
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="155;125;155"
                dur="1.6s"
                repeatCount="indefinite"
              />
              <rect x="-7" y="-4" width="14" height="30" rx="7" fill={suit.color} />
            </g>
          </g>
        ) : (
          <rect x="80" y="56" width="14" height="30" rx="7" fill={suit.color} />
        )}
        {/* chest panel + patch */}
        <rect x="48" y="60" width="24" height="14" rx="3" fill={suit.trim} opacity="0.55" />
        <Patch id={look.patch} />
        {/* helmet */}
        <circle cx="60" cy="34" r="22" fill="#f4f3ef" />
        <ellipse cx="60" cy="36" rx="15" ry="12" fill={visor} />
        <ellipse cx="54" cy="31" rx="5" ry="3" fill="#ffffff" opacity="0.55" />
        {pose === "down" && (
          <>
            <path d="M51 34 l6 6 M57 34 l-6 6" stroke="#222" strokeWidth="2" />
            <path d="M63 34 l6 6 M69 34 l-6 6" stroke="#222" strokeWidth="2" />
          </>
        )}
        <Extra id={look.extra} trim={suit.trim} />
      </g>
    </svg>
  );
}

function Patch({ id }: { id: PatchId }) {
  const c = "#ffd34d";
  if (id === "star")
    return <path d="M60 61 l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z" fill={c} />;
  if (id === "moon")
    return <path d="M63 61 a7 7 0 1 0 0 13 a5.5 5.5 0 1 1 0 -13z" fill={c} />;
  if (id === "rocket")
    return (
      <g fill={c}>
        <path d="M60 60 q4 4 3 11 h-6 q-1 -7 3 -11z" />
        <path d="M57 69 l-3 4 h3z M63 69 l3 4 h-3z" />
      </g>
    );
  return <path d="M60 74 l-6 -6 a3.5 3.5 0 0 1 6 -4 a3.5 3.5 0 0 1 6 4z" fill="#ff6b8a" />;
}

function Extra({ id, trim }: { id: AvatarLook["extra"]; trim: string }) {
  if (id === "antenna")
    return (
      <>
        <line x1="72" y1="16" x2="78" y2="4" stroke={trim} strokeWidth="2.5" />
        <circle cx="78" cy="4" r="3" fill="#ffae1a" />
      </>
    );
  if (id === "lamp")
    return (
      <>
        <rect x="53" y="10" width="14" height="7" rx="3" fill={trim} />
        <circle cx="60" cy="13.5" r="2.6" fill="#fff6b0" />
      </>
    );
  if (id === "fin") return <path d="M48 16 q12 -16 24 0 z" fill={trim} />;
  return null;
}
