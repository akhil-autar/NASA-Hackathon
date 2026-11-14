import { useState } from "react";
import { APP_NAME } from "../config";
import { Icon } from "./Icon";

export interface TopBarLink {
  label: string;
  onClick: () => void;
}

interface Props {
  links: TopBarLink[];
  soundOn: boolean;
  onToggleSound: () => void;
}

/**
 * The top bar: the game name, the four secondary destinations as plain text
 * links (laptop/tablet), and a sound toggle. On a phone the links collapse into
 * a menu button that opens a simple sheet.
 */
export function TopBar({ links, soundOn, onToggleSound }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <h1 className="topbar-name">{APP_NAME}</h1>

        <nav className="topbar-links" aria-label="Main">
          {links.map((l) => (
            <button
              key={l.label}
              type="button"
              className="topbar-link"
              onClick={l.onClick}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", gap: "var(--space)" }}>
          <button
            type="button"
            className="topbar-sound"
            onClick={onToggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Sound on" : "Sound off"}
          >
            <Icon name={soundOn ? "soundOn" : "soundOff"} />
          </button>
          <button
            type="button"
            className="topbar-menu-button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Menu"
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="menu-sheet" aria-label="Menu">
          {links.map((l) => (
            <button
              key={l.label}
              type="button"
              className="topbar-link"
              onClick={() => {
                setMenuOpen(false);
                l.onClick();
              }}
            >
              {l.label}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
