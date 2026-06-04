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

    for (const name of [
      "Meta",
      "PV",
      "ZŠ souhrn",
      "ŠD",
      "SŠ",
      "NV75",
      "NV75 §4c",
      "ZŠ psycholog",
      "ZŠ zdravotní",
      "Návod",
    ]) {
      expect(workbook.getWorksheet(name)).toBeDefined();
    }
    const ss = workbook.getWorksheet("SŠ");
    const ssDataRow = String(ss?.getCell(3, 5).value ?? "");
    expect(ssDataRow).toBe("39-41-L/01");

    const sheetNames = workbook.worksheets.map((ws) => ws.name);
    const zdravotniIdx = sheetNames.indexOf("ZŠ zdravotní");
    expect(sheetNames.indexOf("NV75")).toBeGreaterThan(zdravotniIdx);
    expect(sheetNames.indexOf("NV75 §4c")).toBeGreaterThan(zdravotniIdx);
    expect(String(ciselniky?.getCell(1, 2).value)).toContain("Úplná ZŠ");
    const buffer = await workbook.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(4000);
  });
});
