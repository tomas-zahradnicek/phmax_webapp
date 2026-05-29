import { describe, expect, it } from "vitest";
import { buildZsShareText } from "./zs-share-text";

describe("buildZsShareText", () => {
  it("obsahuje hlavní metriky a režim", () => {
    const text = buildZsShareText({
      modeLabel: "Úplná ZŠ",
      tab: "PHmax",
      totalPhmax: 100,
      totalPha: 20,
      totalPhp: 300,
      warnings: [],
      inputMode: "own",
    });
    expect(text).toContain("Výsledek PHmax: 100");
    expect(text).toContain("Režim: Úplná ZŠ");
  });

  it("přidá upozornění pokud existují", () => {
    const text = buildZsShareText({
      modeLabel: "Úplná ZŠ",
      tab: "PHmax",
      totalPhmax: 0,
      totalPha: 0,
      totalPhp: 0,
      warnings: ["Test varování"],
      inputMode: "example",
    });
    expect(text).toContain("Test varování");
  });
});
