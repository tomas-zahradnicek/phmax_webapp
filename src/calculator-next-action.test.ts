import { describe, expect, it } from "vitest";
import { buildCalculatorNextAction, formatWhatNowMessage } from "./calculator-next-action";

describe("formatWhatNowMessage", () => {
  it("spojí problém a nápravu šipkou", () => {
    expect(formatWhatNowMessage("Chybí průměr u pracoviště 2", "doplňte denní dobu")).toBe(
      "Chybí průměr u pracoviště 2 → doplňte denní dobu",
    );
  });
});

describe("buildCalculatorNextAction", () => {
  it("prázdný formulář používá sjednocený tón", () => {
    const action = buildCalculatorNextAction({
      verdict: { tone: "neutral", label: "–", detail: "–" },
      hasData: false,
    });
    expect(action.message).toContain("→");
    expect(action.message).toContain("Formulář je prázdný");
  });
});
