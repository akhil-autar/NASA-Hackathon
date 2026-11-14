import { loadJson, saveJson } from "./local";

export interface Settings {
  soundOn: boolean;
  /** "Show me the numbers": replace pictures with real values and units. */
  showNumbers: boolean;
}

const KEY = "settings";

export function loadSettings(): Settings {
  return loadJson<Settings>(KEY, { soundOn: true, showNumbers: false });
}

export function saveSettings(s: Settings): void {
  saveJson(KEY, s);
}
