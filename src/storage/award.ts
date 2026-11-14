import type { MissionOutcome, Plan } from "../sim/types";
import type { DareId } from "../sim/dares";
import type { Progress } from "./progress";

/** A coarse fingerprint of a plan, used to notice a new strategy. */
export function strategyKey(plan: Plan): string {
  const lead = (["lifeSupport", "shielding", "science"] as const).reduce(
    (a, b) => (plan[b] > plan[a] ? b : a),
  );
  return lead;
}

export interface AwardResult {
  progress: Progress;
  newBadges: string[];
  logLine: string;
}

/**
 * Fold a finished mission into the saved progress: add stars, award badges
 * (which reward trying a new strategy, not only winning), and append one short
 * Commander's-log line written from the child's own choices.
 */
export function award(
  prev: Progress,
  outcome: MissionOutcome,
  plan: Plan,
  dares: DareId[],
  sol: number,
): AwardResult {
  const newBadges: string[] = [];
  const badges = new Set(prev.badges);

  const add = (id: string) => {
    if (!badges.has(id)) {
      badges.add(id);
      newBadges.push(id);
    }
  };

  if (prev.missionsPlayed === 0) add("firstMission");

  const key = strategyKey(plan);
  const strategiesTried = [...prev.strategiesTried];
  if (!strategiesTried.includes(key)) {
    strategiesTried.push(key);
    // Reward trying a new leading strategy (but not on the very first mission,
    // which already gets "first mission").
    if (prev.missionsPlayed > 0) add("newStrategy");
  }

  if (outcome.stars >= 3) add("threeStars");
  if (outcome.crewSafe && outcome.radiationLow) add("shelterMaster");
  if (outcome.scienceGoalMet) add("scientist");
  if (dares.length > 0) add("dareTaker");

  const logLine = makeLogLine(outcome, plan, sol);

  const progress: Progress = {
    totalStars: prev.totalStars + outcome.stars,
    missionsPlayed: prev.missionsPlayed + 1,
    badges: [...badges],
    log: [...prev.log, { at: new Date().toISOString(), text: logLine }].slice(-50),
    strategiesTried,
  };

  return { progress, newBadges, logLine };
}

/** A short diary line written from what the child did and what happened. */
function makeLogLine(outcome: MissionOutcome, plan: Plan, sol: number): string {
  const lead = strategyKey(plan);
  const leadWord =
    lead === "shielding" ? "hid the crew in the shelter"
    : lead === "science" ? "pushed the science"
    : "kept the crew warm";
  const result = outcome.success
    ? "We did it."
    : outcome.scienceGoalMet
      ? "We lost some comfort."
      : "We lost a day of science.";
  return `Sol ${sol}: I ${leadWord}. ${result}`;
}
