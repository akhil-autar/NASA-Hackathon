// Simple inline SVG line icons in --ink. No icon library, no emoji.

type IconName =
  | "soundOn"
  | "soundOff"
  | "settings"
  | "back"
  | "replay"
  | "menu"
  | "share"
  | "star"
  | "stop";

interface Props {
  name: IconName;
  title?: string;
  className?: string;
}

const PATHS: Record<IconName, React.ReactNode> = {
  soundOn: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 8a5 5 0 0 1 0 8" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  soundOff: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M22 9l-6 6" />
      <path d="M16 9l6 6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  back: (
    <>
      <path d="M15 5l-7 7 7 7" />
    </>
  ),
  replay: (
    <>
      <path d="M4 4v6h6" />
      <path d="M4 10a8 8 0 1 1 2 6" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  share: (
    <>
      <path d="M12 16V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 14v5h14v-5" />
    </>
  ),
  stop: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </>
  ),
  star: (
    <>
      <path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.5 6.2 21l1.1-6.5L2.6 9.8l6.5-.9L12 3z" />
    </>
  ),
};

export function Icon({ name, title, className }: Props) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      viewBox="0 0 24 24"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
