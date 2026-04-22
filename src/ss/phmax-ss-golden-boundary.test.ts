import { describe, expect, it } from "vitest";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { getIntervalForAverage } from "./phmax-ss-helpers";
import { calculatePhmaxRow, chooseDefaultMode } from "./phmax-ss-service";

describe("SŠ golden matrix", () => {
  it("počítá referenční scénáře přesně podle datasetu", () => {
    const cases = [
      {
        input: { code: "39-41-L/01", averageStudents: 17, classCount: 2, mode: "oneObor" as const, form: "denni" as const },
        expected: {
          intervalLabel: "17 - 20",
          phmaxPerClass: 50,
          coefficient: 1,
          adjustedPhmaxPerClass: 50,
          totalPhmax: 100,
        },
      },
      {
        input: { code: "39-41-L/01", averageStudents: 17, classCount: 2, mode: "oneObor" as const, form: "vecerni" as const },
        expected: {
          intervalLabel: "17 - 20",
          phmaxPerClass: 50,
          coefficient: 0.3,
          adjustedPhmaxPerClass: 15,
          totalPhmax: 30,
        },
      },
      {
        input: { code: "78-62-C/01", averageStudents: 4, classCount: 1, mode: "oneObor" as const, form: "denni" as const },
        expected: {
          intervalLabel: "4 - 6",
          phmaxPerClass: 30,
          coefficient: 1,
          adjustedPhmaxPerClass: 30,
          totalPhmax: 30,
        },
      },
      {
        input: { code: "82-51-L/01", averageStudents: 10, classCount: 1, mode: "twoObory82" as const, form: "denni" as const },
        expected: {
          intervalLabel: "5 - 10",
          phmaxPerClass: 50,
          coefficient: 1,
          adjustedPhmaxPerClass: 50,
          totalPhmax: 50,
        },
      },
      {
        input: { code: "82-51-L/01", averageStudents: 13, classCount: 1, mode: "threePlusObory82" as const, form: "denni" as const },
        expected: {
          intervalLabel: "více než 12",
          phmaxPerClass: 75,
          coefficient: 1,
          adjustedPhmaxPerClass: 75,
          totalPhmax: 75,
        },
      },
    ];

    for (const c of cases) {
      const out = calculatePhmaxRow(phmaxSsDataset, c.input).row;
      expect(out.intervalLabel).toBe(c.expected.intervalLabel);
      expect(out.phmaxPerClass).toBe(c.expected.phmaxPerClass);
      expect(out.coefficient).toBe(c.expected.coefficient);
      expect(out.adjustedPhmaxPerClass).toBe(c.expected.adjustedPhmaxPerClass);
      expect(out.totalPhmax).toBe(c.expected.totalPhmax);
    }
  });
});

describe("SŠ hraniční pásma a auto-režim", () => {
  it("drží správné pásmo na hranách intervalů", () => {
    const boundaries = [
      { avg: 14, label: "více než 12 - 14", value: 33 },
      { avg: 14.01, label: "více než 14 - méně než 17", value: 37 },
      { avg: 16.99, label: "více než 14 - méně než 17", value: 37 },
      { avg: 17, label: "17 - 20", value: 50 },
    ];
    for (const b of boundaries) {
      const interval = getIntervalForAverage(phmaxSsDataset, {
        code: "39-41-L/01",
        averageStudents: b.avg,
        mode: "oneObor",
      });
      expect(interval.label).toBe(b.label);
      expect(interval.value).toBe(b.value);
    }
  });

  it("volí auto režim správně i pro talentové obory 82", () => {
    expect(
      chooseDefaultMode(phmaxSsDataset, {
        code: "82-51-L/01",
        oborCountInClass: 2,
        isArt82TalentClass: true,
      }),
    ).toBe("twoObory82");

    expect(
      chooseDefaultMode(phmaxSsDataset, {
        code: "82-51-L/01",
        oborCountInClass: 3,
        isArt82TalentClass: true,
      }),
    ).toBe("threePlusObory82");

    // Obor 82-51-L/51 nemá 82-specifické režimy; fallback je obecný twoObory.
    expect(
      chooseDefaultMode(phmaxSsDataset, {
        code: "82-51-L/51",
        oborCountInClass: 2,
        isArt82TalentClass: true,
      }),
    ).toBe("twoObory");
  });
});
