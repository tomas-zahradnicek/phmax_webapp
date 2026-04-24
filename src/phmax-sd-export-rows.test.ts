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
import { computeSdStaffingSplitNv75 } from "./phmax-sd-staffing-nv75";

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

  it("při staffingNv75 přidá sekci NV 75/2005 (tab. 7.1 / 7.2) před Upozorněním", () => {
    const pupils = 100;
    const effectiveDepts = 4;
    const suggested = suggestedDepartmentsFromPupils(pupils);
    const basePhmax = getPhmaxSdBase(effectiveDepts)!;
    const reduction = reducedPhmaxIfUnderStaffed({
      pupilsFirstGrade: pupils,
      departmentCount: effectiveDepts,
      basePhmax,
    });
    const adjusted = reduction.adjusted;
    const staffing = computeSdStaffingSplitNv75({
      totalPhmax: adjusted,
      departmentCount: effectiveDepts,
      vychovatelFullPpc: 30,
      separateVedoucihoDleT72: true,
    });
    expect(staffing.separateVedoucihoDleT72).toBe(true);

    const rows = buildPhmaxSdExportRows({
      pupils,
      effectiveDepts,
      manualDepts: false,
      suggested,
      avgPerDept: 25,
      basePhmax,
      reduction,
      breakdown: getPhmaxSdBreakdown(effectiveDepts),
      tableWarning: "Poznámka testu",
      staffingNv75: { vychovatelPpc: 30, model: staffing },
    });

    const upozornIndex = rows.findIndex(([k]) => k === "Upozornění");
    const modelIndex = rows.findIndex(([k]) => k === "=== Model úvazků (nařízení vlády č. 75/2005 Sb., orientačně) ===");
    expect(modelIndex).toBeGreaterThan(-1);
    expect(upozornIndex).toBeGreaterThan(-1);
    expect(modelIndex).toBeLessThan(upozornIndex);
    const anoRow = rows.find(([k, v]) => k.includes("tab. 7.2") && k.includes("7.1") && v === "ano");
    expect(anoRow).toBeDefined();
    expect(rows.some(([k]) => k.includes("tab. 7.1") && k.includes("PPV"))).toBe(true);
    expect(rows.some(([k]) => k.includes("7.2"))).toBe(true);
  });
});
