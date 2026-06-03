import type { ImportCsvRow } from "./phmax-import-pv-zs";
import { importTablesToHandoffPayload, parseSemicolonCsv } from "./phmax-import-pv-zs";

type ExcelWorksheet = import("exceljs").Worksheet;
type ExcelWorkbook = import("exceljs").Workbook;

export type ImportSheetKind =
  | "meta"
  | "pv"
  | "zs"
  | "sd"
  | "ss"
  | "zsPsych"
  | "zsHealth";

const SHEET_ALIASES: Record<ImportSheetKind, readonly string[]> = {
  meta: ["meta", "údaje školy", "udaje skoly"],
  pv: ["pv", "mateřská škola", "materska skola", "mš", "ms"],
  zs: ["zs", "zš souhrn", "zs souhrn", "zs_summary", "základní škola souhrn", "zakladni skola souhrn"],
  sd: ["šd", "sd", "školní družina", "skolni druzina"],
  ss: ["sš", "ss", "střední škola", "stredni skola"],
  zsPsych: ["zš psycholog", "zs psycholog", "zs_psych", "psycholog"],
  zsHealth: ["zš zdravotní", "zs zdravotni", "zs_health", "zdravotní", "zdravotni"],
};

function normalizeSheetName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function resolveSheetKind(sheetName: string): ImportSheetKind | null {
  const n = normalizeSheetName(sheetName);
  for (const [kind, aliases] of Object.entries(SHEET_ALIASES) as [ImportSheetKind, readonly string[]][]) {
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
    if (cells.every((c) => c === "" || /^\([a-z0-9_]+\)$/i.test(c))) continue;
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
  const tables: Partial<Record<ImportSheetKind, ImportCsvRow[]>> = {};

  workbook.eachSheet((sheet) => {
    const kind = resolveSheetKind(sheet.name);
    if (!kind) return;
    if (tables[kind]) {
      throw new Error(`Excel: duplicitní list (${sheet.name}).`);
    }
    tables[kind] = worksheetToImportRows(sheet);
  });

  if (!tables.meta || !tables.pv || !tables.zs) {
    const missing = (["meta", "pv", "zs"] as const).filter((k) => !tables[k]);
    throw new Error(
      `Excel musí obsahovat listy Meta, PV a ZŠ souhrn (chybí: ${missing.join(", ")}). Stáhněte šablonu z dashboardu.`,
    );
  }

  return importTablesToHandoffPayload({
    metaRows: tables.meta,
    pvRows: tables.pv,
    zsRows: tables.zs,
    sdRows: tables.sd,
    ssRows: tables.ss,
    zsPsychRows: tables.zsPsych,
    zsHealthRows: tables.zsHealth,
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
  throw new Error("Podporované formáty: .xlsx (doporučeno) nebo CSV.");
}

function headerSignalsMeta(headers: string[]): boolean {
  return headers.some((h) => h === "schema_version" || h.includes("verze"));
}

function headerSignalsPv(headers: string[]): boolean {
  return headers.includes("provoz") || headers.includes("row_key");
}

function headerSignalsZsSummary(headers: string[]): boolean {
  return headers.includes("basic_type") || headers.includes("basic1_classes");
}

function headerSignalsSd(headers: string[]): boolean {
  return headers.includes("pupils") && headers.includes("departments");
}

function headerSignalsSs(headers: string[]): boolean {
  return headers.includes("education_field") || (headers.includes("study_form") && headers.includes("row_key"));
}

export function classifyImportCsvText(
  text: string,
): "meta" | "pv" | "zs" | "sd" | "ss" | "zsPsych" | "zsHealth" | "unknown" {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return "unknown";
  const rawHeaders = lines[0].split(";").map((h) => h.trim().replace(/^\uFEFF/, ""));
  const headerLine = rawHeaders.join(" ").toLowerCase();
  if (headerLine.includes("psycholog")) return "zsPsych";
  if (headerLine.includes("zdravotn")) return "zsHealth";
  const keys = rawHeaders.map((h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/\s+/g, "_"),
  );
  if (headerSignalsMeta(keys)) return "meta";
  if (headerSignalsSd(keys)) return "sd";
  if (headerSignalsSs(keys)) return "ss";
  if (headerSignalsPv(keys)) return "pv";
  if (headerSignalsZsSummary(keys)) return "zs";
  return "unknown";
}

export function parseImportCsvFileBundle(files: { name: string; text: string }[]) {
  const tables: Partial<Record<ImportSheetKind, ImportCsvRow[]>> = {};
  for (const file of files) {
    const kind = classifyImportCsvText(file.text);
    if (kind === "unknown") {
      throw new Error(`Soubor ${file.name}: neznámá struktura CSV.`);
    }
    if (tables[kind]) {
      throw new Error(`Soubor ${file.name}: duplicitní typ ${kind}.`);
    }
    tables[kind] = parseSemicolonCsv(file.text);
  }
  if (!tables.meta || !tables.pv || !tables.zs) {
    const missing = (["meta", "pv", "zs"] as const).filter((k) => !tables[k]);
    throw new Error(`Chybí CSV: ${missing.join(", ")}. Nahrajte Excel nebo všechny povinné CSV.`);
  }
  return importTablesToHandoffPayload({
    metaRows: tables.meta,
    pvRows: tables.pv,
    zsRows: tables.zs,
    sdRows: tables.sd,
    ssRows: tables.ss,
    zsPsychRows: tables.zsPsych,
    zsHealthRows: tables.zsHealth,
  });
}

export async function parseImportFileList(files: readonly File[]) {
  if (files.length === 0) throw new Error("Vyberte soubor šablony.");
  if (files.length === 1) return parseImportFile(files[0]);
  const csvs = files.filter((f) => f.name.toLowerCase().endsWith(".csv"));
  if (csvs.length !== files.length) {
    throw new Error("Při více souborech nahrajte pouze CSV, nebo jeden soubor Excel.");
  }
  const bundle = await Promise.all(
    csvs.map(async (f) => ({ name: f.name, text: await f.text() })),
  );
  return parseImportCsvFileBundle(bundle);
}

export type { ExcelWorkbook };
