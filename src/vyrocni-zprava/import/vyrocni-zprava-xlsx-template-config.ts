import type { AnnualReportXlsxImportSheetName } from "./vyrocni-zprava-xlsx-import-types";

export const VYROCNI_ZPRAVA_XLSX_TEMPLATE_FILENAME = "sablona-vyrocni-zprava-import.xlsx";

export const ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR =
  "Konfiguraci XLSX importu se nepodařilo načíst.";

export const ANNUAL_REPORT_XLSX_UPLOAD_ERROR =
  "Soubor se nepodařilo načíst jako XLSX šablonu.";

export type AnnualReportXlsxTemplateSheetConfig = {
  name: AnnualReportXlsxImportSheetName;
  required: boolean;
  headers: readonly string[];
  optionalHeaders?: readonly string[];
};

export type AnnualReportXlsxTemplateConfig = {
  version: 2;
  filename: string;
  sheets: readonly AnnualReportXlsxTemplateSheetConfig[];
};

const ADVANCED_CURRICULUM_HEADERS = [
  "vzdelavaci_oblast",
  "predmet",
  "detail_predmetu",
  "rocnik_1",
  "rocnik_2",
  "rocnik_3",
  "rocnik_4",
  "rocnik_5",
  "dotace_1_stupen",
  "rocnik_6",
  "rocnik_7",
  "rocnik_8",
  "rocnik_9",
  "dotace_2_stupen",
  "je_souctovy_radek",
] as const;

export const ANNUAL_REPORT_XLSX_TEMPLATE_CONFIG: AnnualReportXlsxTemplateConfig = {
  version: 2,
  filename: VYROCNI_ZPRAVA_XLSX_TEMPLATE_FILENAME,
  sheets: [
    { name: "README", required: true, headers: [] },
    { name: "Profil školy", required: false, headers: ["pole", "hodnota"] },
    { name: "01 Základní údaje", required: false, headers: ["pole", "hodnota", "poznamka"] },
    {
      name: "02 Obory vzdělání",
      required: false,
      headers: ["poradi", "code", "name", "form", "level", "note", "registrySource", "registryVerifiedAt", "notes"],
    },
    { name: "03 Personální údaje", required: false, headers: ["blok", "kategorie", "pole", "hodnota", "poznamka"] },
    { name: "04 Zápis a žáci", required: true, headers: ["blok", "pole", "trida_nebo_kategorie", "hodnota", "poznamka"] },
    {
      name: "05 ŠVP",
      required: false,
      headers: ["blok", "poradi", "predmet_nebo_cil", "pole", "hodnota", "poznamka"],
      optionalHeaders: ADVANCED_CURRICULUM_HEADERS,
    },
    {
      name: "06 Výsledky vzdělávání",
      required: true,
      headers: ["blok", "pololeti", "trida", "pole", "hodnota", "poznamka"],
    },
    { name: "07 Prevence a podpora", required: false, headers: ["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"] },
    { name: "08 DVPP a rozvoj pracovníků", required: false, headers: ["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"] },
    { name: "09 Aktivity a prezentace", required: false, headers: ["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"] },
    { name: "10 ČŠI", required: false, headers: ["blok", "poradi", "pole", "hodnota", "poznamka"] },
    { name: "11 Hospodaření", required: true, headers: ["blok", "polozka", "nazev_radku", "hodnota", "poznamka"] },
    { name: "12 Projekty a granty", required: false, headers: ["blok", "poradi", "pole", "hodnota", "poznamka"] },
    { name: "13 Spolupráce s rodiči", required: false, headers: ["pole", "hodnota", "poznamka"] },
    { name: "14 Závěr", required: false, headers: ["pole", "hodnota", "poznamka"] },
    { name: "Schválení a zveřejnění", required: false, headers: ["pole", "hodnota"] },
  ],
};

export function validateAnnualReportXlsxTemplateConfig(
  config: AnnualReportXlsxTemplateConfig | undefined,
): config is AnnualReportXlsxTemplateConfig {
  return Boolean(config && Array.isArray(config.sheets) && config.sheets.length > 0);
}

export function assertAnnualReportXlsxTemplateConfig(): AnnualReportXlsxTemplateConfig {
  if (!validateAnnualReportXlsxTemplateConfig(ANNUAL_REPORT_XLSX_TEMPLATE_CONFIG)) {
    throw new Error(ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR);
  }
  return ANNUAL_REPORT_XLSX_TEMPLATE_CONFIG;
}

export function getAnnualReportXlsxTemplateConfig(): AnnualReportXlsxTemplateConfig | null {
  try {
    return assertAnnualReportXlsxTemplateConfig();
  } catch {
    return null;
  }
}

export function getVyrocniZpravaTemplateSheetNames(): readonly AnnualReportXlsxImportSheetName[] {
  const config = assertAnnualReportXlsxTemplateConfig();
  return config.sheets.map((sheet) => sheet.name);
}

export function getRequiredImportSheetNames(): AnnualReportXlsxImportSheetName[] {
  const config = assertAnnualReportXlsxTemplateConfig();
  return config.sheets.filter((sheet) => sheet.required).map((sheet) => sheet.name);
}

export function getKnownImportSheetNames(): Set<AnnualReportXlsxImportSheetName> {
  const config = assertAnnualReportXlsxTemplateConfig();
  return new Set(config.sheets.map((sheet) => sheet.name));
}

export function getImportSheetConfig(
  sheetName: AnnualReportXlsxImportSheetName,
): AnnualReportXlsxTemplateSheetConfig | undefined {
  const config = assertAnnualReportXlsxTemplateConfig();
  return config.sheets.find((sheet) => sheet.name === sheetName);
}

export function getImportSheetHeaders(sheetName: Exclude<AnnualReportXlsxImportSheetName, "README">): string[] {
  const sheet = getImportSheetConfig(sheetName);
  return sheet ? [...sheet.headers] : [];
}

export function getImportSheetOptionalHeaders(
  sheetName: Exclude<AnnualReportXlsxImportSheetName, "README">,
): string[] {
  const sheet = getImportSheetConfig(sheetName);
  return sheet?.optionalHeaders ? [...sheet.optionalHeaders] : [];
}
