import { describe, expect, it } from "vitest";
import {
  appendSentencePeriod,
  formatSchoolTypeForReport,
  normalizeOptionalText,
} from "./vyrocni-zprava-text-formatting-helpers";

describe("vyrocni-zprava-text-formatting-helpers", () => {
  it("appendSentencePeriod ponechá ukončenou větu beze změny", () => {
    expect(appendSentencePeriod("Text.")).toBe("Text.");
    expect(appendSentencePeriod("Text?")).toBe("Text?");
  });

  it("appendSentencePeriod doplní tečku pokud chybí", () => {
    expect(appendSentencePeriod("Text")).toBe("Text.");
  });

  it("normalizeOptionalText vrací undefined pro prázdný vstup", () => {
    expect(normalizeOptionalText("   ")).toBeUndefined();
    expect(normalizeOptionalText(" Text ")).toBe("Text");
  });

  it("formatSchoolTypeForReport převede kód typu školy na popisek", () => {
    expect(formatSchoolTypeForReport("ZAKLADNI_SKOLA")).toBe("Základní škola");
    expect(formatSchoolTypeForReport("Základní škola")).toBe("Základní škola");
    expect(formatSchoolTypeForReport("   ")).toBeUndefined();
  });
});
