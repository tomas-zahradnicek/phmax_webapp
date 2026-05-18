import { describe, expect, it } from "vitest";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { resolvePar16NvLookup } from "./phmax-ss-par16-calc";
import { calculatePhmaxRow } from "./phmax-ss-service";

const PAR16_CODE = "39-41-L/01";

describe("SŠ § 16 odst. 9 – golden výpočet pásem", () => {
  it("mapuje průměr na pásmo NV dle metodiky", () => {
    expect(resolvePar16NvLookup(5).rule).toBe("under6_scaled");
    expect(resolvePar16NvLookup(8).rule).toBe("band_6_10_as_17_20");
    expect(resolvePar16NvLookup(10).rule).toBe("band_6_10_as_17_20");
    expect(resolvePar16NvLookup(10.01).rule).toBe("band_10_14_as_20_24");
    expect(resolvePar16NvLookup(12).rule).toBe("band_10_14_as_20_24");
    expect(resolvePar16NvLookup(15).rule).toBe("standard");
  });

  it("počítá PHmax pro referenční obor 39-41-L/01 (denní forma)", () => {
    const cases = [
      {
        averageStudents: 8,
        phmaxPerClass: 50,
        adjustedPhmaxPerClass: 50,
        totalPhmax: 50,
        includesLabel: "17 - 20",
      },
      {
        averageStudents: 5,
        phmaxPerClass: 50,
        adjustedPhmaxPerClass: 35,
        totalPhmax: 35,
        includesLabel: "17 - 20",
      },
      {
        averageStudents: 12,
        phmaxPerClass: 53,
        adjustedPhmaxPerClass: 53,
        totalPhmax: 53,
        includesLabel: "více než 20",
      },
      {
        averageStudents: 17,
        phmaxPerClass: 50,
        adjustedPhmaxPerClass: 50,
        totalPhmax: 100,
        classCount: 2,
        includesLabel: "17 - 20",
      },
    ] as const;

    for (const c of cases) {
      const { row } = calculatePhmaxRow(phmaxSsDataset, {
        code: PAR16_CODE,
        averageStudents: c.averageStudents,
        classCount: "classCount" in c ? c.classCount : 1,
        form: "denni",
        isPar16Class: true,
      });
      expect(row.phmaxPerClass).toBe(c.phmaxPerClass);
      expect(row.adjustedPhmaxPerClass).toBe(c.adjustedPhmaxPerClass);
      expect(row.totalPhmax).toBe(c.totalPhmax);
      expect(row.intervalLabel).toContain(c.includesLabel);
      expect(row.intervalLabel).toContain("§ 16");
    }
  });

  it("bez příznaku § 16 použije běžné pásmo dle skutečného průměru", () => {
    const { row } = calculatePhmaxRow(phmaxSsDataset, {
      code: PAR16_CODE,
      averageStudents: 8,
      classCount: 1,
      form: "denni",
      mode: "oneObor",
    });
    expect(row.intervalLabel).toBe("více než 4 - 8");
    expect(row.adjustedPhmaxPerClass).toBe(15);
  });
});
