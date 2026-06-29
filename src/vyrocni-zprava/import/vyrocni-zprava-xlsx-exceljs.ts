import type ExcelJSNamespace from "exceljs";

export async function loadExcelJsModule(): Promise<typeof ExcelJSNamespace> {
  const mod = await import("exceljs");
  const ExcelJS = (mod.default ?? mod) as typeof ExcelJSNamespace;
  if (!ExcelJS?.Workbook) {
    throw new Error("ExcelJS modul se nepodařilo načíst.");
  }
  return ExcelJS;
}

export async function createEmptyExcelJsWorkbook(): Promise<ExcelJSNamespace.Workbook> {
  const ExcelJS = await loadExcelJsModule();
  return new ExcelJS.Workbook();
}
