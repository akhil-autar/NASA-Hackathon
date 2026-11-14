import credits from "../content/image-credits.json";

interface Props {
  /** Still image under public/, e.g. "img/mars-panorama.jpg". */
  still: string;
  alt: string;
  /** Text description of the current scene state (for screen readers). */
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * The area where a 3D scene will render. In Group 2 it shows a still NASA
 * image; Group 3 mounts the real canvas here when the device supports it. The
 * still is always the fallback, so the layout is identical with 3D on or off.
 */
export function SceneSlot({ still, alt, description, className, children }: Props) {
  const credit = credits.images.find((i) => i.file === still)?.credit;
  return (
    <div className={className ? `scene-slot ${className}` : "scene-slot"}>
      <img className="scene-still" src={`/${still}`} alt={alt} />
      {description && <span className="sr-only">{description}</span>}
      {credit && <span className="scene-credit">{credit}</span>}
      {children}
    </div>
  );
}
