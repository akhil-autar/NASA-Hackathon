import { describe, expect, it } from "vitest";
import { cleanForSpeech, splitForSpeech } from "./speak";

describe("cleanForSpeech", () => {
  it("never reads emojis or symbols aloud", () => {
    expect(
      cleanForSpeech(
        "🌱 Air & warmth keeps the crew warm. 🛡️ The shelter blocks the storm. 🔬 Science makes discoveries.",
      ),
    ).toBe("Air and warmth keeps the crew warm. The shelter blocks the storm. Science makes discoveries.");
    expect(cleanForSpeech("☢️ Radiation is getting high!")).toBe("Radiation is getting high!");
    expect(cleanForSpeech("Let's go! 🚀")).toBe("Let's go!");
    expect(cleanForSpeech("🧑‍🚀 ⚡⚡⚡")).toBe("");
  });
});

describe("splitForSpeech", () => {
  it("says long lines one sentence at a time", () => {
    expect(splitForSpeech("One. Two! Three?")).toEqual(["One.", "Two!", "Three?"]);
    expect(splitForSpeech("No full stop")).toEqual(["No full stop"]);
  });
  it("breaks a very long sentence at a comma", () => {
    const long = `${"word ".repeat(30).trim()}, ${"more ".repeat(20).trim()}.`;
    const parts = splitForSpeech(long);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((p) => p.length <= 180)).toBe(true);
  });
});
