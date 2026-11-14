import { loadJson, saveJson } from "./local";

export interface LogEntry {
  /** ISO timestamp when written. */
  at: string;
  /** Short diary line written from the child's own choices. */
  text: string;
}

export interface Progress {
  totalStars: number;
  missionsPlayed: number;
  /** Badge ids the child has earned. */
  badges: string[];
  /** Commander's log, newest last. */
  log: LogEntry[];
  /** Strategy fingerprints seen, so we can reward trying new ones. */
  strategiesTried: string[];
}

const KEY = "progress";

export function loadProgress(): Progress {
  return loadJson<Progress>(KEY, {
    totalStars: 0,
    missionsPlayed: 0,
    badges: [],
    log: [],
    strategiesTried: [],
  });
}

export function saveProgress(p: Progress): void {
  saveJson(KEY, p);
}

/** All badges the game can award. Badges reward trying, not only winning. */
export const BADGES: Record<string, { name: string; name_ms: string }> = {
  firstMission: { name: "First mission", name_ms: "Misi pertama" },
  newStrategy: { name: "New plan", name_ms: "Pelan baharu" },
  threeStars: { name: "Perfect sol", name_ms: "Sol sempurna" },
  shelterMaster: { name: "Safe and sound", name_ms: "Selamat sejahtera" },
  scientist: { name: "Rock star", name_ms: "Bintang batu" },
  roverExplorer: { name: "Rover explorer", name_ms: "Peneroka rover" },
  dareTaker: { name: "Dare taker", name_ms: "Berani mencuba" },
};
