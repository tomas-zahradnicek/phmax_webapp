import type { ImportCsvRow } from "./phmax-import-pv-zs";
import { importTablesToHandoffPayload, parseImportCsvFileBundle } from "./phmax-import-pv-zs";

type ExcelWorksheet = import("exceljs").Worksheet;
type ExcelWorkbook = import("exceljs").Workbook;

const SHEET_ALIASES: Record<"meta" | "pv" | "zs", readonly string[]> = {
  meta: ["meta", "údaje školy", "udaje skoly"],
  pv: ["pv", "mateřská škola", "materska skola", "mš", "ms"],
  zs: ["zs", "základní škola", "zakladni skola", "zš", "zs souhrn", "zs_summary"],
};

function normalizeSheetName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function resolveSheetKind(sheetName: string): "meta" | "pv" | "zs" | null {
  const n = normalizeSheetName(sheetName);
  for (const [kind, aliases] of Object.entries(SHEET_ALIASES) as [keyof typeof SHEET_ALIASES, readonly string[]][]) {
    if (aliases.some((a) => normalizeSheetName(a) === n)) return kind;
  }
  return null;
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && value !== null && "text" in value) {
    const t = (value as { text?: string }).text;
    return typeof t === "string" ? t.trim() : String(value).trim();
  }
  return String(value).trim();
}

export function worksheetToImportRows(sheet: ExcelWorksheet): ImportCsvRow[] {
  const headerRow = sheet.getRow(1);
  const headerValues = headerRow.values as unknown[];
  if (!Array.isArray(headerValues)) return [];
  const headers = headerValues.slice(1).map((h) => cellToString(h));
  if (headers.every((h) => h === "")) return [];

  const rows: ImportCsvRow[] = [];
  const rowCount = sheet.rowCount;
  for (let r = 2; r <= rowCount; r++) {
    const row = sheet.getRow(r);
    const vals = row.values as unknown[];
    if (!Array.isArray(vals)) continue;
    const cells = vals.slice(1).map(cellToString);
    if (cells.every((c) => c === "")) continue;
    const record: ImportCsvRow = {};
    headers.forEach((h, i) => {
      if (!h) return;
      record[h] = cells[i] ?? "";
    });
    rows.push(record);
  }
  return rows;
}

export async function parseImportXlsxArrayBuffer(buffer: ArrayBuffer) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const tables: Partial<Record<"meta" | "pv" | "zs", ImportCsvRow[]>> = {};

  workbook.eachSheet((sheet) => {
    const kind = resolveSheetKind(sheet.name);
    if (!kind) return;
    if (tables[kind]) {
      throw new Error(`Excel: duplicitní list pro ${kind.toUpperCase()} (${sheet.name}).`);
    }
    tables[kind] = worksheetToImportRows(sheet);
  });

  if (!tables.meta || !tables.pv || !tables.zs) {
    const missing = (["meta", "pv", "zs"] as const).filter((k) => !tables[k]);
    throw new Error(
      `Excel musí obsahovat listy Meta, PV a ZŠ (chybí: ${missing.join(", ")}). Stáhněte šablonu z dashboardu.`,
    );
  }

  return importTablesToHandoffPayload({
    metaRows: tables.meta,
    pvRows: tables.pv,
    zsRows: tables.zs,
  });
}

export async function parseImportFile(file: File) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx")) {
    const buffer = await file.arrayBuffer();
    return parseImportXlsxArrayBuffer(buffer);
  }
  if (lower.endsWith(".csv")) {
    const text = await file.text();
    return parseImportCsvFileBundle([{ name: file.name, text }]);
  }
  throw new Error("Podporované formáty: .xlsx (doporučeno) nebo tři soubory .csv najednou.");
}

export async function parseImportFileList(files: readonly File[]) {
  if (files.length === 0) throw new Error("Vyberte soubor šablony.");
  if (files.length === 1) return parseImportFile(files[0]);
  const csvs = files.filter((f) => f.name.toLowerCase().endsWith(".csv"));
  if (csvs.length !== files.length) {
    throw new Error("Při více souborech nahrajte pouze CSV (Meta, PV, ZŠ), nebo jeden soubor Excel.");
  }
  const bundle = await Promise.all(
    csvs.map(async (f) => ({ name: f.name, text: await f.text() })),
  );
  return parseImportCsvFileBundle(bundle);
}

export type { ExcelWorkbook };
