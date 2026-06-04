import {
  IMPORT_META_LABELS,
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
  addImportCiselnikySheet,
  applyImportColumnDropdowns,
  type ImportTemplateDropdown,
} from "./phmax-import-template-validation";
import { PV_PROVOZ_OPTIONS } from "./pv/pv-workplace-shared";
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

const SS_EXAMPLE = [
  "zs-praha-123",
  "Import ze školy 2026-05",
  "ss-1",
  "1.A",
  "82-41-L/01",
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

const CISNIKY_LISTS = [
  { id: "provoz", options: IMPORT_PROVOZ_DROPDOWN_VALUES },
  { id: "basic_type", options: IMPORT_BASIC_TYPE_DROPDOWN_VALUES },
  { id: "input_mode", options: IMPORT_SD_MODE_DROPDOWN_VALUES },
  { id: "study_form", options: IMPORT_SS_STUDY_FORM_DROPDOWN_VALUES },
  { id: "kind_psych", options: IMPORT_PSYCH_KIND_DROPDOWN_VALUES },
  { id: "kind_health", options: IMPORT_HEALTH_KIND_DROPDOWN_VALUES },
  { id: "mode", options: IMPORT_ROW_MODE_DROPDOWN_VALUES },
] as const;

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
};

function addDataSheet(workbook: import("exceljs").Workbook, config: DataSheetConfig, rangeById: Map<string, string>) {
  const sheet = workbook.addWorksheet(config.name, { views: [{ state: "frozen", ySplit: 2 }] });
  const headerRow = sheet.addRow(labelRow(config.labels));
  headerRow.font = { bold: true, color: { argb: "FF1E293B" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  const hintRow = sheet.addRow(keyHintRow(config.labels));
  hintRow.font = { italic: true, color: { argb: "FF64748B" }, size: 9 };
  for (const row of config.dataRows) {
    sheet.addRow([...row]);
  }
  sheet.columns = Object.keys(config.labels).map(() => ({ width: 22 }));

  if (config.dropdowns?.length) {
    const rangeByFieldKey = new Map<string, string>();
    for (const dd of config.dropdowns) {
      const ciselnikId =
        dd.fieldKey === "kind"
          ? config.name.includes("psycholog")
            ? "kind_psych"
            : "kind_health"
          : dd.fieldKey;
      const range = rangeById.get(ciselnikId);
      if (range) rangeByFieldKey.set(dd.fieldKey, range);
    }
    applyImportColumnDropdowns(sheet, config.labels, config.dropdowns, rangeByFieldKey);
  }
}

function addNavodSheet(workbook: import("exceljs").Workbook) {
  const sheet = workbook.addWorksheet("Návod");
  const lines = [
    ["Import PHmax – šablona celé školy (v2)"],
    [""],
    ["Povinné listy: Meta (1 řádek), PV (řádky MŠ), ZŠ souhrn (1 řádek)."],
    ["Volitelné: ŠD, SŠ, ZŠ psycholog, ZŠ zdravotní."],
    ["Řádek 1 = český název sloupce, řádek 2 = interní klíč v závorce (pro IT)."],
    ["Řádek 3+ = data – u výčtů použijte rozbalovací seznam v buňce (nebo český text)."],
    ["school_id a Název scénáře musí být stejné ve všech listech."],
    [""],
    ...IMPORT_TEMPLATE_NAVOD_VALUE_LINES.map((line) => [line]),
  ];
  for (const [text] of lines) {
    sheet.addRow([text]);
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

  addNavodSheet(workbook);
  addDataSheet(
    workbook,
    { name: "Meta", labels: IMPORT_META_LABELS, dataRows: [META_EXAMPLE] },
    rangeById,
  );
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
    },
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
