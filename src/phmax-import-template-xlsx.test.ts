import { describe, expect, it } from "vitest";
import { buildPhmaxImportTemplateWorkbook } from "./phmax-import-template-xlsx";
import { IMPORT_CISNIKY_SHEET_NAME } from "./phmax-import-template-validation";

describe("phmax-import-template-xlsx", () => {
  it("šablona obsahuje číselníky a po uložení validaci provozu na PV", async () => {
    const workbook = await buildPhmaxImportTemplateWorkbook();
    const ciselniky = workbook.getWorksheet(IMPORT_CISNIKY_SHEET_NAME);
    expect(ciselniky).toBeDefined();
    expect(ciselniky?.state).toBe("veryHidden");
    expect(String(ciselniky?.getCell(1, 1).value)).toContain("Polodenní");

    for (const name of ["Meta", "PV", "ZŠ souhrn", "ŠD", "SŠ", "ZŠ psycholog", "ZŠ zdravotní"]) {
      expect(workbook.getWorksheet(name)).toBeDefined();
    }
    expect(String(ciselniky?.getCell(1, 2).value)).toContain("Úplná ZŠ");
    const buffer = await workbook.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(4000);
  });
});
