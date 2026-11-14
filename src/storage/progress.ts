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
export const BADGES: Record<string, { name: string }> = {
  firstMission: { name: "First mission" },
  newStrategy: { name: "New plan" },
  threeStars: { name: "Perfect sol" },
  shelterMaster: { name: "Safe and sound" },
  scientist: { name: "Rock star" },
  roverExplorer: { name: "Rover explorer" },
  dareTaker: { name: "Dare taker" },
};
