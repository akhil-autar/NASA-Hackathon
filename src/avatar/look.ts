// The player's astronaut. The same look is drawn in 2D (picker, HUD) and in
// the 3D outpost, so the child sees themselves inside the game.
import type { Key } from "../i18n";

export interface AvatarLook {
  name: string;
  suit: SuitId;
  visor: VisorId;
  extra: ExtraId;
  patch: PatchId;
}

export const SUITS = {
  white: { color: "#ecebe6", trim: "#9aa3ad" },
  orange: { color: "#f08a2c", trim: "#7a3f12" },
  blue: { color: "#3f7fd1", trim: "#1d3d6b" },
  green: { color: "#3fa36b", trim: "#1d5236" },
  purple: { color: "#8a5bd6", trim: "#432a6e" },
  red: { color: "#d8513b", trim: "#6e2316" },
} as const;
export type SuitId = keyof typeof SUITS;

export const VISORS = {
  gold: "#d4a23a",
  silver: "#b9c2cc",
  blue: "#3aa0d4",
  pink: "#e27aa8",
} as const;
export type VisorId = keyof typeof VISORS;

export const EXTRAS = ["none", "antenna", "lamp", "fin"] as const;
export type ExtraId = (typeof EXTRAS)[number];

export const PATCHES = ["star", "moon", "rocket", "heart"] as const;
export type PatchId = (typeof PATCHES)[number];

export const SUIT_IDS = Object.keys(SUITS) as SuitId[];
export const VISOR_IDS = Object.keys(VISORS) as VisorId[];

export const SUIT_LABEL: Record<SuitId, Key> = {
  white: "suit.white",
  orange: "suit.orange",
  blue: "suit.blue",
  green: "suit.green",
  purple: "suit.purple",
  red: "suit.red",
};
export const VISOR_LABEL: Record<VisorId, Key> = {
  gold: "visor.gold",
  silver: "visor.silver",
  blue: "visor.blue",
  pink: "visor.pink",
};
export const EXTRA_LABEL: Record<ExtraId, Key> = {
  none: "extra.none",
  antenna: "extra.antenna",
  lamp: "extra.lamp",
  fin: "extra.fin",
};
export const PATCH_LABEL: Record<PatchId, Key> = {
  star: "patch.star",
  moon: "patch.moon",
  rocket: "patch.rocket",
  heart: "patch.heart",
};

export const DEFAULT_LOOK: AvatarLook = {
  name: "",
  suit: "orange",
  visor: "gold",
  extra: "antenna",
  patch: "star",
};

/** Fill any missing or unknown field (e.g. from an older save). */
export function normalizeLook(l: Partial<AvatarLook> | null | undefined): AvatarLook {
  const x = { ...DEFAULT_LOOK, ...(l ?? {}) };
  if (!(x.suit in SUITS)) x.suit = DEFAULT_LOOK.suit;
  if (!(x.visor in VISORS)) x.visor = DEFAULT_LOOK.visor;
  if (!EXTRAS.includes(x.extra)) x.extra = DEFAULT_LOOK.extra;
  if (!PATCHES.includes(x.patch)) x.patch = DEFAULT_LOOK.patch;
  x.name = String(x.name ?? "").slice(0, 16);
  return x;
}

export function randomLook(name: string): AvatarLook {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
  return {
    name,
    suit: pick(SUIT_IDS),
    visor: pick(VISOR_IDS),
    extra: pick(EXTRAS),
    patch: pick(PATCHES),
  };
}
