import ExcelJS from "exceljs";

export type ExportKeyValueRow = readonly [string, string | number];

const HEADER_FILL = "FFE8EEF7";

function addKeyValueSheet(workbook: ExcelJS.Workbook, name: string, rows: readonly ExportKeyValueRow[]) {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [{ width: 48 }, { width: 56 }];

  const headerRow = sheet.addRow(["Položka", "Hodnota"]);
  headerRow.font = { bold: true, color: { argb: "FF1E293B" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  headerRow.height = 22;

  for (const [label, value] of rows) {
    const row = sheet.addRow([label, value]);
    row.alignment = { vertical: "top", wrapText: true };
  }

  sheet.getColumn(1).width = 48;
  sheet.getColumn(2).width = 56;
}

/**
 * Dva listy: Kontext (meta) a Hodnoty (plný rozšířený výpis ve dvou sloupcích).
 */
export async function downloadCalculatorXlsx(opts: {
  contextRows: readonly ExportKeyValueRow[];
  valueRows: readonly ExportKeyValueRow[];
  filename: string;
}): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kalkulačka ZŠ (PHmax / PHAmax / PHPmax)";
  workbook.created = new Date();

  addKeyValueSheet(workbook, "Kontext", opts.contextRows);
  addKeyValueSheet(workbook, "Hodnoty", opts.valueRows);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
