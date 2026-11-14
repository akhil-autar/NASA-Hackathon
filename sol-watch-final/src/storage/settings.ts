import { loadJson, saveJson } from "./local";
import { LANGS, type Lang } from "../i18n";

export interface Settings {
  soundOn: boolean;
  /** "Show me the numbers": replace pictures with real values and units. */
  showNumbers: boolean;
  /** Game language. */
  lang: Lang;
}

const KEY = "settings";

export function loadSettings(): Settings {
  const s = loadJson<Partial<Settings>>(KEY, {});
  const lang = LANGS.some((l) => l.id === s.lang) ? (s.lang as Lang) : "en";
  return { soundOn: s.soundOn ?? true, showNumbers: s.showNumbers ?? false, lang };
}

export function saveSettings(s: Settings): void {
  saveJson(KEY, s);
}
