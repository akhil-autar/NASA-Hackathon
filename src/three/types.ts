// Plain types shared between screens and the 3D scenes. No three.js imports
// here, so screens can use them without loading the 3D code.

/** Where the camera looks. */
export type OutpostShot =
  | "intro" // tilt down from the Sun to the base, once
  | "wide" // the whole base
  | "shelter" // the storm shelter door
  | "rover" // the rover and its track
  | "habitat" // habitat and greenhouse
  | "commander" // over the player's shoulder, at the command post
  | "fall" // facing the player, for the game-over fall
  | "result"; // slow orbit of the whole base

/** Everything the outpost scene shows. Every field is real game state. */
export interface OutpostVisual {
  /** Power shares, 0..1 each. */
  lifeSupport: number;
  shielding: number;
  science: number;
  /** Battery, 0..100. */
  battery: number;
  /** Greenhouse plant health, 0..100. */
  greenhouse: number;
  /** Storm strength right now (0 = calm; about 1 = medium; 3+ = giant). */
  storm: number;
  /** Dust storm dimming the panels. */
  dust: boolean;
  /** Game hour, 0..24. Sets where the Sun is in the sky. */
  hour: number;
  /** True when the crew can reach the shelter (false = caught outside). */
  crewSheltered: boolean;
  /** Rover-run choice, 0..1. When set, the rover sits at this distance. */
  roverOut?: number;
  shot: OutpostShot;
  /** The player's own astronaut, standing at the command post. */
  player?: PlayerVisual;
}

/** How the player's astronaut looks and what is happening to them. */
export interface PlayerVisual {
  suit: string;
  trim: string;
  visor: string;
  extra: "none" | "antenna" | "lamp" | "fin";
  /** "down" = hit by the storm and knocked over (game over). */
  state: "idle" | "down";
}

/** What the Sun scene shows. */
export interface SunVisual {
  /** 0 = quiet, about 0.45 = medium (M class), 0.75 = strong, 1 = giant. */
  activity: number;
  /** Changes when a different storm is picked, to move the active region. */
  seed: number;
}

/** Turn a real flare class into Sun activity for the scene. */
export function activityFor(flareClass: "M" | "X" | null, magnitude: number): number {
  if (!flareClass) return 0.05;
  if (flareClass === "M") return Math.min(0.55, 0.35 + magnitude * 0.02);
  return Math.min(1, 0.62 + Math.sqrt(magnitude) * 0.13);
}
