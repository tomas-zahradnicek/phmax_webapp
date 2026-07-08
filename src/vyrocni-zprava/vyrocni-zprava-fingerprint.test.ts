import { describe, expect, it, vi } from "vitest";

import { buildAnnualReportInputFingerprint } from "./vyrocni-zprava-fingerprint";

describe("vyrocni-zprava-fingerprint", () => {
  it("stejná data vrací stejný fingerprint", () => {
    const input = { schoolYear: "2024/2025", notes: "A", counts: { pupils: 320 } };
    expect(buildAnnualReportInputFingerprint(input)).toBe(buildAnnualReportInputFingerprint(input));
  });

  it("změna relevantního pole fingerprint změní", () => {
    const a = buildAnnualReportInputFingerprint({ schoolYear: "2024/2025", notes: "A" });
    const b = buildAnnualReportInputFingerprint({ schoolYear: "2024/2025", notes: "B" });
    expect(a).not.toBe(b);
  });

  it("známé prezentační klíče z denylistu fingerprint nezmění", () => {
    const a = buildAnnualReportInputFingerprint({ schoolYear: "2024/2025", notes: "A" });
    const b = buildAnnualReportInputFingerprint({
      schoolYear: "2024/2025",
      notes: "A",
      __expanded: true,
      __selected: "01",
      __uiState: { panel: "left" },
    });
    expect(a).toBe(b);
  });

  it("neznámý klíč s prefixem __ není automaticky ignorován", () => {
    const a = buildAnnualReportInputFingerprint({ schoolYear: "2024/2025", notes: "A", __contentVersion: "v1" });
    const b = buildAnnualReportInputFingerprint({ schoolYear: "2024/2025", notes: "A", __contentVersion: "v2" });
    expect(a).not.toBe(b);
  });

  it("pořadí klíčů objektu fingerprint nezmění", () => {
    const a = buildAnnualReportInputFingerprint({ b: 2, a: 1, nested: { z: 1, x: 2 } });
    const b = buildAnnualReportInputFingerprint({ a: 1, nested: { x: 2, z: 1 }, b: 2 });
    expect(a).toBe(b);
  });

  it("undefined, prázdná a chybějící hodnota jsou konzistentní", () => {
    const missing = buildAnnualReportInputFingerprint({ a: 1 });
    const undefinedValue = buildAnnualReportInputFingerprint({ a: 1, optional: undefined });
    const empty = buildAnnualReportInputFingerprint({ a: 1, optional: "" });
    expect(missing).toBe(undefinedValue);
    expect(empty).not.toBe(missing);
  });

  it("nevypisuje fingerprint ani vstupní data do logů", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    buildAnnualReportInputFingerprint({ schoolYear: "2024/2025", notes: "citlivý text" });
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
