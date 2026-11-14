import { lazy } from "react";
import { SceneFrame } from "../three/SceneFrame";
import type { SunVisual } from "../three/types";

const SunCanvas = lazy(() => import("../three/SunCanvas"));

interface Props {
  visual: SunVisual;
  /** One sentence saying what the Sun is doing, for screen readers. */
  description: string;
  className?: string;
  children?: React.ReactNode;
}

/** The Sun: 3D and draggable when possible, a still image otherwise. */
export function SunView({ visual, description, className, children }: Props) {
  return (
    <SceneFrame
      still="img/mars-backdrop.jpg"
      alt="The Sun, seen from space."
      description={description}
      className={className}
      render={(active) => <SunCanvas visual={visual} active={active} />}
    >
      {children}
    </SceneFrame>
  );
}
