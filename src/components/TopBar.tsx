import { useState } from "react";
import { APP_NAME } from "../config";
import { Icon } from "./Icon";
import { LANGS, useT, type Lang } from "../i18n";

export interface TopBarLink {
  label: string;
  onClick: () => void;
}

interface Props {
  links: TopBarLink[];
  soundOn: boolean;
  onToggleSound: () => void;
  /** Tapping the game name goes back to the home page. */
  onHome: () => void;
  lang: Lang;
  onLang: (l: Lang) => void;
}

/**
 * The top bar: the game name, the four secondary destinations as plain text
 * links (laptop/tablet), and a sound toggle. On a phone the links collapse into
 * a menu button that opens a simple sheet.
 */
export function TopBar({ links, soundOn, onToggleSound, onHome, lang, onLang }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useT();
  const nextLang = LANGS[(LANGS.findIndex((l) => l.id === lang) + 1) % LANGS.length];

  return (
    <>
      <header className="topbar">
        <h1 className="topbar-name">
          <button
            type="button"
            className="topbar-home"
            onClick={() => {
              setMenuOpen(false);
              onHome();
            }}
            aria-label={t("nav.home")}
            title={t("nav.home")}
          >
            {APP_NAME}
          </button>
        </h1>

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
            className="topbar-lang"
            onClick={() => onLang(nextLang.id)}
            aria-label={`${t("nav.language")}: ${nextLang.name}`}
            title={`${t("nav.language")}: ${nextLang.name}`}
          >
            {LANGS.map((l) => (
              <span key={l.id} className={l.id === lang ? "lang-pill on" : "lang-pill"}>
                {l.short}
              </span>
            ))}
          </button>
          <button
            type="button"
            className="topbar-sound"
            onClick={onToggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? t("nav.soundOn") : t("nav.soundOff")}
          >
            <Icon name={soundOn ? "soundOn" : "soundOff"} />
          </button>
          <button
            type="button"
            className="topbar-menu-button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={t("nav.menu")}
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="menu-sheet" aria-label={t("nav.menu")}>
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
