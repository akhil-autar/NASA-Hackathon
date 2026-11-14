import { describe, expect, it } from "vitest";
import { initialState, runMission } from "./mission";
import type { Plan, Storm } from "./types";

// Three storms: weak (M-class), medium (X-class, small number), strong
// (X-class, big number). Timing is fixed so the tests are deterministic.
const weak: Storm = {
  id: "test-weak",
  peakTime: "2012-01-01T00:00:00Z",
  flareClass: "M",
  magnitude: 1.0,
  arrivalHour: 10,
  durationHours: 4,
  warningSource: "game estimate",
  source: "game estimate",
};
const medium: Storm = {
  ...weak,
  id: "test-medium",
  flareClass: "X",
  magnitude: 1.5,
};
const strong: Storm = {
  ...weak,
  id: "test-strong",
  flareClass: "X",
  magnitude: 9.3,
};

const allStorms = { weak, medium, strong };

// Helper plans (shares total 1.0, in 0.1 steps).
const plan = (ls: number, sh: number, sci: number): Plan => ({
  lifeSupport: ls,
  shielding: sh,
  science: sci,
});

const allShielding = plan(0, 1, 0);
const allScience = plan(0, 0, 1);
const middle = plan(0.4, 0.3, 0.3); // dot roughly in the middle

const SEED = 12345;

function run(p: Plan, storm: Storm) {
  return runMission(initialState(), p, storm, SEED);
}

describe("fairness", () => {
  // Everything on Shielding leaves no power for the lab, so the science goal
  // is always missed — on every storm.
  it("everything on Shielding misses the science goal on every storm", () => {
    for (const storm of Object.values(allStorms)) {
      const outcome = run(allShielding, storm);
      expect(outcome.scienceGoalMet).toBe(false);
      expect(outcome.success).toBe(false);
    }
  });

  // Everything on Science leaves no power for the shelter or life support, so
  // a medium or strong storm is lost (crew cold and/or badge too full).
  it("everything on Science loses in a medium or strong storm", () => {
    expect(run(allScience, medium).success).toBe(false);
    expect(run(allScience, strong).success).toBe(false);
  });

  // The easy "just balance it" answer does not beat the strongest storm.
  it("leaving the dot in the middle loses in a strong storm", () => {
    expect(run(middle, strong).success).toBe(false);
  });

  // The game must be winnable: there is a sensible plan that wins each storm.
  it("at least one sensible plan wins on every storm", () => {
    const sensiblePlans: Plan[] = [
      plan(0.3, 0.3, 0.4),
      plan(0.4, 0.2, 0.4),
      plan(0.3, 0.2, 0.5),
      plan(0.2, 0.4, 0.4),
      plan(0.4, 0.3, 0.3),
      plan(0.2, 0.3, 0.5),
    ];
    for (const [name, storm] of Object.entries(allStorms)) {
      const winner = sensiblePlans.find((p) => run(p, storm).success);
      expect(winner, `no winning plan for ${name} storm`).toBeDefined();
    }
  });
});
