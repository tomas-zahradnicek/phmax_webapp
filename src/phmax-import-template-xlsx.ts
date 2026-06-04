import {
  IMPORT_META_LABELS,
  IMPORT_NV75_LABELS,
  IMPORT_NV75_PRACTICE_LABELS,
  IMPORT_PV_LABELS,
  IMPORT_SD_LABELS,
  IMPORT_SS_LABELS,
  IMPORT_ZS_HEALTH_LABELS,
  IMPORT_ZS_PSYCH_LABELS,
  IMPORT_ZS_SUMMARY_LABELS,
} from "./phmax-import-columns";
import {
  IMPORT_BASIC_TYPE_DROPDOWN_VALUES,
  IMPORT_BASIC_TYPE_LABELS,
  IMPORT_HEALTH_KIND_DROPDOWN_VALUES,
  IMPORT_HEALTH_KIND_LABELS,
  IMPORT_NV75_KIND_DROPDOWN_VALUES,
  IMPORT_NV75_KIND_LABELS,
  IMPORT_PSYCH_KIND_DROPDOWN_VALUES,
  IMPORT_PSYCH_KIND_LABELS,
  IMPORT_PROVOZ_DROPDOWN_VALUES,
  IMPORT_ROW_MODE_DROPDOWN_VALUES,
  IMPORT_ROW_MODE_LABELS,
  IMPORT_SD_MODE_DROPDOWN_VALUES,
  IMPORT_SD_MODE_LABELS,
  IMPORT_SS_STUDY_FORM_DROPDOWN_VALUES,
  IMPORT_TEMPLATE_NAVOD_VALUE_LINES,
} from "./phmax-import-czech-values";
import {
  addImportNavSheetLinks,
  styleImportHeaderAndDataRows,
  styleImportWorksheetTab,
  type ImportNavSheetLink,
} from "./phmax-import-template-sheet-style";
import {
  addImportCiselnikySheet,
  applyImportColumnDropdowns,
  IMPORT_CISNIKY_SHEET_NAME,
  type ImportTemplateDropdown,
} from "./phmax-import-template-validation";
import { PV_PROVOZ_OPTIONS } from "./pv/pv-workplace-shared";
import { PHMAX_IMPORT_SCHOOL_SCHEMA } from "./phmax-import-pv-zs";

const META_EXAMPLE = [
  "zs-praha-123",
  "ZŠ a MŠ Ukázka",
  "2025/2026",
  "Import ze školy 2026-05",
  PHMAX_IMPORT_SCHOOL_SCHEMA,
];

const PV_EXAMPLES: readonly (readonly string[])[] = [
  ["zs-praha-123", "Import ze školy 2026-05", "pv-1", "Budova A - MŠ", PV_PROVOZ_OPTIONS[1]!.label, "4", "8", "0", "0"],
  ["zs-praha-123", "Import ze školy 2026-05", "pv-2", "Školka polodenní", PV_PROVOZ_OPTIONS[0]!.label, "2", "5", "0", "1"],
];

