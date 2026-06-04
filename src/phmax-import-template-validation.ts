import type ExcelJS from "exceljs";

export const IMPORT_TEMPLATE_DATA_FIRST_ROW = 3;
export const IMPORT_TEMPLATE_DATA_LAST_ROW = 500;
export const IMPORT_CISNIKY_SHEET_NAME = "Číselníky";

export type ImportTemplateDropdown = {
  /** Klíč sloupce (řádek 2 v závorce), např. provoz, basic_type */
  fieldKey: string;
  options: readonly string[];
};

function columnLetter(colIndex1: number): string {
  let n = colIndex1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function quoteSheetName(name: string): string {
  return /[\s'!]/.test(name) ? `'${name.replace(/'/g, "''")}'` : name;
}

/** Skrytý list s hodnotami výčtů – reference pro data validation (dlouhé české texty). */
export function addImportCiselnikySheet(
  workbook: ExcelJS.Workbook,
  lists: readonly { id: string; options: readonly string[] }[],
): Map<string, string> {
  const sheet = workbook.addWorksheet(IMPORT_CISNIKY_SHEET_NAME, { state: "veryHidden" });
  const rangeById = new Map<string, string>();

  lists.forEach((list, colIdx) => {
    const col = colIdx + 1;
    list.options.forEach((opt, rowIdx) => {
      sheet.getCell(rowIdx + 1, col).value = opt;
    });
    if (list.options.length === 0) return;
    const letter = columnLetter(col);
    const last = list.options.length;
    const range = `${quoteSheetName(IMPORT_CISNIKY_SHEET_NAME)}!$${letter}$1:$${letter}$${last}`;
    rangeById.set(list.id, range);
  });

  return rangeById;
}

/** rangeByFieldKey: klíč sloupce (provoz, kind, …) → vzorec na list Číselníky */
export function applyImportColumnDropdowns(
  sheet: ExcelJS.Worksheet,
  labels: Record<string, string>,
  dropdowns: readonly ImportTemplateDropdown[],
  rangeByFieldKey: Map<string, string>,
): void {
  const keys = Object.keys(labels);
  for (const dd of dropdowns) {
    const colIndex = keys.indexOf(dd.fieldKey);
    if (colIndex < 0) continue;
    const formulaRange = rangeByFieldKey.get(dd.fieldKey);
    if (!formulaRange) continue;
    const letter = columnLetter(colIndex + 1);
    const sqref = `${letter}${IMPORT_TEMPLATE_DATA_FIRST_ROW}:${letter}${IMPORT_TEMPLATE_DATA_LAST_ROW}`;
    const sheetWithDv = sheet as ExcelJS.Worksheet & {
      dataValidations: { add: (sqref: string, opts: Record<string, unknown>) => void };
    };
    sheetWithDv.dataValidations.add(sqref, {
      type: "list",
      allowBlank: true,
      formulae: [formulaRange],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Neplatná hodnota",
      error: "Vyberte hodnotu ze seznamu (nebo nechte prázdné).",
    });
  }
}
