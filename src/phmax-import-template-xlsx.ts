import {
  IMPORT_META_HEADERS,
  IMPORT_PV_HEADERS,
  IMPORT_ZS_HEADERS,
  PHMAX_IMPORT_PV_ZS_SCHEMA,
} from "./phmax-import-pv-zs";

const HEADER_FILL = "FFE8EEF7";

const META_EXAMPLE = [
  "zs-praha-123",
  "ZŠ a MŠ Ukázka",
  "2025/2026",
  "Import ze školy 2026-05",
  PHMAX_IMPORT_PV_ZS_SCHEMA,
];

const PV_EXAMPLES: readonly (readonly string[])[] = [
  ["zs-praha-123", "Import ze školy 2026-05", "pv-1", "Budova A - MŠ", "celodenni", "4", "8", "0", "0"],
  ["zs-praha-123", "Import ze školy 2026-05", "pv-2", "Školka polodenní", "polodenni", "2", "5", "0", "1"],
];

const ZS_EXAMPLE = [
  "zs-praha-123",
  "Import ze školy 2026-05",
  "full_more_than_2",
  "10",
  "250",
  "8",
  "225",
  "2",
  "26",
  "1",
  "12",
  "2",
  "40",
  "Import ze školy 2026-05",
];

function addDataSheet(
  workbook: import("exceljs").Workbook,
  name: string,
  headers: readonly string[],
  dataRows: readonly (readonly string[])[],
) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  const headerRow = sheet.addRow([...headers]);
  headerRow.font = { bold: true, color: { argb: "FF1E293B" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  for (const row of dataRows) {
    sheet.addRow([...row]);
  }
  sheet.columns = headers.map(() => ({ width: 16 }));
}

function addNavodSheet(workbook: import("exceljs").Workbook) {
  const sheet = workbook.addWorksheet("Návod");
  const lines = [
    ["Import PHmax – šablona PV + ZŠ (v1)"],
    [""],
    ["1. Vyplňte listy Meta (1 řádek), PV (řádky pracovišť MŠ), ZŠ (1 řádek souhrnu)."],
    ["2. school_id a scenario_label musí být stejné ve všech listech."],
    ["3. Uložte soubor a na dashboardu PHmax zvolte Import ze školy."],
    ["4. Po načtení zkontrolujte moduly PV a ZŠ a součet na dashboardu."],
    [""],
    ["provoz: polodenni | celodenni | internat | zdravotnicke"],
    [
      "basic_type: full_more_than_2 | full_max_2 | first_only_1 | first_only_2 | first_only_3 | first_only_4",
    ],
    [""],
    ["MŠ patří do PV. Přípravná třída u ZŠ je v listu ZŠ (prep_*), ne v PV."],
  ];
  for (const [text] of lines) {
    const row = sheet.addRow([text]);
    row.alignment = { wrapText: true, vertical: "top" };
  }
  sheet.getColumn(1).width = 72;
}

/** Stažení oficiální šablony Excel pro školy (fáze A). */
export async function downloadPhmaxImportTemplateXlsx(): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PHmax kalkulačka";
  workbook.created = new Date();

  addNavodSheet(workbook);
  addDataSheet(workbook, "Meta", IMPORT_META_HEADERS, [META_EXAMPLE]);
  addDataSheet(workbook, "PV", IMPORT_PV_HEADERS, PV_EXAMPLES);
  addDataSheet(workbook, "ZŠ", IMPORT_ZS_HEADERS, [ZS_EXAMPLE]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "phmax-import-pv-zs-v1.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
