import { loadJson, saveJson } from "./local";
import { normalizeLook, type AvatarLook } from "../avatar/look";

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
  /** The player's own astronaut. */
  avatar: AvatarLook;
}

const KEY = "profile";

export function loadProfile(): Profile {
  const p = loadJson<Partial<Profile>>(KEY, {});
  return {
    birthday: p.birthday ?? null,
    crew: p.crew ?? null,
    onboarded: !!p.onboarded,
    avatar: normalizeLook(p.avatar),
  };
}

export function saveProfile(p: Profile): void {
  saveJson(KEY, p);
}