const ZS_EXAMPLE = [
  "zs-praha-123",
  "Import ze školy 2026-05",
  IMPORT_BASIC_TYPE_LABELS.full_more_than_2,
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

const SD_EXAMPLE = ["zs-praha-123", "Import ze školy 2026-05", "30", "2", IMPORT_SD_MODE_LABELS.summary];

/** Platný kód oboru v datasetu SŠ (39-41-L/01) – ne 82-41-L/01. */
const SS_EXAMPLE = [
  "zs-praha-123",
  "Import ze školy 2026-05",
  "ss-1",
  "1.A – denní",
  "39-41-L/01",
  IMPORT_SS_STUDY_FORM_DROPDOWN_VALUES[0]!,
  "2",
  "17",
];

const ZS_PSYCH_EXAMPLE = [
  "zs-praha-123",
  "Import ze školy 2026-05",
  "1",
  IMPORT_PSYCH_KIND_LABELS.psych1,
  IMPORT_ROW_MODE_LABELS.current_only,
  "40",
  "2",
  "0",
  "0",
];

const ZS_HEALTH_EXAMPLE = [
  "zs-praha-123",
  "Import ze školy 2026-05",
  "1",
  IMPORT_HEALTH_KIND_LABELS.health1,
  IMPORT_ROW_MODE_LABELS.higher_of_two,
  "24",
  "2",
  "20",
  "2",
];

const NV75_EXAMPLES: readonly (readonly string[])[] = [
  ["zs-praha-123", "Import ze školy 2026-05", "nv75-1", IMPORT_NV75_KIND_LABELS.zs, "19", "10;4"],
  ["zs-praha-123", "Import ze školy 2026-05", "nv75-2", IMPORT_NV75_KIND_LABELS.sd, "4", ""],
];

const NV75_PRACTICE_EXAMPLE = [
  "zs-praha-123",
  "Import ze školy 2026-05",
  "120",
  "0",
  "0",
  "0",
  "0",
];

const CISNIKY_LISTS = [
  { id: "provoz", options: IMPORT_PROVOZ_DROPDOWN_VALUES },
  { id: "basic_type", options: IMPORT_BASIC_TYPE_DROPDOWN_VALUES },
  { id: "input_mode", options: IMPORT_SD_MODE_DROPDOWN_VALUES },
  { id: "study_form", options: IMPORT_SS_STUDY_FORM_DROPDOWN_VALUES },
  { id: "kind_psych", options: IMPORT_PSYCH_KIND_DROPDOWN_VALUES },
  { id: "kind_health", options: IMPORT_HEALTH_KIND_DROPDOWN_VALUES },
  { id: "kind_nv75", options: IMPORT_NV75_KIND_DROPDOWN_VALUES },
  { id: "mode", options: IMPORT_ROW_MODE_DROPDOWN_VALUES },
] as const;

const NAV_SHEET_LINKS: readonly ImportNavSheetLink[] = [
  { label: "Meta", sheetName: "Meta" },
  { label: "PV", sheetName: "PV" },
  { label: "ZŠ", sheetName: "ZŠ souhrn" },
  { label: "ŠD", sheetName: "ŠD" },
  { label: "SŠ", sheetName: "SŠ" },
  { label: "Psych", sheetName: "ZŠ psycholog" },
  { label: "Zdravotní", sheetName: "ZŠ zdravotní" },
  { label: "NV75", sheetName: "NV75" },
  { label: "NV75 §4c", sheetName: "NV75 §4c" },
];

function labelRow(labels: Record<string, string>): string[] {
  return Object.values(labels);
}

function keyHintRow(labels: Record<string, string>): string[] {
  return Object.keys(labels).map((k) => `(${k})`);
}

type DataSheetConfig = {
  name: string;
  labels: Record<string, string>;
  dataRows: readonly (readonly string[])[];
  dropdowns?: readonly ImportTemplateDropdown[];
  /** id v listu Číselníky pro sloupec kind */
  kindCiselnikId?: "kind_psych" | "kind_health" | "kind_nv75";
};

function addDataSheet(workbook: import("exceljs").Workbook, config: DataSheetConfig, rangeById: Map<string, string>) {
  const sheet = workbook.addWorksheet(config.name, { views: [{ state: "frozen", ySplit: 2 }] });
  styleImportWorksheetTab(sheet, config.name);

  sheet.addRow(labelRow(config.labels));
  sheet.addRow(keyHintRow(config.labels));
  for (const row of config.dataRows) {
    sheet.addRow([...row]);
  }

  const colCount = Object.keys(config.labels).length;
  sheet.columns = Object.keys(config.labels).map((_, i) => ({
    width: i === colCount - 1 && colCount > 5 ? 28 : 20,
  }));
  styleImportHeaderAndDataRows(sheet, colCount, config.dataRows.length);

  if (config.dropdowns?.length) {
    const rangeByFieldKey = new Map<string, string>();
    for (const dd of config.dropdowns) {
      let ciselnikId = dd.fieldKey;
      if (dd.fieldKey === "kind") {
        ciselnikId = config.kindCiselnikId ?? "kind_psych";
      }
      const range = rangeById.get(ciselnikId);
      if (range) rangeByFieldKey.set(dd.fieldKey, range);
    }
    applyImportColumnDropdowns(sheet, config.labels, config.dropdowns, rangeByFieldKey);
  }
}

function addNavodSheet(workbook: import("exceljs").Workbook) {
  const sheet = workbook.addWorksheet("Návod", { views: [{ state: "frozen", ySplit: 4 }] });
  styleImportWorksheetTab(sheet, "Návod");
  addImportNavSheetLinks(sheet, NAV_SHEET_LINKS);

  const lines = [
    ["Import PHmax – šablona celé školy (v2)"],
    [""],
    ["Povinné listy: Meta (1 řádek), PV (řádky MŠ), ZŠ souhrn (1 řádek)."],
    ["Volitelné: ŠD, SŠ, ZŠ psycholog, ZŠ zdravotní, NV75, NV75 §4c."],
    ["Řádek 1 = český název sloupce, řádek 2 = interní klíč v závorce (pro IT)."],
    ["Řádek 3+ = data – u výčtů použijte rozbalovací seznam (modré odkazy výše = přechod na list)."],
    ["school_id a Název scénáře musí být stejné ve všech listech."],
    [""],
    ...IMPORT_TEMPLATE_NAVOD_VALUE_LINES.map((line) => [line]),
  ];
  for (const [text] of lines) {
    const row = sheet.addRow([text]);
    if (String(text).startsWith("Import PHmax")) {
      row.getCell(1).font = { bold: true, size: 13, color: { argb: "FF0F172A" } };
    }
  }
  sheet.getColumn(1).width = 78;
}

/** Sestaví workbook šablony importu (pro testy i stažení). */
export async function buildPhmaxImportTemplateWorkbook(): Promise<import("exceljs").Workbook> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PHmax kalkulačka";
  workbook.created = new Date();

  const rangeById = addImportCiselnikySheet(workbook, [...CISNIKY_LISTS]);
  styleImportWorksheetTab(workbook.getWorksheet(IMPORT_CISNIKY_SHEET_NAME)!, IMPORT_CISNIKY_SHEET_NAME);

  addNavodSheet(workbook);
  addDataSheet(workbook, { name: "Meta", labels: IMPORT_META_LABELS, dataRows: [META_EXAMPLE] }, rangeById);
  addDataSheet(
    workbook,
    {
      name: "PV",
      labels: IMPORT_PV_LABELS,
      dataRows: PV_EXAMPLES,
      dropdowns: [{ fieldKey: "provoz", options: IMPORT_PROVOZ_DROPDOWN_VALUES }],
    },
    rangeById,
  );
  addDataSheet(
    workbook,
    {
      name: "ZŠ souhrn",
      labels: IMPORT_ZS_SUMMARY_LABELS,
      dataRows: [ZS_EXAMPLE],
      dropdowns: [{ fieldKey: "basic_type", options: IMPORT_BASIC_TYPE_DROPDOWN_VALUES }],
    },
    rangeById,
  );
  addDataSheet(
    workbook,
    {
      name: "ŠD",
      labels: IMPORT_SD_LABELS,
      dataRows: [SD_EXAMPLE],
      dropdowns: [{ fieldKey: "input_mode", options: IMPORT_SD_MODE_DROPDOWN_VALUES }],
    },
    rangeById,
  );
  addDataSheet(
    workbook,
    {
      name: "SŠ",
      labels: IMPORT_SS_LABELS,
      dataRows: [SS_EXAMPLE],
      dropdowns: [{ fieldKey: "study_form", options: IMPORT_SS_STUDY_FORM_DROPDOWN_VALUES }],
    },
    rangeById,
  );
  addDataSheet(
    workbook,
    {
      name: "ZŠ psycholog",
      labels: IMPORT_ZS_PSYCH_LABELS,
      dataRows: [ZS_PSYCH_EXAMPLE],
      dropdowns: [
        { fieldKey: "kind", options: IMPORT_PSYCH_KIND_DROPDOWN_VALUES },
        { fieldKey: "mode", options: IMPORT_ROW_MODE_DROPDOWN_VALUES },
      ],
      kindCiselnikId: "kind_psych",
    },
    rangeById,
  );
  addDataSheet(
    workbook,
    {
      name: "ZŠ zdravotní",
      labels: IMPORT_ZS_HEALTH_LABELS,
      dataRows: [ZS_HEALTH_EXAMPLE],
      dropdowns: [
        { fieldKey: "kind", options: IMPORT_HEALTH_KIND_DROPDOWN_VALUES },
        { fieldKey: "mode", options: IMPORT_ROW_MODE_DROPDOWN_VALUES },
      ],
      kindCiselnikId: "kind_health",
    },
    rangeById,
  );
  addDataSheet(
    workbook,
    {
      name: "NV75",
      labels: IMPORT_NV75_LABELS,
      dataRows: NV75_EXAMPLES,
      dropdowns: [{ fieldKey: "kind", options: IMPORT_NV75_KIND_DROPDOWN_VALUES }],
      kindCiselnikId: "kind_nv75",
    },
    rangeById,
  );
  addDataSheet(
    workbook,
    { name: "NV75 §4c", labels: IMPORT_NV75_PRACTICE_LABELS, dataRows: [NV75_PRACTICE_EXAMPLE] },
    rangeById,
  );

  return workbook;
}

/** Stažení oficiální šablony Excel pro školy. */
export async function downloadPhmaxImportTemplateXlsx(): Promise<void> {
  const workbook = await buildPhmaxImportTemplateWorkbook();
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
