import {
  IMPORT_META_LABELS,
  IMPORT_PV_LABELS,
  IMPORT_SD_LABELS,
  IMPORT_SS_LABELS,
  IMPORT_ZS_HEALTH_LABELS,
  IMPORT_ZS_PSYCH_LABELS,
  IMPORT_ZS_SUMMARY_LABELS,
} from "./phmax-import-columns";
import { PHMAX_IMPORT_SCHOOL_SCHEMA } from "./phmax-import-pv-zs";

const HEADER_FILL = "FFE8EEF7";

const META_EXAMPLE = [
  "zs-praha-123",
  "ZŠ a MŠ Ukázka",
  "2025/2026",
  "Import ze školy 2026-05",
  PHMAX_IMPORT_SCHOOL_SCHEMA,
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

const SD_EXAMPLE = ["zs-praha-123", "Import ze školy 2026-05", "30", "2", "summary"];

const SS_EXAMPLE = [
  "zs-praha-123",
  "Import ze školy 2026-05",
  "ss-1",
  "1.A",
  "82-41-L/01",
  "denni",
  "2",
  "17",
];

const ZS_PSYCH_EXAMPLE = [
  "zs-praha-123",
  "Import ze školy 2026-05",
  "1",
  "psych1",
  "current_only",
  "40",
  "2",
  "0",
  "0",
];

function labelRow(labels: Record<string, string>): string[] {
  return Object.values(labels);
}

function keyHintRow(labels: Record<string, string>): string[] {
  return Object.keys(labels).map((k) => `(${k})`);
}

function addDataSheet(
  workbook: import("exceljs").Workbook,
  name: string,
  labels: Record<string, string>,
  dataRows: readonly (readonly string[])[],
) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 2 }] });
  const headerRow = sheet.addRow(labelRow(labels));
  headerRow.font = { bold: true, color: { argb: "FF1E293B" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  const hintRow = sheet.addRow(keyHintRow(labels));
  hintRow.font = { italic: true, color: { argb: "FF64748B" }, size: 9 };
  for (const row of dataRows) {
    sheet.addRow([...row]);
  }
  sheet.columns = Object.keys(labels).map(() => ({ width: 18 }));
}

function addNavodSheet(workbook: import("exceljs").Workbook) {
  const sheet = workbook.addWorksheet("Návod");
  const lines = [
    ["Import PHmax – šablona celé školy (v2)"],
    [""],
    ["Povinné listy: Meta (1 řádek), PV (řádky MŠ), ZŠ souhrn (1 řádek)."],
    ["Volitelné: ŠD, SŠ, ZŠ psycholog, ZŠ zdravotní."],
    ["Řádek 1 = český název sloupce, řádek 2 = kód pole v závorce (pro kontrolu)."],
    ["school_id a Název scénáře musí být stejné ve všech listech."],
    [""],
    ["provoz (PV): polodenni | celodenni | internat | zdravotnicke"],
    ["basic_type (ZŠ): full_more_than_2 | full_max_2 | first_only_1 … first_only_4"],
    ["Režim ŠD: souhrn nebo detail"],
    ["psych kind: psych1 | psych2 | psychMix — health: health1 | health2 | healthMix"],
  ];
  for (const [text] of lines) {
    sheet.addRow([text]);
  }
  sheet.getColumn(1).width = 78;
}

/** Stažení oficiální šablony Excel pro školy. */
export async function downloadPhmaxImportTemplateXlsx(): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PHmax kalkulačka";
  workbook.created = new Date();

  addNavodSheet(workbook);
  addDataSheet(workbook, "Meta", IMPORT_META_LABELS, [META_EXAMPLE]);
  addDataSheet(workbook, "PV", IMPORT_PV_LABELS, PV_EXAMPLES);
  addDataSheet(workbook, "ZŠ souhrn", IMPORT_ZS_SUMMARY_LABELS, [ZS_EXAMPLE]);
  addDataSheet(workbook, "ŠD", IMPORT_SD_LABELS, [SD_EXAMPLE]);
  addDataSheet(workbook, "SŠ", IMPORT_SS_LABELS, [SS_EXAMPLE]);
  addDataSheet(workbook, "ZŠ psycholog", IMPORT_ZS_PSYCH_LABELS, [ZS_PSYCH_EXAMPLE]);
  addDataSheet(workbook, "ZŠ zdravotní", IMPORT_ZS_HEALTH_LABELS, []);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "phmax-import-skola-v2.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
