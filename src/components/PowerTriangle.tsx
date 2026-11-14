import { useT } from "../i18n";
import { useCallback, useRef } from "react";
import type { Plan } from "../sim/types";

// The three corners of the triangle, in SVG coordinates (viewBox 0..100).
// Top = Life Support, bottom-left = Shielding, bottom-right = Science.
const CORNERS = {
  lifeSupport: { x: 50, y: 8 },
  shielding: { x: 10, y: 88 },
  science: { x: 90, y: 88 },
};

interface Props {
  plan: Plan;
  battery: number; // 0..100
  onChange: (plan: Plan) => void;
  disabled?: boolean;
}

/** Round shares to 10% steps that always total 100%. */
function snap(ls: number, sh: number, sci: number): Plan {
  const total = ls + sh + sci || 1;
  const raw = [ls / total, sh / total, sci / total];
  // Round each to the nearest 0.1, then fix the total to exactly 1.0 by
  // adjusting the largest share.
  const steps = raw.map((v) => Math.round(v * 10));
  let sum = steps[0] + steps[1] + steps[2];
  while (sum !== 10) {
    const i = sum > 10 ? steps.indexOf(Math.max(...steps)) : steps.indexOf(Math.min(...steps));
    steps[i] += sum > 10 ? -1 : 1;
    sum = steps[0] + steps[1] + steps[2];
  }
  return {
    lifeSupport: steps[0] / 10,
    shielding: steps[1] / 10,
    science: steps[2] / 10,
  };
}

/** Where the dot sits for a given plan (weighted average of the corners). */
function dotFor(plan: Plan): { x: number; y: number } {
  return {
    x:
      CORNERS.lifeSupport.x * plan.lifeSupport +
      CORNERS.shielding.x * plan.shielding +
      CORNERS.science.x * plan.science,
    y:
      CORNERS.lifeSupport.y * plan.lifeSupport +
      CORNERS.shielding.y * plan.shielding +
      CORNERS.science.y * plan.science,
  };
}

/** Barycentric coordinates of a point in the triangle -> raw shares. */
function sharesAt(x: number, y: number): Plan {
  const a = CORNERS.lifeSupport;
  const b = CORNERS.shielding;
  const c = CORNERS.science;
  const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  let l1 = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / det;
  let l2 = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / det;
  let l3 = 1 - l1 - l2;
  // Clamp to inside the triangle.
  l1 = Math.max(0, l1);
  l2 = Math.max(0, l2);
  l3 = Math.max(0, l3);
  return snap(l1, l2, l3);
}

export function PowerTriangle({ plan, battery, onChange, disabled }: Props) {
  const t = useT();
  const svgRef = useRef<SVGSVGElement>(null);
  const dot = dotFor(plan);

  const pointToShares = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    onChange(sharesAt(x, y));
  }, [onChange]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointToShares(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled || e.buttons === 0) return;
    pointToShares(e.clientX, e.clientY);
  };

  // Arrow keys nudge power between corners in 10% steps (R5.6).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const p = { ...plan };
    const move = (from: keyof Plan, to: keyof Plan) => {
      if (p[from] >= 0.1) {
        p[from] = Math.round((p[from] - 0.1) * 10) / 10;
        p[to] = Math.round((p[to] + 0.1) * 10) / 10;
      }
    };
    if (e.key === "ArrowUp") move("science", "lifeSupport");
    else if (e.key === "ArrowDown") move("lifeSupport", "science");
    else if (e.key === "ArrowLeft") move("science", "shielding");
    else if (e.key === "ArrowRight") move("shielding", "science");
    else return;
    e.preventDefault();
    onChange(p);
  };

  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div className="triangle-wrap">
      <svg
        ref={svgRef}
        viewBox="0 0 100 104"
        className="triangle-svg"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={t("tri.aria")}
        aria-valuetext={`Life support ${pct(plan.lifeSupport)}, shielding ${pct(
          plan.shielding,
        )}, science ${pct(plan.science)}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
      >
        {/* Battery fill: the triangle visibly fills from the bottom. */}
        <defs>
          <clipPath id="tri-clip">
            <polygon points="50,10 10,90 90,90" />
          </clipPath>
        </defs>
        <g clipPath="url(#tri-clip)">
          <rect x="0" y="0" width="100" height="104" fill="var(--surface)" />
          <rect
            x="0"
            y={100 - battery}
            width="100"
            height={battery + 4}
            fill="var(--shielding)"
            opacity="0.35"
          />
        </g>
        <polygon
          points="50,10 10,90 90,90"
          fill="none"
          stroke="var(--ink-quiet)"
          strokeWidth="1"
        />
        {/* Corner markers in each corner's colour */}
        <circle cx="50" cy="10" r="3" fill="var(--life-support)" />
        <circle cx="10" cy="90" r="3" fill="var(--shielding)" />
        <circle cx="90" cy="90" r="3" fill="var(--science)" />
        {/* Corner labels */}
        <text x="50" y="6" className="tri-label" textAnchor="middle" fill="var(--life-support)">
          {t("tri.life")}
        </text>
        <text x="8" y="100" className="tri-label" textAnchor="start" fill="var(--shielding)">
          {t("tri.shield")}
        </text>
        <text x="92" y="100" className="tri-label" textAnchor="end" fill="var(--science)">
          {t("tri.science")}
        </text>
        {/* The accent dot with a spring follow */}
        <circle
          className="tri-dot"
          cx={dot.x}
          cy={dot.y}
          r="5.5"
          fill="var(--accent)"
          stroke="var(--ground)"
          strokeWidth="1.5"
        />
      </svg>
      <div className="triangle-shares">
        <span className="tri-share">
          <span className="tri-swatch" style={{ background: "var(--life-support)" }} />
          {t("tri.life")} {pct(plan.lifeSupport)}
        </span>
        <span className="tri-share">
          <span className="tri-swatch" style={{ background: "var(--shielding)" }} />
          {t("tri.shield")} {pct(plan.shielding)}
        </span>
        <span className="tri-share">
          <span className="tri-swatch" style={{ background: "var(--science)" }} />
          {t("tri.science")} {pct(plan.science)}
        </span>
        <span className="battery-readout">{t("tri.battery", { n: Math.round(battery) })}</span>
      </div>
    </div>
  );
}
