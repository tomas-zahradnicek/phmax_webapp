import { describe, expect, it } from "vitest";
import { comparePhmaxProductVariants } from "./phmax-product-compare";
import { createPvProductAuditProtocol, createSdProductAuditProtocol } from "./phmax-product-audit";

describe("Compare contract", () => {
  it("vrací stabilní strukturu výsledku", () => {
    const a = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const b = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 2, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);

    const out = comparePhmaxProductVariants([
      { id: "a", label: "Varianta A", protocol: a },
      { id: "b", label: "Varianta B", protocol: b },
    ]);

    expect(out.variants).toHaveLength(2);
    expect(out.metrics).toHaveLength(2);
    expect(out.comparison.totalPrimary).toHaveLength(2);
    expect(out.comparison.totalSecondary).toHaveLength(2);
    expect(typeof out.recommendation).toBe("string");
  });

  it("pro identické vstupy nevyrábí falešné rozdíly", () => {
    const a = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const b = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);

    const out = comparePhmaxProductVariants([
      { id: "a", label: "Varianta A", protocol: a },
      { id: "b", label: "Varianta B", protocol: b },
    ]);
    expect(out.differences).toEqual([]);
  });

  it("hlásí rozdíl totalPrimary i validačního stavu", () => {
    const a = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const b = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 2, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const bInvalid = {
      ...b,
      validation: { ...b.validation, ok: false },
    };

    const out = comparePhmaxProductVariants([
      { id: "a", label: "Varianta A", protocol: a },
      { id: "b", label: "Varianta B", protocol: bInvalid },
    ]);

    expect(out.differences.some((line) => line.includes("PHmax (primární metrika)"))).toBe(true);
    expect(out.differences.some((line) => line.includes("Validace"))).toBe(true);
  });

  it("u mixu produktů vrací orientační varování", () => {
    const pv = createPvProductAuditProtocol([
      { label: "PV", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const sd = createSdProductAuditProtocol({
      pupilsFirstGrade: 80,
      manualDepts: true,
      departments: 4,
    });

    const out = comparePhmaxProductVariants([
      { id: "pv", label: "PV", protocol: pv },
      { id: "sd", label: "ŠD", protocol: sd },
    ]);

    expect(out.differences.some((line) => line.includes("Produkt se liší"))).toBe(true);
  });
});
