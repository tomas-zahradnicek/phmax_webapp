import { test, expect } from "@playwright/test";

async function buildImportTemplatePayload(options?: { omitSheet?: string }) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();

  if (options?.omitSheet !== "README") {
    const readme = workbook.addWorksheet("README");
    readme.addRow(["README"]);
  }

  if (options?.omitSheet !== "Profil školy") {
    const profile = workbook.addWorksheet("Profil školy");
    profile.addRow(["pole", "hodnota"]);
    profile.addRow(["name", "ZŠ E2E"]);
  }

  if (options?.omitSheet !== "04 Zápis a žáci") {
    const s04 = workbook.addWorksheet("04 Zápis a žáci");
    s04.addRow(["blok", "pole", "trida_nebo_kategorie", "hodnota", "poznamka"]);
    s04.addRow(["firstGradeAdmissionCurrentYear", "firstTimeTotal", "", "20", ""]);
  }

  if (options?.omitSheet !== "06 Výsledky vzdělávání") {
    const s06 = workbook.addWorksheet("06 Výsledky vzdělávání");
    s06.addRow(["blok", "pololeti", "trida", "pole", "hodnota", "poznamka"]);
    s06.addRow(["classResults", "first", "1.A", "pupilsTotal", "25", ""]);
    s06.addRow(["classResults", "first", "1.A", "averageGrade", "1,18", ""]);
    s06.addRow(["classResults", "second", "1.A", "pupilsTotal", "25", ""]);
    s06.addRow(["classResults", "second", "1.A", "averageGrade", "1,16", ""]);
    s06.addRow(["summary", "", "", "summaryEvaluation", "Souhrn kapitoly 06.", ""]);
  }

  if (options?.omitSheet !== "11 Hospodaření") {
    const s11 = workbook.addWorksheet("11 Hospodaření");
    s11.addRow(["blok", "polozka", "nazev_radku", "hodnota", "poznamka"]);
    s11.addRow(["revenue", "founderContribution", "", "4 200 000", ""]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    name: "e2e-vyrocni-import.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(buffer),
  };
}

test.describe("Výroční zpráva XLSX import smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/vyrocni-zprava");
  });

  test("upload nevalidní šablony ponechá confirm disabled", async ({ page }) => {
    const badPayload = await buildImportTemplatePayload({ omitSheet: "11 Hospodaření" });
    await page.locator('input[type="file"][accept=".xlsx"]').setInputFiles(badPayload);

    await expect(page.getByText("Chybí povinný list '11 Hospodaření'.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Potvrdit import a uložit údaje" })).toBeDisabled();
  });

  test("validní upload vyžaduje checkbox a pak povolí confirm", async ({ page }) => {
    const validPayload = await buildImportTemplatePayload();
    await page.locator('input[type="file"][accept=".xlsx"]').setInputFiles(validPayload);

    const confirmButton = page.getByRole("button", { name: "Potvrdit import a uložit údaje" });
    await expect(confirmButton).toBeDisabled();

    await page
      .getByLabel("Rozumím, že import přepíše uložené údaje ve vybraných částech.")
      .check();

    await expect(confirmButton).toBeEnabled();
  });
});
