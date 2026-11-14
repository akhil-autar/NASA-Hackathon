// Turns a finished mission into the words on the result screen, built from
// what really happened: the plan the child chose, the storm, the battery, the
// rover trip and the final scores. Pure: no UI, no language. It returns
// translation keys plus the numbers to fill in.
import type { Key } from "../i18n/strings";
import { RADIATION_BADGE_LIMIT, SCIENCE_GOAL } from "../data/constants";
import type { Corner, MissionOutcome, Plan, Storm } from "./types";

export type Cause = "radiation" | "caught" | "battery" | "cold";
export type Kind = "win" | "noScience" | "gameOver";

export interface Line {
  key: Key;
  vars?: Record<string, string | number>;
}

export interface Explanation {
  kind: Kind;
  /** Only for game over: the main thing that went wrong. */
  cause?: Cause;
  happened: Line;
  why: Line;
  cost: Line;
  tip: Line;
  fact: { key: Key; link: string };
  dose: number;
  limit: number;
}

const CORNER_KEY: Record<Corner, Key> = {
  lifeSupport: "corner.lifeSupport",
  shielding: "corner.shielding",
  science: "corner.science",
};

const FACTS = {
  limit: {
    key: "fact.limit" as Key,
    link: "https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf",
  },
  mars: { key: "fact.mars" as Key, link: "https://doi.org/10.1126/science.1244797" },
  lettuce: {
    key: "fact.lettuce" as Key,
    link: "https://phys.org/news/2015-08-meals-ready-crew-members-sample.html",
  },
};

const pct = (n: number) => Math.round(n * 100);

export interface ExplainInput {
  outcome: MissionOutcome;
  /** The plan before the storm. */
  plan: Plan;
  /** The plan the child switched to when the storm arrived, if any. */
  planAtStorm?: Plan;
  storm: Storm;
  /** The rover trip ran too long (crew caught outside). */
  roverCaught: boolean;
  /** Words for the storm size, e.g. "a giant storm" (already translated key). */
  stormWordKey: Key;
}

export function explain({
  outcome,
  plan,
  planAtStorm,
  storm,
  roverCaught,
  stormWordKey,
}: ExplainInput): Explanation {
  const f = outcome.finalState;
  const storming = planAtStorm ?? plan;
  const limit = RADIATION_BADGE_LIMIT.value;
  const dose = Math.round(f.radiationBadge);
  const batteryEmpty = outcome.trace.some((r) => r.battery <= 0.5) || f.battery <= 0.5;
  const stormHours = outcome.trace.filter((r) => r.stormStrength > 0).length;

  // The cost line: which corner got the most, and what that left for the rest.
  const shares: [Corner, number][] = [
    ["lifeSupport", storming.lifeSupport],
    ["shielding", storming.shielding],
    ["science", storming.science],
  ];
  shares.sort((a, b) => b[1] - a[1]);
  const cost: Line = {
    key: "x.cost",
    vars: {
      top: pct(shares[0][1]),
      corner: CORNER_KEY[shares[0][0]],
      other1: CORNER_KEY[shares[1][0]],
      other2: CORNER_KEY[shares[2][0]],
      bat: Math.round(f.battery),
    },
  };

  const sh = pct(storming.shielding);
  const sci = pct(plan.science);
  const ls = pct(Math.min(plan.lifeSupport, storming.lifeSupport));

  // --- Game over: radiation over the limit, or the crew got too cold ---
  if (!outcome.radiationLow || !outcome.crewSafe) {
    let cause: Cause;
    let why: Line;
    let tip: Line;
    let happened: Line;
    if (!outcome.radiationLow) {
      happened = { key: "x.happened.radiation", vars: { dose, limit } };
      if (roverCaught) {
        cause = "caught";
        why = { key: "x.why.radiationCaught" };
        tip = { key: "x.tip.caught" };
      } else if (batteryEmpty) {
        cause = "radiation";
        why = { key: "x.why.radiationBattery" };
        tip = { key: "x.tip.battery" };
      } else if (storming.shielding < 0.5) {
        cause = "radiation";
        why = { key: "x.why.radiationLowShield", vars: { sh } };
        tip = { key: "x.tip.radiation" };
      } else {
        cause = "radiation";
        why = { key: "x.why.radiationBig", vars: { s: stormWordKey, sh, hrs: stormHours } };
        tip = { key: "x.tip.radiation" };
      }
    } else {
      happened = { key: "x.happened.cold", vars: { comfort: Math.round(f.comfort) } };
      if (batteryEmpty) {
        cause = "battery";
        why = { key: "x.why.coldBattery" };
        tip = { key: "x.tip.battery" };
      } else {
        cause = "cold";
        why = { key: "x.why.coldLife", vars: { ls } };
        tip = { key: "x.tip.cold" };
      }
    }
    return {
      kind: "gameOver",
      cause,
      happened,
      why,
      cost,
      tip,
      fact: cause === "cold" || cause === "battery" ? FACTS.lettuce : FACTS.limit,
      dose,
      limit,
    };
  }

  // --- Crew safe but the science job is unfinished ---
  if (!outcome.scienceGoalMet) {
    return {
      kind: "noScience",
      happened: {
        key: "x.happened.noScience",
        vars: { sci: Math.round((f.science / SCIENCE_GOAL.value) * 100), dose },
      },
      why: { key: "x.why.noScience", vars: { sci } },
      cost,
      tip: { key: "x.tip.noScience" },
      fact: FACTS.mars,
      dose,
      limit,
    };
  }

  // --- Full win ---
  const lucky = storming.shielding < 0.3;
  return {
    kind: "win",
    happened: { key: "x.happened.win", vars: { dose, limit } },
    why:
      lucky
        ? { key: "x.why.winSmall", vars: { sh, sci } }
        : { key: "x.why.win", vars: { sh, sci } },
    cost,
    tip: { key: lucky ? "x.tip.winLucky" : "x.tip.win" },
    fact: storm.flareClass === "X" ? FACTS.limit : FACTS.mars,
    dose,
    limit,
  };
}
