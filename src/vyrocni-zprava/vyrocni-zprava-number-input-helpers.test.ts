import { describe, expect, it } from "vitest";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { getSection06Readiness } from "./vyrocni-zprava-section06-data-logic";
import {
  formatNumberInputValue,
  parseCzechNumberInput,
} from "./vyrocni-zprava-number-input-helpers";

describe("vyrocni-zprava-number-input-helpers", () => {
  it("parseCzechNumberInput správně parsuje desetinnou čárku", () => {
    expect(parseCzechNumberInput("1,18")).toBe(1.18);
    expect(parseCzechNumberInput("1,16")).toBe(1.16);
    expect(parseCzechNumberInput("0,2")).toBe(0.2);
  });

  it("parseCzechNumberInput správně parsuje mezery tisíců", () => {
    expect(parseCzechNumberInput("4 200 000")).toBe(4200000);
    expect(parseCzechNumberInput("-1 795 000")).toBe(-1795000);
    expect(parseCzechNumberInput("24 055 000")).toBe(24055000);
  });

  it("prázdný a nevalidní vstup vrací undefined", () => {
    expect(parseCzechNumberInput("")).toBeUndefined();
    expect(parseCzechNumberInput("abc")).toBeUndefined();
    expect(parseCzechNumberInput("1,2,3")).toBeUndefined();
  });

  it("formatNumberInputValue vrací čitelný text bez groupingu", () => {
    expect(formatNumberInputValue(undefined)).toBe("");
    expect(formatNumberInputValue(4200000)).toBe("4200000");
    expect(formatNumberInputValue(1.18)).toBe("1,18");
  });

  it("sekce 06: průměr 1,18 nevyvolá warning mimo rozsah", () => {
    const profile = { ...createDefaultSchoolProfile(), schoolType: "Základní škola", name: "ZŠ Test" };
    const avg = parseCzechNumberInput("1,18");
    const readiness = getSection06Readiness({
      schoolProfile: profile,
      section06Data: {
        firstTermClassResults: [
          {
            className: "1.A",
            pupilsTotal: 20,
            averageGrade: avg,
          },
        ],
        secondTermClassResults: [
          {
            className: "1.A",
            pupilsTotal: 20,
            averageGrade: avg,
          },
        ],
        educationalMeasures: { firstTerm: {}, secondTerm: {} },
        finalExams: {},
        maturitaExams: {},
        absolutorium: {},
        summaryEvaluation:
          "Výsledky byly vyhodnoceny podle klasifikace a docházky v rozsahu poskytnutých podkladů školy.",
        notes: "",
      },
    });

    expect(readiness.warnings.some((item) => item.includes("mimo očekávaný rozsah"))).toBe(false);
  });
});
