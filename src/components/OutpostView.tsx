import { lazy } from "react";
import { SceneFrame } from "../three/SceneFrame";
import type { OutpostVisual } from "../three/types";

const OutpostCanvas = lazy(() => import("../three/OutpostCanvas"));

interface Props {
  visual: OutpostVisual;
  className?: string;
  children?: React.ReactNode;
}

/** Words for screen readers, built from the same state the scene draws. */
function describe(v: OutpostVisual): string {
  const parts = [`Hour ${Math.round(v.hour)}. Battery ${Math.round(v.battery)} percent.`];
  parts.push(
    v.lifeSupport >= 0.3 ? "The habitat lights are bright." : "The habitat lights are dim.",
  );
  parts.push(v.greenhouse > 60 ? "The plants are healthy." : v.greenhouse > 30 ? "The plants are drooping." : "The plants are wilting.");
  parts.push(v.shielding >= 0.3 ? "The shelter is open and lit." : "The shelter is closed.");
  parts.push(v.science >= 0.3 ? "The rover is out working." : "The rover is close to home.");
  if (v.dust) parts.push("Dust is dimming the Sun.");
  parts.push(v.storm > 0 ? "A storm from the Sun is hitting the base." : "The sky is calm.");
  return parts.join(" ");
}

/** The Mars outpost: 3D when the device can show it, a NASA still otherwise. */
export function OutpostView({ visual, className, children }: Props) {
  return (
    <SceneFrame
      still="img/mars-panorama.jpg"
      alt="The Mars outpost."
      description={describe(visual)}
      className={className}
      render={(active) => <OutpostCanvas visual={visual} active={active} />}
    >
      {children}
    </SceneFrame>
  );
}
