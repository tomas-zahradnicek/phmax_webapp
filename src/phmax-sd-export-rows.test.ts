import { describe, expect, it } from "vitest";
import { exportCsvLocalized } from "./export-utils";
import { buildPhmaxSdExportRows } from "./phmax-sd-export-rows";
import {
  SD_MAX_DEPARTMENTS_IN_TABLE,
  getPhmaxSdBase,
  getPhmaxSdBreakdown,
  reducedPhmaxIfUnderStaffed,
  suggestedDepartmentsFromPupils,
} from "./phmax-sd-logic";

describe("buildPhmaxSdExportRows (smoke / export)", () => {
  it("obsahuje vstupy, základní PHmax a CSV hlavičku", () => {
    const pupils = 80;
    const suggested = suggestedDepartmentsFromPupils(pupils);
    const effectiveDepts = suggested;
    const basePhmax = getPhmaxSdBase(effectiveDepts)!;
    const reduction = reducedPhmaxIfUnderStaffed({
      pupilsFirstGrade: pupils,
      departmentCount: effectiveDepts,
      basePhmax,
    });
    const breakdown = getPhmaxSdBreakdown(effectiveDepts);
    const avgPerDept = Math.round((pupils / effectiveDepts) * 100) / 100;

    const rows = buildPhmaxSdExportRows({
      pupils,
      effectiveDepts,
      manualDepts: false,
      suggested,
      avgPerDept,
      basePhmax,
      reduction,
      breakdown,
      tableWarning: null,
    });

    expect(rows[0][0]).toContain("školní družina");
    expect(rows.some(([k]) => k.includes("Počet přihlášených"))).toBe(true);
    expect(rows.some(([k, v]) => k.includes("PHmax základ") && v === basePhmax)).toBe(true);

    const csv = exportCsvLocalized(rows);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("Položka;Hodnota");
    expect(csv).toContain('"80"');
  });

  it("při překročení limitu tabulky přidá řádek Upozornění", () => {
    const n = SD_MAX_DEPARTMENTS_IN_TABLE + 1;
    const warning = `Tabulka končí ${SD_MAX_DEPARTMENTS_IN_TABLE} odděleními.`;
    const rows = buildPhmaxSdExportRows({
      pupils: 600,
      effectiveDepts: n,
      manualDepts: true,
      suggested: 1,
      avgPerDept: 0,
      basePhmax: null,
      reduction: { adjusted: 0, factor: 1, applied: false },
      breakdown: null,
      tableWarning: warning,
    });

    expect(rows.some(([k, v]) => k === "Upozornění" && v === warning)).toBe(true);
  });
});
