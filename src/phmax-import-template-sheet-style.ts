import type ExcelJS from "exceljs";
import { IMPORT_TEMPLATE_DATA_FIRST_ROW } from "./phmax-import-template-validation";

export const IMPORT_SHEET_TAB_COLORS: Record<string, string> = {
  Návod: "FF475569",
  Meta: "FF64748B",
  PV: "FF0EA5E9",
  "ZŠ souhrn": "FF2563EB",
  ŠD: "FF7C3AED",
  SŠ: "FF4F46E5",
  "ZŠ psycholog": "FF1D4ED8",
  "ZŠ zdravotní": "FF0369A1",
  NV75: "FF059669",
  "NV75 §4c": "FF10B981",
  Číselníky: "FF94A3B8",
};

const HEADER_FILL = "FF1E40AF";
const HEADER_FONT = "FFFFFFFF";
const HINT_FILL = "FFF1F5F9";
const DATA_FILL = "FFFFFFFF";
const DATA_ALT_FILL = "FFF8FAFC";
const NAV_LINK_FILL = "FF2563EB";

export function styleImportWorksheetTab(sheet: ExcelJS.Worksheet, name: string): void {
  const argb = IMPORT_SHEET_TAB_COLORS[name];
  if (argb) {
    sheet.properties = { ...sheet.properties, tabColor: { argb } };
  }
}

export function styleImportHeaderAndDataRows(
  sheet: ExcelJS.Worksheet,
  columnCount: number,
  dataRowCountFromRow3: number,
): void {
  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  for (let c = 1; c <= columnCount; c++) {
    const cell = headerRow.getCell(c);
    cell.font = { bold: true, size: 11, color: { argb: HEADER_FONT } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF1E3A8A" } },
      bottom: { style: "thin", color: { argb: "FF1E3A8A" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  }

  const hintRow = sheet.getRow(2);
  hintRow.height = 16;
  for (let c = 1; c <= columnCount; c++) {
    const cell = hintRow.getCell(c);
    cell.font = { italic: true, size: 9, color: { argb: "FF64748B" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HINT_FILL } };
  }

  const lastDataRow = IMPORT_TEMPLATE_DATA_FIRST_ROW + Math.max(0, dataRowCountFromRow3 - 1);
  for (let r = IMPORT_TEMPLATE_DATA_FIRST_ROW; r <= lastDataRow; r++) {
    const row = sheet.getRow(r);
    row.height = 18;
    const fill = r % 2 === 1 ? DATA_FILL : DATA_ALT_FILL;
    for (let c = 1; c <= columnCount; c++) {
      const cell = row.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      cell.font = { size: 10, color: { argb: "FF0F172A" } };
      cell.alignment = { vertical: "middle", wrapText: false };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    }
  }
}

function quoteSheetForHyperlink(name: string): string {
  return /[\s']/.test(name) ? `'${name.replace(/'/g, "''")}'` : name;
}

export type ImportNavSheetLink = { label: string; sheetName: string };

export function addImportNavSheetLinks(sheet: ExcelJS.Worksheet, links: readonly ImportNavSheetLink[]): void {
  sheet.getCell(1, 1).value = "Přejít na list:";
  sheet.getCell(1, 1).font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
  links.forEach((link, i) => {
    const cell = sheet.getCell(2, i + 1);
    const target = `#${quoteSheetForHyperlink(link.sheetName)}!A1`;
    cell.value = { text: link.label, hyperlink: target };
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" }, underline: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAV_LINK_FILL } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF1D4ED8" } },
      bottom: { style: "thin", color: { argb: "FF1D4ED8" } },
      left: { style: "thin", color: { argb: "FF1D4ED8" } },
      right: { style: "thin", color: { argb: "FF1D4ED8" } },
    };
    sheet.getColumn(i + 1).width = Math.max(14, link.label.length * 0.9);
  });
  sheet.getRow(2).height = 24;
}
