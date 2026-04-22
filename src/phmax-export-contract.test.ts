import { describe, expect, it } from "vitest";
import { exportCsvLocalized } from "./export-utils";
import { buildPhmaxPvMultiExportRows } from "./phmax-pv-export-rows";
import { computePvPhmaxTotal } from "./phmax-pv-logic";
import { buildPhmaxSdExportRows } from "./phmax-sd-export-rows";
import { calculateSchoolDruzinaPhmaxDetailed, normalizeSchoolDruzinaInput } from "./phmax-sd-logic";

describe("Export contract", () => {
  it("PV multi export drží klíčové contract hlavičky a součet", () => {
    const a = computePvPhmaxTotal({
      provoz: "celodenni",
      classCount: 4,
      avgHoursPerDay: 10,
      sec16ClassCount: 0,
      languageGroupCount: 0,
    });
    const rows = buildPhmaxPvMultiExportRows(
      [
        {
          index: 1,
          label: "Kontrakt A",
          provozLabel: "Celodenní",
          provoz: "celodenni",
          classCount: 4,
          avgHoursPerDay: 10,
          sec16Count: 0,
          languageGroups: 0,
          computed: a,
          phaMax: null,
        },
      ],
      { phmaxSum: a.totalPhmax ?? 0, phaSum: 0, incomplete: false },
    );

    expect(rows[0]).toEqual(["=== PHmax / PHAmax předškolní vzdělávání – export (více pracovišť) ===", ""]);
    expect(rows[1]).toEqual(["Počet pracovišť ve výpočtu", 1]);
    expect(rows.some(([k]) => k === "=== SOUČET (právnická osoba / všechna pracoviště) ===")).toBe(true);
    expect(rows.some(([k, v]) => k === "PHmax celkem (součet dílčích PHmax, h/týden)" && v === 235)).toBe(true);
  });

  it("ŠD detailní export obsahuje contract sekci a řádkové detaily", () => {
    const detailed = calculateSchoolDruzinaPhmaxDetailed(
      normalizeSchoolDruzinaInput({
        departments: [
          { kind: "regular", participants: 20 },
          { kind: "special", participants: 5, specialExceptionGranted: true },
        ],
      }),
    );
    const rows = buildPhmaxSdExportRows({
      pupils: 20,
      effectiveDepts: 2,
      manualDepts: true,
      suggested: 1,
      avgPerDept: 10,
      basePhmax: 57.5,
      reduction: { adjusted: 57.5, factor: 1, applied: false },
      breakdown: [32.5, 25],
      tableWarning: null,
      detailed,
    });

    expect(rows.some(([k]) => k === "=== Detailní model (běžná + speciální oddělení) ===")).toBe(true);
    expect(rows.some(([k, v]) => k === "PHmax celkem (detailní model)" && v === 56.06)).toBe(true);
    expect(rows.some(([k, v]) => k === "Oddělení 2 (special) PHAmax" && v === "14,25")).toBe(true);

    const csv = exportCsvLocalized(rows);
    expect(csv).toContain("Položka;Hodnota");
    expect(csv).toContain('"Oddělení 2 (special) PHAmax";"14,25"');
  });
});
