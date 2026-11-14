import { loadJson, saveJson } from "./local";

export interface CrewNames {
  doctor: string;
  engineer: string;
  scientist: string;
}

export interface Profile {
  /** Birthday as YYYY-MM-DD, or null if skipped. */
  birthday: string | null;
  crew: CrewNames | null;
  /** Whether the child has finished the welcome screen. */
  onboarded: boolean;
}

const KEY = "profile";

export function loadProfile(): Profile {
  return loadJson<Profile>(KEY, {
    birthday: null,
    crew: null,
    onboarded: false,
  });
}

export function saveProfile(p: Profile): void {
  saveJson(KEY, p);
}
