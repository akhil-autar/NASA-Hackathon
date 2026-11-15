import { describe, expect, it } from "vitest";
import {
  KP_WORDS,
  auroraLatitude,
  gfzUrl,
  kpLabel,
  kpLevel,
  kpWhole,
  kpWindow,
  maxKpFrom,
} from "./kp";

describe("kpWindow", () => {
  it("covers the flare's day and the three days after", () => {
    expect(kpWindow("2017-09-06T12:02Z")).toEqual({ from: "2017-09-06", to: "2017-09-09" });
    expect(kpWindow("2024-12-30T23:59Z")).toEqual({ from: "2024-12-30", to: "2025-01-02" });
  });
});

describe("gfzUrl", () => {
  it("uses GFZ's documented web service format", () => {
    expect(gfzUrl("2024-05-10", "2024-05-13")).toBe(
      "https://kp.gfz.de/app/json/?start=2024-05-10T00:00:00Z&end=2024-05-13T23:59:59Z&index=Kp",
    );
  });
});

describe("maxKpFrom", () => {
  it("finds the highest reading and its time", () => {
    const r = maxKpFrom({
      datetime: ["2017-09-08T00:00:00Z", "2017-09-08T03:00:00Z", "2017-09-08T12:00:00Z"],
      Kp: [6.667, 7.667, 8.333],
      status: ["def", "def", "def"],
    });
    expect(r).toEqual({ maxKp: 8.333, maxTime: "2017-09-08T12:00:00Z", status: "def" });
  });
  it("skips missing values and returns null when there are none", () => {
    expect(maxKpFrom({ datetime: ["a", "b"], Kp: [-1, null] })).toBeNull();
    expect(maxKpFrom({})).toBeNull();
    expect(maxKpFrom({ datetime: ["a", "b"], Kp: [-1, 2.333], status: ["now", "now"] })).toEqual({
      maxKp: 2.333,
      maxTime: "b",
      status: "now",
    });
  });
});

describe("Kp in plain numbers and words", () => {
  it("writes thirds the way scientists do", () => {
    expect(kpLabel(8)).toBe("8o");
    expect(kpLabel(8.333)).toBe("8+");
    expect(kpLabel(7.667)).toBe("8-");
    expect(kpLabel(9)).toBe("9o");
  });
  it("rounds to the whole number a child sees", () => {
    expect(kpWhole(8.333)).toBe(8);
    expect(kpWhole(8.667)).toBe(9);
    expect(kpWhole(0)).toBe(0);
  });
  it("follows NOAA's G scale: Kp 5 = G1 up to Kp 9 = G5", () => {
    expect(kpLevel(2)).toEqual({ level: "calm", g: 0 });
    expect(kpLevel(4)).toEqual({ level: "unsettled", g: 0 });
    expect(kpLevel(5)).toEqual({ level: "minor", g: 1 });
    expect(kpLevel(6)).toEqual({ level: "moderate", g: 2 });
    expect(kpLevel(7)).toEqual({ level: "strong", g: 3 });
    expect(kpLevel(8.333)).toEqual({ level: "severe", g: 4 });
    expect(kpLevel(8.667)).toEqual({ level: "extreme", g: 5 });
  });
  it("has words in both languages for every level", () => {
    for (const w of Object.values(KP_WORDS)) {
      expect(w.title[0] && w.title[1] && w.words[0] && w.words[1]).toBeTruthy();
    }
    expect(KP_WORDS.severe.words[0]).toContain("far from the poles");
  });
  it("moves the aurora away from the pole as Kp rises", () => {
    expect(auroraLatitude(0)).toBeGreaterThan(auroraLatitude(5));
    expect(auroraLatitude(5)).toBeGreaterThan(auroraLatitude(9));
  });
});
