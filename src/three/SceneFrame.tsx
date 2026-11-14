import { Component, Suspense, type ReactNode } from "react";
import credits from "../content/image-credits.json";
import { useActive, useCan3D } from "./capability";

interface Props {
  /** Still image under public/, shown while loading and whenever 3D is off. */
  still: string;
  alt: string;
  /** Text description of what the scene is showing right now. */
  description: string;
  className?: string;
  /** Renders the lazy 3D canvas. `active` is false when off screen. */
  render: (active: boolean) => ReactNode;
  /** Anything drawn over the scene (labels, banners). */
  children?: ReactNode;
}

/** If a scene throws (lost context, old GPU), fall back to the still image. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* the still image underneath is the fallback; nothing else to do */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The frame every 3D scene lives in. The still NASA image is always rendered
 * underneath, so the layout is identical with 3D on or off and a broken canvas
 * can never be seen. The canvas code is loaded lazily on top of it.
 */
export function SceneFrame({ still, alt, description, className, render, children }: Props) {
  const can3D = useCan3D();
  const [ref, active] = useActive<HTMLDivElement>();
  const credit = credits.images.find((i) => i.file === still)?.credit;

  return (
    <div ref={ref} className={className ? `scene-slot ${className}` : "scene-slot"}>
      <img className="scene-still" src={`/${still}`} alt={alt} />
      {can3D && (
        <div className="scene-canvas" aria-hidden="true">
          <SceneBoundary>
            <Suspense fallback={null}>{render(active)}</Suspense>
          </SceneBoundary>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {description}
      </span>
      {!can3D && credit && <span className="scene-credit">{credit}</span>}
      {children}
    </div>
  );
}
