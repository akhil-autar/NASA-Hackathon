import { describe, expect, it } from "vitest";
import { explain } from "./explain";
import { initialState, runMission } from "./mission";
import type { Plan, Storm } from "./types";

// The result screen must describe what the child actually did, so different
// plans must give different explanations.
const strong: Storm = {
  id: "test-strong",
  peakTime: "2017-09-06T00:00:00Z",
  flareClass: "X",
  magnitude: 9.3,
  arrivalHour: 10,
  durationHours: 4,
  warningSource: "game estimate",
  source: "game estimate",
};
const weak: Storm = { ...strong, id: "test-weak", flareClass: "M", magnitude: 1 };

const plan = (ls: number, sh: number, sci: number): Plan => ({
  lifeSupport: ls,
  shielding: sh,
  science: sci,
});

function run(p: Plan, storm: Storm, roverCaught = false) {
  const outcome = runMission(initialState(), p, storm, 7);
  return explain({ outcome, plan: p, storm, roverCaught, stormWordKey: "storm.giant" });
}

describe("result explanations follow the plan", () => {
  it("all science in a giant storm: game over from radiation", () => {
    const x = run(plan(0.3, 0, 0.7), strong);
    expect(x.kind).toBe("gameOver");
    expect(x.cause).toBe("radiation");
    expect(x.happened.key).toBe("x.happened.radiation");
    expect(x.dose).toBeGreaterThanOrEqual(x.limit);
  });

  it("all shielding: crew safe but science unfinished", () => {
    const x = run(plan(0.3, 0.7, 0), weak);
    expect(x.kind).toBe("noScience");
    expect(x.why.key).toBe("x.why.noScience");
  });

  it("almost no life support: game over from the cold", () => {
    const x = run(plan(0, 0.5, 0.5), weak);
    expect(x.kind).toBe("gameOver");
    expect(["cold", "battery"]).toContain(x.cause);
  });

  it("rover caught outside is named as the cause", () => {
    const x = run(plan(0.3, 0, 0.7), strong, true);
    expect(x.cause).toBe("caught");
  });

  it("a sensible plan on a weak storm wins, and the numbers come from the plan", () => {
    const x = run(plan(0.3, 0.3, 0.4), weak);
    expect(x.kind).toBe("win");
    expect(x.why.key).toBe("x.why.win");
    expect(x.why.vars).toMatchObject({ sh: 30, sci: 40 });
  });

  it("different plans never give the same text", () => {
    const keys = [plan(0.3, 0, 0.7), plan(0.3, 0.7, 0), plan(0.3, 0.3, 0.4)].map((p) => {
      const x = run(p, p.science === 0.7 ? strong : weak);
      return `${x.happened.key}|${x.why.key}`;
    });
    expect(new Set(keys).size).toBe(3);
  });
});
