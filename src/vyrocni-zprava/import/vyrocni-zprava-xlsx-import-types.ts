import type { SchoolProfile } from "../../school-profile/school-profile-types";
import type { AnnualReportPersonnelData } from "../vyrocni-zprava-personnel-types";
import type { VyrocniZpravaSection01Data } from "../vyrocni-zprava-section01-types";
import type { AnnualReportSection02Data } from "../vyrocni-zprava-section02-types";
import type { AnnualReportSection04Data } from "../vyrocni-zprava-section04-types";
import type { AnnualReportSection05Data } from "../vyrocni-zprava-section05-types";
import type { AnnualReportSection06Data } from "../vyrocni-zprava-section06-types";
import type { AnnualReportSection07Data } from "../vyrocni-zprava-section07-types";
import type { AnnualReportSection08Data } from "../vyrocni-zprava-section08-types";
import type { AnnualReportSection09Data } from "../vyrocni-zprava-section09-types";
import type { AnnualReportSection10Data } from "../vyrocni-zprava-section10-types";
import type { AnnualReportSection11Data } from "../vyrocni-zprava-section11-types";
import type { AnnualReportSection12Data } from "../vyrocni-zprava-section12-types";
import type { AnnualReportSection13Data } from "../vyrocni-zprava-section13-types";
import type { AnnualReportSection14Data } from "../vyrocni-zprava-section14-types";
import type { AnnualReportPublicationBlock } from "../vyrocni-zprava-types";

export type AnnualReportXlsxImportIssue = {
  sheet?: string;
  row?: number;
  field?: string;
  message: string;
};

export type AnnualReportXlsxImportResult = {
  valid: boolean;
  sourceFileName?: string;
  importedAt: string;
  detectedSheets: string[];
  profilePatch?: Partial<SchoolProfile>;
  section01Data?: VyrocniZpravaSection01Data;
  section02Data?: AnnualReportSection02Data;
  section03Data?: AnnualReportPersonnelData;
  section04Data?: AnnualReportSection04Data;
  section05Data?: AnnualReportSection05Data;
  section06Data?: AnnualReportSection06Data;
  section07Data?: AnnualReportSection07Data;
  section08Data?: AnnualReportSection08Data;
  section09Data?: AnnualReportSection09Data;
  section10Data?: AnnualReportSection10Data;
  section11Data?: AnnualReportSection11Data;
  section12Data?: AnnualReportSection12Data;
  section13Data?: AnnualReportSection13Data;
  section14Data?: AnnualReportSection14Data;
  publicationBlockPatch?: Partial<AnnualReportPublicationBlock>;
  sectionReadiness: Partial<Record<AnnualReportImportSectionId, "CHYBI_UDAJE" | "PRIPRAVENO">>;
  errors: AnnualReportXlsxImportIssue[];
  warnings: AnnualReportXlsxImportIssue[];
  ignored: AnnualReportXlsxImportIssue[];
};

export type AnnualReportImportSectionId =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "publication";

export type AnnualReportXlsxImportSheetName =
  | "README"
  | "Profil školy"
  | "01 Základní údaje"
  | "02 Obory vzdělání"
  | "03 Personální údaje"
  | "04 Zápis a žáci"
  | "05 ŠVP"
  | "06 Výsledky vzdělávání"
  | "07 Prevence a podpora"
  | "08 DVPP a rozvoj pracovníků"
  | "09 Aktivity a prezentace"
  | "10 ČŠI"
  | "11 Hospodaření"
  | "12 Projekty a granty"
  | "13 Spolupráce s rodiči"
  | "14 Závěr"
  | "Schválení a zveřejnění";
