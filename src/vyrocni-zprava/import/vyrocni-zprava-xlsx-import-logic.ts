import type { Worksheet } from "exceljs";
import type { SchoolProfile, SchoolProfileFieldKey } from "../../school-profile/school-profile-types";
import type { AnnualReportPublicationBlock } from "../vyrocni-zprava-types";
import {
  createDefaultPersonnelData,
  detectMissingPersonnelFields,
  detectPersonnelInconsistencies,
} from "../vyrocni-zprava-personnel-logic";
import { createDefaultSection01Data, getSection01Readiness } from "../vyrocni-zprava-section01-data-logic";
import { createDefaultSection02Data, getSection02Readiness } from "../vyrocni-zprava-section02-data-logic";
import { parseCzechNumberInput } from "../vyrocni-zprava-number-input-helpers";
import {
  createDefaultSection04Data,
  getSection04Readiness,
  matchKnownSecondarySchoolType,
  normalizeSecondarySchoolTypeKey,
} from "../vyrocni-zprava-section04-data-logic";
import type { AnnualReportSection04PupilCountRow } from "../vyrocni-zprava-section04-types";
import { createDefaultSection05Data, getSection05Readiness } from "../vyrocni-zprava-section05-data-logic";
import { createDefaultSection06Data, getSection06Readiness } from "../vyrocni-zprava-section06-data-logic";
import { createDefaultSection07Data, getSection07Readiness } from "../vyrocni-zprava-section07-data-logic";
import { createDefaultSection08Data, getSection08Readiness } from "../vyrocni-zprava-section08-data-logic";
import { createDefaultSection09Data, getSection09Readiness } from "../vyrocni-zprava-section09-data-logic";
import { createDefaultSection10Data, getSection10Readiness } from "../vyrocni-zprava-section10-data-logic";
import { createDefaultSection11Data, getSection11Readiness } from "../vyrocni-zprava-section11-data-logic";
import { createDefaultSection12Data, getSection12Readiness } from "../vyrocni-zprava-section12-data-logic";
import { createDefaultSection13Data, getSection13Readiness } from "../vyrocni-zprava-section13-data-logic";
import { createDefaultSection14Data, getSection14Readiness } from "../vyrocni-zprava-section14-data-logic";
import type { AnnualReportSection12ProjectRecord } from "../vyrocni-zprava-section12-types";
import type {
  AnnualReportImportSectionId,
  AnnualReportXlsxImportIssue,
  AnnualReportXlsxImportResult,
  AnnualReportXlsxImportSheetName,
} from "./vyrocni-zprava-xlsx-import-types";
import {
  ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR,
  ANNUAL_REPORT_XLSX_UPLOAD_ERROR,
  assertAnnualReportXlsxTemplateConfig,
  getImportSheetOptionalHeaders,
  getKnownImportSheetNames,
  getRequiredImportSheetNames,
} from "./vyrocni-zprava-xlsx-template-config";
import { loadExcelJsModule } from "./vyrocni-zprava-xlsx-exceljs";

const SECTION_SHEET_MAP: Record<AnnualReportImportSectionId, AnnualReportXlsxImportSheetName> = {
  "01": "01 Základní údaje",
  "02": "02 Obory vzdělání",
  "03": "03 Personální údaje",
  "04": "04 Zápis a žáci",
  "05": "05 ŠVP",
  "06": "06 Výsledky vzdělávání",
  "07": "07 Prevence a podpora",
  "08": "08 DVPP a rozvoj pracovníků",
  "09": "09 Aktivity a prezentace",
  "10": "10 ČŠI",
  "11": "11 Hospodaření",
  "12": "12 Projekty a granty",
  "13": "13 Spolupráce s rodiči",
  "14": "14 Závěr",
  publication: "Schválení a zveřejnění",
};

const PUBLICATION_BLOCK_KEYS: Array<keyof AnnualReportPublicationBlock> = [
  "discussedByPedagogicalCouncilDate",
  "approvedBySchoolCouncilDate",
  "sentToFounderDate",
  "publishedRemotelyDate",
  "placeAndDate",
  "principalSignature",
  "schoolCouncilChairSignature",
];

type ParsedRow = Record<string, string>;

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && value !== null && "text" in value) {
    const text = (value as { text?: string }).text;
    return typeof text === "string" ? text.trim() : String(value).trim();
  }
  return String(value).trim();
}

function addIssue(target: AnnualReportXlsxImportIssue[], message: string, options?: { sheet?: string; row?: number; field?: string }): void {
  target.push({ sheet: options?.sheet, row: options?.row, field: options?.field, message });
}

function readRows(sheet: Worksheet): ParsedRow[] {
  const headerValues = (sheet.getRow(1).values as unknown[]).slice(1).map((item) => String(item ?? "").trim());
  const rows: ParsedRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const rowValues = (sheet.getRow(r).values as unknown[]).slice(1).map(cellToString);
    if (rowValues.every((item) => item === "")) continue;
    const row: ParsedRow = {};
    headerValues.forEach((header, index) => {
      if (!header) return;
      row[header] = rowValues[index] ?? "";
    });
    row.__rowNumber = String(r);
    rows.push(row);
  }
  return rows;
}

function parseNumber(value: string, result: AnnualReportXlsxImportResult, sheet: string, rowNumber: number, fieldName = "hodnota"): number | undefined {
  if (value === "") return undefined;
  const parsed = parseCzechNumberInput(value);
  if (parsed === undefined) {
    addIssue(result.warnings, `Hodnota '${value}' není validní číslo.`, { sheet, row: rowNumber, field: fieldName });
  }
  return parsed;
}

function hasText(value: string | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function validateSheetHeaders(sheet: Worksheet, expected: string[], result: AnnualReportXlsxImportResult): void {
  const actualRaw = (sheet.getRow(1).values as unknown[]).slice(1).map((item) => String(item ?? "").trim());
  const actual = actualRaw.map((item) => normalize(item));
  const missing = expected.filter((header) => !actual.includes(normalize(header)));
  if (missing.length > 0) {
    addIssue(result.errors, `Chybí povinné hlavičky: ${missing.join(", ")}`, { sheet: sheet.name });
  }
  const optional = getImportSheetOptionalHeaders(sheet.name as Exclude<AnnualReportXlsxImportSheetName, "README">);
  const expectedSet = new Set([...expected, ...optional].map((item) => normalize(item)));
  actualRaw.forEach((header) => {
    if (!header) return;
    if (!expectedSet.has(normalize(header))) {
      addIssue(result.ignored, `Neznámý sloupec '${header}' byl ignorován.`, { sheet: sheet.name, field: header });
    }
  });
}

function parseBooleanLike(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === "") return undefined;
  if (normalized === "ano" || normalized === "true" || normalized === "1") return true;
  if (normalized === "ne" || normalized === "false" || normalized === "0") return false;
  return undefined;
}

function parseProfileSheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const allowedKeys: SchoolProfileFieldKey[] = ["name", "ico", "redIzo", "izo", "schoolType", "address", "municipality", "region", "founder", "principalName", "website", "email", "phone", "dataBox"];
  const patch: Partial<SchoolProfile> = {};
  const publicationPatch: Partial<AnnualReportPublicationBlock> = {};
  for (const row of rows) {
    const key = row.pole?.trim() ?? "";
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!key) continue;
    if ((PUBLICATION_BLOCK_KEYS as string[]).includes(key)) {
      if (hasText(value)) {
        (publicationPatch as Record<string, string>)[key] = value;
      }
      continue;
    }
    if (!allowedKeys.includes(key as SchoolProfileFieldKey)) {
      addIssue(result.ignored, `Neznámé pole profilu '${key}' bylo ignorováno.`, { sheet: "Profil školy", row: rowNumber, field: "pole" });
      continue;
    }
    if (!hasText(value)) continue;
    patch[key as SchoolProfileFieldKey] = value as never;
  }
  if (Object.keys(patch).length > 0) result.profilePatch = patch;
  if (Object.keys(publicationPatch).length > 0) {
    result.publicationBlockPatch = { ...(result.publicationBlockPatch ?? {}), ...publicationPatch };
  }
}

function parsePublicationSheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const patch: Partial<AnnualReportPublicationBlock> = {};
  for (const row of rows) {
    const key = row.pole?.trim() ?? "";
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!key) continue;
    if (!(PUBLICATION_BLOCK_KEYS as string[]).includes(key)) {
      addIssue(result.ignored, `Neznámé pole '${key}' v bloku schválení bylo ignorováno.`, {
        sheet: "Schválení a zveřejnění",
        row: rowNumber,
        field: "pole",
      });
      continue;
    }
    if (!hasText(value)) continue;
    (patch as Record<string, string>)[key] = value;
  }
  if (Object.keys(patch).length > 0) {
    result.publicationBlockPatch = { ...(result.publicationBlockPatch ?? {}), ...patch };
  }
}

function parseSection01Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection01Data();
  let touched = false;
  for (const row of rows) {
    const key = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!key) continue;
    if (!hasText(value)) continue;
    if (key === "schoolLeadershipInfo") {
      data.leadershipInfo = value;
      touched = true;
      continue;
    }
    if (key in data) {
      (data as Record<string, string | undefined>)[key] = value;
      touched = true;
      continue;
    }
    addIssue(result.ignored, `Neznámé pole '${key}' v sekci 01 bylo ignorováno.`, { sheet: "01 Základní údaje", row: rowNumber, field: "pole" });
  }
  if (touched) result.section01Data = data;
}

function parseSection02Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection02Data();
  let touched = false;
  for (const row of rows) {
    const rowNumber = Number(row.__rowNumber);
    const name = row.name?.trim() ?? "";
    if (hasText(name)) {
      data.educationFields.push({
        code: row.code?.trim() || undefined,
        name,
        form: row.form?.trim() || undefined,
        level: row.level?.trim() || undefined,
        note: row.note?.trim() || undefined,
      });
      touched = true;
    }
    const registrySource = row.registrySource?.trim() ?? "";
    if (hasText(registrySource) && !hasText(data.registrySource)) {
      data.registrySource = registrySource;
      touched = true;
    }
    const registryVerifiedAt = row.registryVerifiedAt?.trim() ?? "";
    if (hasText(registryVerifiedAt) && !hasText(data.registryVerifiedAt)) {
      data.registryVerifiedAt = registryVerifiedAt;
      touched = true;
    }
    const notes = row.notes?.trim() ?? "";
    if (hasText(notes) && !hasText(data.notes)) {
      data.notes = notes;
      touched = true;
    }
    if (!hasText(name) && !hasText(registrySource) && !hasText(registryVerifiedAt) && !hasText(notes) && hasText(row.code)) {
      addIssue(result.warnings, "Řádek oboru obsahuje kód, ale chybí název oboru.", { sheet: "02 Obory vzdělání", row: rowNumber, field: "name" });
    }
  }
  if (touched) result.section02Data = data;
}

function parseSection03Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultPersonnelData();
  let touched = false;
  const staffCategoryToPrefix: Record<string, string> = {
    teachers: "teachers",
    educators: "educators",
    specialPedagogues: "specialPedagogues",
    teachingAssistants: "teachingAssistants",
    nonTeachingStaff: "nonTeachingStaff",
  };
  const ageMap: Record<string, keyof typeof data.ageAndGender> = {
    under35: "under35",
    age36to45: "age36to45",
    age46to55: "age46to55",
    over55: "over55",
    retirementAge: "retirementAge",
  };
  const eduMap: Record<string, keyof typeof data.educationAndGender> = {
    lowerThanMaturita: "belowMaturita",
    maturita: "maturita",
    higherProfessional: "higherVocational",
    university: "university",
  };
  const qualMap: Record<string, keyof typeof data.qualification> = {
    primaryTeacher: "primaryTeachers",
    lowerSecondaryTeacher: "lowerSecondaryTeachers",
    educator: "educators",
    teachingAssistant: "teachingAssistants",
    specialPedagogue: "specialPedagogues",
  };
  for (const row of rows) {
    const block = row.blok?.trim();
    const category = row.kategorie?.trim();
    const field = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block || !field) continue;
    if (block === "basicStaff" && category && staffCategoryToPrefix[category]) {
      const parsed = parseNumber(value, result, "03 Personální údaje", rowNumber);
      if (parsed === undefined) continue;
      const prefix = staffCategoryToPrefix[category];
      if (field === "physicalPersons") {
        (data.staffCounts as Record<string, number | undefined>)[`${prefix}Persons`] = parsed;
        touched = true;
      } else if (field === "fte") {
        (data.staffCounts as Record<string, number | undefined>)[`${prefix}Fte`] = parsed;
        touched = true;
      } else {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku basicStaff.`, { sheet: "03 Personální údaje", row: rowNumber, field: "pole" });
      }
      continue;
    }
    if (block === "ageGender" && category && ageMap[category]) {
      const parsed = parseNumber(value, result, "03 Personální údaje", rowNumber);
      if (parsed === undefined) continue;
      const key = field === "male" ? "men" : field === "female" ? "women" : "";
      if (!key) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku ageGender.`, { sheet: "03 Personální údaje", row: rowNumber, field: "pole" });
        continue;
      }
      (data.ageAndGender[ageMap[category]] as Record<string, number | undefined>)[key] = parsed;
      touched = true;
      continue;
    }
    if (block === "educationGender" && category && eduMap[category]) {
      const parsed = parseNumber(value, result, "03 Personální údaje", rowNumber);
      if (parsed === undefined) continue;
      const key = field === "male" ? "men" : field === "female" ? "women" : "";
      if (!key) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku educationGender.`, { sheet: "03 Personální údaje", row: rowNumber, field: "pole" });
        continue;
      }
      (data.educationAndGender[eduMap[category]] as Record<string, number | undefined>)[key] = parsed;
      touched = true;
      continue;
    }
    if (block === "qualification" && category && qualMap[category]) {
      const parsed = parseNumber(value, result, "03 Personální údaje", rowNumber);
      if (parsed === undefined) continue;
      if (field !== "qualified" && field !== "notQualified") {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku qualification.`, { sheet: "03 Personální údaje", row: rowNumber, field: "pole" });
        continue;
      }
      data.qualification[qualMap[category]][field] = parsed;
      touched = true;
      continue;
    }
    if (block === "summary" && field === "notes" && hasText(value)) {
      data.notes = value;
      touched = true;
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok/pole).", { sheet: "03 Personální údaje", row: rowNumber, field: "blok" });
  }
  if (touched) result.section03Data = data;
}

function parseSection04Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection04Data();
  let touched = false;
  const septMap = new Map<string, AnnualReportSection04PupilCountRow>();
  const juneMap = new Map<string, AnnualReportSection04PupilCountRow>();
  const summaryFieldKeys = new Set(["firstTimeTotal", "firstTimeGirls", "afterDeferralTotal", "afterDeferralGirls", "enrolledTotal", "enrolledGirls", "deferralRequestsTotal", "deferralRequestsGirls"]);
  for (const row of rows) {
    const block = row.blok?.trim();
    const field = row.pole?.trim();
    const category = row.trida_nebo_kategorie?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block) continue;
    const numericOrWarn = (): number | undefined => parseNumber(value, result, "04 Zápis a žáci", rowNumber);
    if ((block === "firstGradeAdmissionCurrentYear" || block === "firstGradeEnrollmentNextYear") && field) {
      if (!summaryFieldKeys.has(field)) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku ${block}.`, { sheet: "04 Zápis a žáci", row: rowNumber, field: "pole" });
        continue;
      }
      const n = numericOrWarn();
      if (n !== undefined) {
        if (block === "firstGradeAdmissionCurrentYear") (data.firstGradeAdmissionCurrentYear as Record<string, number | undefined>)[field] = n;
        else (data.firstGradeEnrollmentNextYear as Record<string, number | undefined>)[field] = n;
        touched = true;
      }
      continue;
    }
    if ((block === "pupilsAdmittedDuringYear" || block === "pupilsLeftDuringYear") && category) {
      const n = numericOrWarn();
      const target = block === "pupilsAdmittedDuringYear" ? data.pupilsAdmittedDuringYear : data.pupilsLeftDuringYear;
      target.push({ grade: category, count: n });
      touched = true;
      continue;
    }
    if (block === "specialEnrollment" && field) {
      if (field !== "admittedTotal" && field !== "admittedGirls") {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku specialEnrollment.`, { sheet: "04 Zápis a žáci", row: rowNumber, field: "pole" });
        continue;
      }
      const n = numericOrWarn();
      if (n !== undefined) {
        (data.specialEnrollment as Record<string, number | undefined>)[field] = n;
        touched = true;
      }
      continue;
    }
    if (block === "secondarySchoolAdmissions" && category) {
      const parsedCount = value === "—" || value === "-" ? undefined : numericOrWarn();
      const knownType = matchKnownSecondarySchoolType(category);
      const normalizedCategory = normalizeSecondarySchoolTypeKey(category);
      const existingIndex = data.secondarySchoolAdmissions.findIndex(
        (item) => normalizeSecondarySchoolTypeKey(item.schoolType) === (knownType ? normalizeSecondarySchoolTypeKey(knownType) : normalizedCategory),
      );
      if (existingIndex >= 0) {
        const existing = data.secondarySchoolAdmissions[existingIndex]!;
        data.secondarySchoolAdmissions[existingIndex] = {
          schoolType: knownType ?? existing.schoolType,
          count: parsedCount ?? existing.count,
        };
      } else {
        data.secondarySchoolAdmissions.push({ schoolType: knownType ?? category, count: parsedCount });
      }
      touched = true;
      continue;
    }
    if ((block === "pupilCountsSeptember" || block === "pupilCountsJune") && category && field) {
      const targetMap = block === "pupilCountsSeptember" ? septMap : juneMap;
      const existing = targetMap.get(category) ?? { className: category };
      if (field === "classTeacher") {
        existing.classTeacher = value || undefined;
      } else if (field === "boys" || field === "girls" || field === "total") {
        (existing as Record<string, number | string | undefined>)[field] = numericOrWarn();
      } else {
        addIssue(result.ignored, `Neznámé pole '${field}' pro ${block}.`, { sheet: "04 Zápis a žáci", row: rowNumber, field: "pole" });
      }
      targetMap.set(category, existing);
      touched = true;
      continue;
    }
    if (block === "notes" && field === "notes") {
      data.notes = value;
      touched = touched || hasText(value);
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok/pole).", { sheet: "04 Zápis a žáci", row: rowNumber, field: "blok" });
  }
  data.pupilCountsSeptember = [...septMap.values()];
  data.pupilCountsJune = [...juneMap.values()];
  if (touched) result.section04Data = data;
}

function parseSection05Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection05Data();
  let touched = false;
  const weeklyMap = new Map<string, Record<string, number | string | undefined>>();
  const goalsMap = new Map<string, Record<string, string | undefined>>();
  const advancedMap = new Map<string, Record<string, unknown>>();
  const weeklyFields = new Set(["grade1", "grade2", "grade3", "grade4", "grade5", "grade6", "grade7", "grade8", "grade9"]);
  const goalLevelValues = new Set(["VETSINA_HODIN", "NEKTERE_HODINY", "NEOBJEVUJE_SE"]);
  for (const row of rows) {
    const block = row.blok?.trim();
    const order = row.poradi?.trim() ?? "";
    const subjectOrGoal = row.predmet_nebo_cil?.trim() ?? "";
    const field = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block) continue;
    if (block === "advancedCurriculumPlan") {
      const key = order || String(rowNumber);
      const existing = advancedMap.get(key) ?? {};
      const educationalArea = row.vzdelavaci_oblast?.trim() ?? "";
      const subject = row.predmet?.trim() ?? "";
      const detailSubject = row.detail_predmetu?.trim() ?? "";
      const grade1 = row.rocnik_1?.trim() ?? "";
      const grade2 = row.rocnik_2?.trim() ?? "";
      const grade3 = row.rocnik_3?.trim() ?? "";
      const grade4 = row.rocnik_4?.trim() ?? "";
      const grade5 = row.rocnik_5?.trim() ?? "";
      const firstStageAllocation = row.dotace_1_stupen?.trim() ?? "";
      const grade6 = row.rocnik_6?.trim() ?? "";
      const grade7 = row.rocnik_7?.trim() ?? "";
      const grade8 = row.rocnik_8?.trim() ?? "";
      const grade9 = row.rocnik_9?.trim() ?? "";
      const secondStageAllocation = row.dotace_2_stupen?.trim() ?? "";
      const isTotalRow = parseBooleanLike(row.je_souctovy_radek?.trim() ?? "");
      const note = row.poznamka?.trim() ?? "";

      if (hasText(educationalArea)) existing.educationalArea = educationalArea;
      if (hasText(subject)) existing.subject = subject;
      if (hasText(detailSubject)) {
        existing.subjectDetails = detailSubject
          .split(/[\n;]+/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
      if (hasText(grade1)) existing.grade1 = grade1;
      if (hasText(grade2)) existing.grade2 = grade2;
      if (hasText(grade3)) existing.grade3 = grade3;
      if (hasText(grade4)) existing.grade4 = grade4;
      if (hasText(grade5)) existing.grade5 = grade5;
      if (hasText(firstStageAllocation)) existing.firstStageAllocation = firstStageAllocation;
      if (hasText(grade6)) existing.grade6 = grade6;
      if (hasText(grade7)) existing.grade7 = grade7;
      if (hasText(grade8)) existing.grade8 = grade8;
      if (hasText(grade9)) existing.grade9 = grade9;
      if (hasText(secondStageAllocation)) existing.secondStageAllocation = secondStageAllocation;
      if (isTotalRow !== undefined) existing.isTotalRow = isTotalRow;
      if (hasText(note)) data.schoolCurriculumPlan.note = note;
      if (Object.keys(existing).length > 0) touched = true;
      advancedMap.set(key, existing);
      continue;
    }
    if (!field) continue;
    if (block === "educationProgram") {
      if (field === "name" || field === "applicableClasses" || field === "note") {
        if (hasText(value)) {
          (data.educationProgram as Record<string, string | undefined>)[field] = value;
          touched = true;
        }
      } else addIssue(result.ignored, `Neznámé pole '${field}' v bloku educationProgram.`, { sheet: "05 ŠVP", row: rowNumber, field: "pole" });
      continue;
    }
    if (block === "schoolCurriculumPlan") {
      if (field === "description" || field === "note") {
        if (hasText(value)) {
          (data.schoolCurriculumPlan as Record<string, string | undefined>)[field] = value;
          touched = true;
        }
      } else addIssue(result.ignored, `Neznámé pole '${field}' v bloku schoolCurriculumPlan.`, { sheet: "05 ŠVP", row: rowNumber, field: "pole" });
      continue;
    }
    if (block === "weeklyHourPlan") {
      if (!weeklyFields.has(field)) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku weeklyHourPlan.`, { sheet: "05 ŠVP", row: rowNumber, field: "pole" });
        continue;
      }
      const key = order || subjectOrGoal;
      if (!key) {
        addIssue(result.warnings, "Řádek weeklyHourPlan nemá poradi ani predmet_nebo_cil.", { sheet: "05 ŠVP", row: rowNumber });
        continue;
      }
      const existing = weeklyMap.get(key) ?? { subject: subjectOrGoal };
      if (hasText(subjectOrGoal)) existing.subject = subjectOrGoal;
      const parsed = parseNumber(value, result, "05 ŠVP", rowNumber);
      if (parsed !== undefined) {
        existing[field] = parsed;
        touched = true;
      }
      weeklyMap.set(key, existing);
      continue;
    }
    if (block === "goalsEvaluation") {
      const key = order || subjectOrGoal || String(rowNumber);
      const existing = goalsMap.get(key) ?? { goal: subjectOrGoal };
      if (hasText(subjectOrGoal)) existing.goal = subjectOrGoal;
      if (field === "goal" || field === "evidence" || field === "note") {
        if (hasText(value)) {
          existing[field] = value;
          touched = true;
        }
      } else if (field === "level") {
        const normalizedLevel = value.toUpperCase();
        if (!goalLevelValues.has(normalizedLevel)) {
          if (hasText(value)) addIssue(result.warnings, `Neznámá hodnota level '${value}'.`, { sheet: "05 ŠVP", row: rowNumber, field: "hodnota" });
        } else {
          existing.level = normalizedLevel;
          touched = true;
        }
      } else {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku goalsEvaluation.`, { sheet: "05 ŠVP", row: rowNumber, field: "pole" });
      }
      goalsMap.set(key, existing);
      continue;
    }
    if (block === "summary") {
      if (field === "overallEvaluation" || field === "strengths" || field === "areasForImprovement" || field === "measuresForNextYear" || field === "notes") {
        if (hasText(value)) {
          if (field === "overallEvaluation") data.overallEvaluation = value;
          if (field === "strengths") data.strengths = value;
          if (field === "areasForImprovement") data.areasForImprovement = value;
          if (field === "measuresForNextYear") data.measuresForNextYear = value;
          if (field === "notes") data.notes = value;
          touched = true;
        }
      } else addIssue(result.ignored, `Neznámé pole '${field}' v bloku summary.`, { sheet: "05 ŠVP", row: rowNumber, field: "pole" });
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok/pole).", { sheet: "05 ŠVP", row: rowNumber, field: "blok" });
  }
  data.schoolCurriculumPlan.weeklyHourPlan = [...weeklyMap.values()] as never;
  data.schoolCurriculumPlan.advancedCurriculumPlan = {
    rows: [...advancedMap.values()] as never,
    note: data.schoolCurriculumPlan.note,
  };
  data.goalsEvaluation = [...goalsMap.values()] as never;
  if (touched) result.section05Data = data;
}

function parseSection06Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection06Data();
  let touched = false;
  const firstMap = new Map<string, Record<string, unknown>>();
  const secondMap = new Map<string, Record<string, unknown>>();
  const classNumericFields = new Set(["pupilsTotal", "passedWithHonours", "passed", "failed", "notAssessed", "reducedConductGrade", "averageGrade", "excusedAbsencePerPupil", "unexcusedAbsencePerPupil"]);
  const measureFields = new Set(["classTeacherPraise", "principalPraise", "classTeacherWarning", "classTeacherReprimand", "principalReprimand", "secondConductGrade", "thirdConductGrade"]);
  const examFields = new Set(["description", "pupilsTotal", "passed", "failed", "note"]);
  for (const row of rows) {
    const block = row.blok?.trim();
    const term = row.pololeti?.trim();
    const className = row.trida?.trim();
    const field = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block) continue;
    const numberOrWarn = (): number | undefined => parseNumber(value, result, "06 Výsledky vzdělávání", rowNumber);
    if (block === "classResults" && term && className && field) {
      const targetMap = term === "first" ? firstMap : term === "second" ? secondMap : null;
      if (!targetMap) {
        addIssue(result.errors, `Neplatné pololeti '${term}' v bloku classResults.`, { sheet: "06 Výsledky vzdělávání", row: rowNumber, field: "pololeti" });
        continue;
      }
      const rowData = targetMap.get(className) ?? { className };
      if (field === "classTeacher") rowData.classTeacher = value || undefined;
      else if (classNumericFields.has(field)) rowData[field] = numberOrWarn();
      else addIssue(result.ignored, `Neznámé pole '${field}' v classResults.`, { sheet: "06 Výsledky vzdělávání", row: rowNumber, field: "pole" });
      targetMap.set(className, rowData);
      touched = true;
      continue;
    }
    if (block === "educationalMeasures" && term && field) {
      if (!measureFields.has(field)) {
        addIssue(result.ignored, `Neznámé pole '${field}' v educationalMeasures.`, { sheet: "06 Výsledky vzdělávání", row: rowNumber, field: "pole" });
        continue;
      }
      const target = term === "first" ? data.educationalMeasures.firstTerm ?? {} : term === "second" ? data.educationalMeasures.secondTerm ?? {} : null;
      if (!target) {
        addIssue(result.errors, `Neplatné pololeti '${term}' v educationalMeasures.`, { sheet: "06 Výsledky vzdělávání", row: rowNumber, field: "pololeti" });
        continue;
      }
      (target as Record<string, number | undefined>)[field] = numberOrWarn();
      if (term === "first") data.educationalMeasures.firstTerm = target;
      if (term === "second") data.educationalMeasures.secondTerm = target;
      touched = true;
      continue;
    }
    if ((block === "finalExams" || block === "maturitaExams" || block === "absolutorium") && field) {
      if (!examFields.has(field)) {
        addIssue(result.ignored, `Neznámé pole '${field}' v ${block}.`, { sheet: "06 Výsledky vzdělávání", row: rowNumber, field: "pole" });
        continue;
      }
      const target = (data[block] ?? {}) as Record<string, number | string | undefined>;
      if (field === "description" || field === "note") target[field] = value || undefined;
      else target[field] = numberOrWarn();
      data[block] = target;
      touched = true;
      continue;
    }
    if (block === "summary" && field) {
      if (field === "summaryEvaluation") data.summaryEvaluation = value;
      else if (field === "notes") data.notes = value;
      else addIssue(result.ignored, `Neznámé pole '${field}' v summary.`, { sheet: "06 Výsledky vzdělávání", row: rowNumber, field: "pole" });
      touched = touched || hasText(value);
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok/pole).", { sheet: "06 Výsledky vzdělávání", row: rowNumber, field: "blok" });
  }
  data.firstTermClassResults = [...firstMap.values()] as never;
  data.secondTermClassResults = [...secondMap.values()] as never;
  if (touched) result.section06Data = data;
}

function parseSection07Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection07Data();
  let touched = false;
  const programmesMap = new Map<string, Record<string, string | undefined>>();
  const incidentsMap = new Map<string, Record<string, number | string | undefined>>();
  const supportNumberFields = new Set(["pupilsWithSvpTotal", "pupilsWithSupportMeasures", "pupilsWithIndividualEducationPlan", "pupilsWithPedagogicalIntervention", "pupilsWithTeachingAssistantSupport", "pupilsGifted", "pupilsExceptionallyGifted"]);
  for (const row of rows) {
    const block = row.blok?.trim();
    const order = row.poradi?.trim() ?? "";
    const category = row.kategorie?.trim() ?? "";
    const field = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block || !field) continue;
    if (block === "prevention") {
      if (field === "preventionStrategyDescription" || field === "preventionTeam" || field === "cooperation" || field === "evaluation") {
        if (hasText(value)) {
          (data.prevention as Record<string, string | undefined>)[field] = value;
          touched = true;
        }
      } else addIssue(result.ignored, `Neznámé pole '${field}' v bloku prevention.`, { sheet: "07 Prevence a podpora", row: rowNumber, field: "pole" });
      continue;
    }
    if (block === "preventionProgrammes") {
      const key = order || String(rowNumber);
      const existing = programmesMap.get(key) ?? {};
      if (field === "title" || field === "targetGroup" || field === "description" || field === "dateOrPeriod" || field === "provider") {
        if (hasText(value)) {
          existing[field] = value;
          touched = true;
        }
      } else addIssue(result.ignored, `Neznámé pole '${field}' v bloku preventionProgrammes.`, { sheet: "07 Prevence a podpora", row: rowNumber, field: "pole" });
      programmesMap.set(key, existing);
      continue;
    }
    if (block === "riskBehaviourIncidents") {
      const key = order || category || String(rowNumber);
      const existing = incidentsMap.get(key) ?? {};
      if (field === "count") {
        const parsed = parseNumber(value, result, "07 Prevence a podpora", rowNumber);
        if (parsed !== undefined) {
          existing.count = parsed;
          touched = true;
        }
      } else if (field === "type" || field === "adoptedMeasures" || field === "note") {
        if (hasText(value)) {
          existing[field] = value;
          touched = true;
        }
      } else addIssue(result.ignored, `Neznámé pole '${field}' v bloku riskBehaviourIncidents.`, { sheet: "07 Prevence a podpora", row: rowNumber, field: "pole" });
      if (!existing.type && hasText(category)) existing.type = category;
      incidentsMap.set(key, existing);
      continue;
    }
    if (block === "pupilsWithSupportNeeds") {
      if (supportNumberFields.has(field)) {
        const parsed = parseNumber(value, result, "07 Prevence a podpora", rowNumber);
        if (parsed !== undefined) {
          (data.pupilsWithSupportNeeds as Record<string, number | string | undefined>)[field] = parsed;
          touched = true;
        }
      } else if (field === "note" && hasText(value)) {
        data.pupilsWithSupportNeeds.note = value;
        touched = true;
      } else addIssue(result.ignored, `Neznámé pole '${field}' v bloku pupilsWithSupportNeeds.`, { sheet: "07 Prevence a podpora", row: rowNumber, field: "pole" });
      continue;
    }
    if (block === "supportConditions") {
      if (
        field === "counsellingWorkplaceDescription" ||
        field === "cooperationWithPppSpc" ||
        field === "supportMeasuresDescription" ||
        field === "inclusionMeasures" ||
        field === "giftedSupportDescription" ||
        field === "teachingAssistantSupportDescription" ||
        field === "materialAndOrganizationalConditions" ||
        field === "evaluation"
      ) {
        if (hasText(value)) {
          (data.supportConditions as Record<string, string | undefined>)[field] = value;
          touched = true;
        }
      } else addIssue(result.ignored, `Neznámé pole '${field}' v bloku supportConditions.`, { sheet: "07 Prevence a podpora", row: rowNumber, field: "pole" });
      continue;
    }
    if (block === "languagePreparation") {
      if (field === "pupilsWithLanguagePreparationEntitlement") {
        const parsed = parseNumber(value, result, "07 Prevence a podpora", rowNumber);
        if (parsed !== undefined) {
          data.languagePreparation.pupilsWithLanguagePreparationEntitlement = parsed;
          touched = true;
        }
      } else if (field === "languagePreparationProvided") {
        const normalizedValue = value.toUpperCase();
        if (normalizedValue === "ANO" || normalizedValue === "NE" || normalizedValue === "NERELEVANTNI" || normalizedValue === "NEUVEDENO") {
          data.languagePreparation.languagePreparationProvided = normalizedValue;
          touched = true;
        } else if (hasText(value)) {
          addIssue(result.warnings, `Neznámá hodnota languagePreparationProvided '${value}'.`, { sheet: "07 Prevence a podpora", row: rowNumber, field: "hodnota" });
        }
      } else if (field === "description" || field === "provider" || field === "note") {
        if (hasText(value)) {
          (data.languagePreparation as Record<string, string | number | undefined>)[field] = value;
          touched = true;
        }
      } else addIssue(result.ignored, `Neznámé pole '${field}' v bloku languagePreparation.`, { sheet: "07 Prevence a podpora", row: rowNumber, field: "pole" });
      continue;
    }
    if (block === "summary") {
      if (field === "summaryEvaluation" && hasText(value)) {
        data.summaryEvaluation = value;
        touched = true;
      } else if (field === "notes" && hasText(value)) {
        data.notes = value;
        touched = true;
      } else if (field !== "summaryEvaluation" && field !== "notes") {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku summary.`, { sheet: "07 Prevence a podpora", row: rowNumber, field: "pole" });
      }
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok/pole).", { sheet: "07 Prevence a podpora", row: rowNumber, field: "blok" });
  }
  data.prevention.preventionProgrammes = [...programmesMap.values()] as never;
  data.riskBehaviourIncidents = [...incidentsMap.values()] as never;
  if (touched) result.section07Data = data;
}

function parseSection08Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection08Data();
  let touched = false;
  const qualificationMap = new Map<string, Record<string, string | undefined>>();
  const additionalMap = new Map<string, Record<string, string | undefined>>();
  const trainingMap = new Map<string, Record<string, string | number | undefined>>();
  const nonTeachingMap = new Map<string, Record<string, string | number | undefined>>();
  for (const row of rows) {
    const block = row.blok?.trim();
    const order = row.poradi?.trim() ?? "";
    const field = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block || !field) continue;
    if (block === "dvppOverview") {
      if ((field === "description" || field === "priorities" || field === "evaluation") && hasText(value)) {
        (data.dvppOverview as Record<string, string | undefined>)[field] = value;
        touched = true;
      } else if (!(field === "description" || field === "priorities" || field === "evaluation")) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku dvppOverview.`, { sheet: "08 DVPP a rozvoj pracovníků", row: rowNumber, field: "pole" });
      }
      continue;
    }
    const parseList = (target: Map<string, Record<string, string | number | undefined>>, allowed: Set<string>) => {
      const key = order || String(rowNumber);
      const existing = target.get(key) ?? {};
      if (!allowed.has(field)) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku ${block}.`, { sheet: "08 DVPP a rozvoj pracovníků", row: rowNumber, field: "pole" });
        target.set(key, existing);
        return;
      }
      if (field === "hours") {
        const parsed = parseNumber(value, result, "08 DVPP a rozvoj pracovníků", rowNumber);
        if (parsed !== undefined) {
          existing.hours = parsed;
          touched = true;
        }
      } else if (field === "completed") {
        const normalizedValue = value.toUpperCase();
        if (normalizedValue === "ANO" || normalizedValue === "NE" || normalizedValue === "PROBIHA") {
          existing.completed = normalizedValue;
          touched = true;
        } else if (hasText(value)) {
          addIssue(result.warnings, `Neznámá hodnota completed '${value}'.`, { sheet: "08 DVPP a rozvoj pracovníků", row: rowNumber, field: "hodnota" });
        }
      } else if (hasText(value)) {
        existing[field] = value;
        touched = true;
      }
      target.set(key, existing);
    };
    if (block === "qualificationStudies") {
      parseList(qualificationMap, new Set(["title", "participantGroup", "provider", "period", "completed", "note"]));
      continue;
    }
    if (block === "additionalQualificationStudies") {
      parseList(additionalMap, new Set(["title", "participantGroup", "provider", "period", "completed", "note"]));
      continue;
    }
    if (block === "professionalDevelopmentTrainings") {
      parseList(trainingMap, new Set(["title", "participantGroup", "staffGroup", "topic", "provider", "period", "hours", "completed", "note"]));
      continue;
    }
    if (block === "nonTeachingStaffDevelopment") {
      parseList(nonTeachingMap, new Set(["title", "participantGroup", "staffGroup", "topic", "provider", "period", "hours", "completed", "note"]));
      continue;
    }
    if (block === "selfStudy") {
      if ((field === "description" || field === "topics" || field === "note") && hasText(value)) {
        (data.selfStudy as Record<string, string | undefined>)[field] = value;
        touched = true;
      } else if (!(field === "description" || field === "topics" || field === "note")) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku selfStudy.`, { sheet: "08 DVPP a rozvoj pracovníků", row: rowNumber, field: "pole" });
      }
      continue;
    }
    if (block === "summary") {
      if ((field === "summaryEvaluation" || field === "notes") && hasText(value)) {
        if (field === "summaryEvaluation") data.summaryEvaluation = value;
        if (field === "notes") data.notes = value;
        touched = true;
      } else if (!(field === "summaryEvaluation" || field === "notes")) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku summary.`, { sheet: "08 DVPP a rozvoj pracovníků", row: rowNumber, field: "pole" });
      }
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok/pole).", { sheet: "08 DVPP a rozvoj pracovníků", row: rowNumber, field: "blok" });
  }
  data.qualificationStudies = [...qualificationMap.values()] as never;
  data.additionalQualificationStudies = [...additionalMap.values()] as never;
  data.professionalDevelopmentTrainings = [...trainingMap.values()] as never;
  data.nonTeachingStaffDevelopment = [...nonTeachingMap.values()] as never;
  if (touched) result.section08Data = data;
}

function parseSection09Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection09Data();
  let touched = false;
  const eventsMap = new Map<string, Record<string, string | undefined>>();
  const competitionsMap = new Map<string, Record<string, string | undefined>>();
  const projectsMap = new Map<string, Record<string, string | undefined>>();
  for (const row of rows) {
    const block = row.blok?.trim();
    const order = row.poradi?.trim() ?? "";
    const field = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block || !field) continue;
    const parseList = (target: Map<string, Record<string, string | undefined>>, allowed: Set<string>) => {
      const key = order || String(rowNumber);
      const existing = target.get(key) ?? {};
      if (!allowed.has(field)) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku ${block}.`, { sheet: "09 Aktivity a prezentace", row: rowNumber, field: "pole" });
        target.set(key, existing);
        return;
      }
      if (field === "publicEvent") {
        const normalizedValue = value.toUpperCase();
        if (normalizedValue === "ANO" || normalizedValue === "NE" || normalizedValue === "CASTECNE") {
          existing.publicEvent = normalizedValue;
          touched = true;
        } else if (hasText(value)) {
          addIssue(result.warnings, `Neznámá hodnota publicEvent '${value}'.`, { sheet: "09 Aktivity a prezentace", row: rowNumber, field: "hodnota" });
        }
      } else if (hasText(value)) {
        existing[field] = value;
        touched = true;
      }
      target.set(key, existing);
    };
    if (block === "publicPresentation") {
      if (
        (field === "description" || field === "website" || field === "socialMedia" || field === "mediaOutputs" || field === "cooperationWithCommunity" || field === "note") &&
        hasText(value)
      ) {
        (data.publicPresentation as Record<string, string | undefined>)[field] = value;
        touched = true;
      } else if (!(field === "description" || field === "website" || field === "socialMedia" || field === "mediaOutputs" || field === "cooperationWithCommunity" || field === "note")) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku publicPresentation.`, { sheet: "09 Aktivity a prezentace", row: rowNumber, field: "pole" });
      }
      continue;
    }
    if (block === "schoolEvents") {
      parseList(eventsMap, new Set(["dateOrPeriod", "title", "eventType", "targetGroup", "description", "location", "partner", "publicEvent", "note"]));
      continue;
    }
    if (block === "competitions") {
      parseList(competitionsMap, new Set(["dateOrPeriod", "title", "subjectOrArea", "participants", "result", "level", "note"]));
      continue;
    }
    if (block === "projectsAndCooperation") {
      parseList(projectsMap, new Set(["title", "type", "partner", "period", "description", "output", "note"]));
      continue;
    }
    if (block === "summary") {
      if ((field === "extraordinaryAchievements" || field === "summaryEvaluation" || field === "notes") && hasText(value)) {
        if (field === "extraordinaryAchievements") data.extraordinaryAchievements = value;
        if (field === "summaryEvaluation") data.summaryEvaluation = value;
        if (field === "notes") data.notes = value;
        touched = true;
      } else if (!(field === "extraordinaryAchievements" || field === "summaryEvaluation" || field === "notes")) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku summary.`, { sheet: "09 Aktivity a prezentace", row: rowNumber, field: "pole" });
      }
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok/pole).", { sheet: "09 Aktivity a prezentace", row: rowNumber, field: "blok" });
  }
  data.schoolEvents = [...eventsMap.values()] as never;
  data.competitions = [...competitionsMap.values()] as never;
  data.projectsAndCooperation = [...projectsMap.values()] as never;
  if (touched) result.section09Data = data;
}

function parseSection10Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection10Data();
  let touched = false;
  const inspectionsMap = new Map<string, Record<string, string | undefined>>();
  for (const row of rows) {
    const block = row.blok?.trim();
    const order = row.poradi?.trim() ?? "";
    const field = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block || !field) continue;
    if (block === "status" && field === "inspectionActivityStatus") {
      const normalizedValue = value.toUpperCase();
      if (normalizedValue === "PROBEHLA" || normalizedValue === "NEPROBEHLA" || normalizedValue === "NEUVEDENO") {
        data.inspectionActivityStatus = normalizedValue;
        touched = true;
      } else if (hasText(value)) {
        addIssue(result.warnings, `Neznámá hodnota inspectionActivityStatus '${value}'.`, { sheet: "10 ČŠI", row: rowNumber, field: "hodnota" });
      }
      continue;
    }
    if (block === "inspections") {
      const key = order || String(rowNumber);
      const existing = inspectionsMap.get(key) ?? {};
      const allowed = new Set(["dateOrPeriod", "inspectionType", "subject", "reportReference", "reportUrl", "mainFindings", "conclusions", "adoptedMeasures", "note"]);
      if (!allowed.has(field)) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku inspections.`, { sheet: "10 ČŠI", row: rowNumber, field: "pole" });
      } else if (hasText(value)) {
        existing[field] = value;
        touched = true;
      }
      inspectionsMap.set(key, existing);
      continue;
    }
    if (block === "noInspection" && field === "noInspectionStatement" && hasText(value)) {
      data.noInspectionStatement = value;
      touched = true;
      continue;
    }
    if (block === "summary") {
      if ((field === "summaryEvaluation" || field === "notes") && hasText(value)) {
        if (field === "summaryEvaluation") data.summaryEvaluation = value;
        if (field === "notes") data.notes = value;
        touched = true;
      } else if (!(field === "summaryEvaluation" || field === "notes")) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku summary.`, { sheet: "10 ČŠI", row: rowNumber, field: "pole" });
      }
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok/pole).", { sheet: "10 ČŠI", row: rowNumber, field: "blok" });
  }
  data.inspections = [...inspectionsMap.values()] as never;
  if (data.inspectionActivityStatus === "NEPROBEHLA" && data.inspections.length > 0) {
    addIssue(result.warnings, "Status je NEPROBEHLA, ale byly importovány řádky inspekcí.", { sheet: "10 ČŠI" });
  }
  if (touched) result.section10Data = data;
}

function parseSection11Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection11Data();
  let touched = false;
  const grantsMap = new Map<string, Record<string, unknown>>();
  const investmentsMap = new Map<string, Record<string, unknown>>();
  const numericRevenueFields = new Set(["stateBudgetContribution", "founderContribution", "grantsAndProjects", "ownRevenue", "donations", "otherRevenue", "totalRevenue"]);
  const numericExpensesFields = new Set(["salaryCosts", "statutoryContributions", "operatingCosts", "energyCosts", "repairsAndMaintenance", "equipmentAndMaterials", "services", "grantsAndProjectsExpenses", "otherExpenses", "totalExpenses"]);
  const numericEconomicFields = new Set(["profitOrLoss", "mainActivityResult", "supplementaryActivityResult", "reserveFundAllocation"]);
  for (const row of rows) {
    const block = row.blok?.trim();
    const key = row.polozka?.trim();
    const rowName = row.nazev_radku?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block) continue;
    const numberOrWarn = (): number | undefined => parseNumber(value, result, "11 Hospodaření", rowNumber);
    if (block === "reportingPeriod" && key === "reportingPeriod") {
      data.reportingPeriod = value;
      touched = touched || hasText(value);
      continue;
    }
    if (block === "revenue" && key) {
      if (key === "note") data.revenue.note = value || undefined;
      else if (numericRevenueFields.has(key)) (data.revenue as Record<string, number | undefined>)[key] = numberOrWarn();
      else addIssue(result.ignored, `Neznámé pole '${key}' v revenue.`, { sheet: "11 Hospodaření", row: rowNumber, field: "polozka" });
      touched = true;
      continue;
    }
    if (block === "expenses" && key) {
      if (key === "note") data.expenses.note = value || undefined;
      else if (numericExpensesFields.has(key)) (data.expenses as Record<string, number | undefined>)[key] = numberOrWarn();
      else addIssue(result.ignored, `Neznámé pole '${key}' v expenses.`, { sheet: "11 Hospodaření", row: rowNumber, field: "polozka" });
      touched = true;
      continue;
    }
    if (block === "economicResult" && key) {
      if (key === "note") data.economicResult.note = value || undefined;
      else if (numericEconomicFields.has(key)) (data.economicResult as Record<string, number | undefined>)[key] = numberOrWarn();
      else addIssue(result.ignored, `Neznámé pole '${key}' v economicResult.`, { sheet: "11 Hospodaření", row: rowNumber, field: "polozka" });
      touched = true;
      continue;
    }
    if (block === "grantsAndSubsidies" && key && rowName) {
      const grant = grantsMap.get(rowName) ?? { title: rowName };
      if (key === "title") grant.title = value || rowName;
      else if (key === "provider" || key === "purpose" || key === "note") grant[key] = value || undefined;
      else if (key === "amount" || key === "usedAmount") grant[key] = numberOrWarn();
      else addIssue(result.ignored, `Neznámé pole '${key}' v grantsAndSubsidies.`, { sheet: "11 Hospodaření", row: rowNumber, field: "polozka" });
      grantsMap.set(rowName, grant);
      touched = true;
      continue;
    }
    if (block === "supplementaryActivity" && key) {
      if (key === "carriedOut") {
        const upper = value.toUpperCase();
        if (upper === "ANO" || upper === "NE" || upper === "NEUVEDENO") {
          data.supplementaryActivity.carriedOut = upper;
          touched = true;
        } else if (value !== "") addIssue(result.warnings, `Neznámá hodnota doplňkové činnosti '${value}'.`, { sheet: "11 Hospodaření", row: rowNumber, field: "hodnota" });
      } else if (key === "description" || key === "note") {
        (data.supplementaryActivity as Record<string, string | undefined>)[key] = value || undefined;
        touched = true;
      } else if (key === "revenue" || key === "expenses" || key === "result") {
        (data.supplementaryActivity as Record<string, number | undefined>)[key] = numberOrWarn();
        touched = true;
      } else addIssue(result.ignored, `Neznámé pole '${key}' v supplementaryActivity.`, { sheet: "11 Hospodaření", row: rowNumber, field: "polozka" });
      continue;
    }
    if (block === "investmentsAndRepairs" && key && rowName) {
      const item = investmentsMap.get(rowName) ?? { title: rowName };
      if (key === "title") item.title = value || rowName;
      else if (key === "fundingSource" || key === "description" || key === "note") item[key] = value || undefined;
      else if (key === "amount") item.amount = numberOrWarn();
      else addIssue(result.ignored, `Neznámé pole '${key}' v investmentsAndRepairs.`, { sheet: "11 Hospodaření", row: rowNumber, field: "polozka" });
      investmentsMap.set(rowName, item);
      touched = true;
      continue;
    }
    if (block === "summary" && key) {
      if (key === "summaryCommentary") data.summaryCommentary = value;
      else if (key === "notes") data.notes = value;
      else addIssue(result.ignored, `Neznámé pole '${key}' v summary.`, { sheet: "11 Hospodaření", row: rowNumber, field: "polozka" });
      touched = touched || hasText(value);
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok/pole).", { sheet: "11 Hospodaření", row: rowNumber, field: "blok" });
  }
  data.grantsAndSubsidies = [...grantsMap.values()] as never;
  data.investmentsAndRepairs = [...investmentsMap.values()] as never;
  if (touched) result.section11Data = data;
}

function parseSection12Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection12Data();
  let touched = false;
  const projectsMap = new Map<string, AnnualReportSection12ProjectRecord>();
  for (const row of rows) {
    const block = row.blok?.trim();
    const order = row.poradi?.trim() ?? "";
    const field = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!block) continue;
    if (block === "projects") {
      if (!order || !field) continue;
      const existing = projectsMap.get(order) ?? { title: "" };
      if (field === "title" && hasText(value)) {
        existing.title = value;
        touched = true;
      } else if (field === "provider" && hasText(value)) {
        existing.provider = value;
        touched = true;
      } else if (field === "amount" && hasText(value)) {
        existing.amount = value;
        touched = true;
      } else if (field === "description" && hasText(value)) {
        existing.description = value;
        touched = true;
      } else if (field === "focusAreas" && hasText(value)) {
        existing.focusAreas = value;
        touched = true;
      } else if (hasText(value)) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku projects.`, {
          sheet: "12 Projekty a granty",
          row: rowNumber,
          field: "pole",
        });
      }
      projectsMap.set(order, existing);
      continue;
    }
    if (block === "otherPrograms" && hasText(value)) {
      data.otherPrograms = value;
      touched = true;
      continue;
    }
    if (block === "summary") {
      if (field === "summaryEvaluation" && hasText(value)) {
        data.summaryEvaluation = value;
        touched = true;
      } else if (field === "notes" && hasText(value)) {
        data.notes = value;
        touched = true;
      } else if (field && hasText(value)) {
        addIssue(result.ignored, `Neznámé pole '${field}' v bloku summary.`, {
          sheet: "12 Projekty a granty",
          row: rowNumber,
          field: "pole",
        });
      }
      continue;
    }
    addIssue(result.ignored, "Řádek byl ignorován (neznámý blok).", {
      sheet: "12 Projekty a granty",
      row: rowNumber,
      field: "blok",
    });
  }
  data.projects = [...projectsMap.values()].filter((item) => hasText(item.title));
  if (touched) result.section12Data = data;
}

function parseSection13Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection13Data();
  let touched = false;
  const allowedKeys = new Set(["parentCooperation", "founderCooperation", "partners", "summaryEvaluation", "notes"]);
  for (const row of rows) {
    const key = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!key) continue;
    if (!hasText(value)) continue;
    if (allowedKeys.has(key)) {
      (data as Record<string, string>)[key] = value;
      touched = true;
      continue;
    }
    addIssue(result.ignored, `Neznámé pole '${key}' v sekci 13 bylo ignorováno.`, {
      sheet: "13 Spolupráce s rodiči",
      row: rowNumber,
      field: "pole",
    });
  }
  if (touched) result.section13Data = data;
}

function parseSection14Sheet(rows: ParsedRow[], result: AnnualReportXlsxImportResult): void {
  const data = createDefaultSection14Data();
  let touched = false;
  const allowedKeys = new Set(["overallEvaluation", "futurePlans", "notes"]);
  for (const row of rows) {
    const key = row.pole?.trim();
    const value = row.hodnota?.trim() ?? "";
    const rowNumber = Number(row.__rowNumber);
    if (!key) continue;
    if (!hasText(value)) continue;
    if (allowedKeys.has(key)) {
      (data as Record<string, string>)[key] = value;
      touched = true;
      continue;
    }
    addIssue(result.ignored, `Neznámé pole '${key}' v sekci 14 bylo ignorováno.`, {
      sheet: "14 Závěr",
      row: rowNumber,
      field: "pole",
    });
  }
  if (touched) result.section14Data = data;
}

function appendReadinessWarnings(result: AnnualReportXlsxImportResult, currentProfile: SchoolProfile): void {
  const effectiveProfile = { ...currentProfile, ...(result.profilePatch ?? {}) };
  if (result.section01Data) {
    const readiness = getSection01Readiness({ section01Data: result.section01Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["01"] = readiness.status;
  }
  if (result.section02Data) {
    const readiness = getSection02Readiness({ section02Data: result.section02Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["02"] = readiness.status;
  }
  if (result.section03Data) {
    const missing = detectMissingPersonnelFields(result.section03Data);
    const warnings = detectPersonnelInconsistencies(result.section03Data);
    result.sectionReadiness["03"] = missing.length === 0 && warnings.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE";
    warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["03"] }));
  }
  if (result.section04Data) {
    const readiness = getSection04Readiness({ section04Data: result.section04Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["04"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["04"] }));
  }
  if (result.section05Data) {
    const readiness = getSection05Readiness({ section05Data: result.section05Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["05"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["05"] }));
  }
  if (result.section06Data) {
    const readiness = getSection06Readiness({ section06Data: result.section06Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["06"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["06"] }));
  }
  if (result.section07Data) {
    const readiness = getSection07Readiness({ section07Data: result.section07Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["07"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["07"] }));
  }
  if (result.section08Data) {
    const readiness = getSection08Readiness({ section08Data: result.section08Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["08"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["08"] }));
  }
  if (result.section09Data) {
    const readiness = getSection09Readiness({ section09Data: result.section09Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["09"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["09"] }));
  }
  if (result.section10Data) {
    const readiness = getSection10Readiness({ section10Data: result.section10Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["10"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["10"] }));
  }
  if (result.section11Data) {
    const readiness = getSection11Readiness({ section11Data: result.section11Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["11"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["11"] }));
  }
  if (result.section12Data) {
    const readiness = getSection12Readiness({ section12Data: result.section12Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["12"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["12"] }));
  }
  if (result.section13Data) {
    const readiness = getSection13Readiness({ section13Data: result.section13Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["13"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["13"] }));
  }
  if (result.section14Data) {
    const readiness = getSection14Readiness({ section14Data: result.section14Data, schoolProfile: effectiveProfile });
    result.sectionReadiness["14"] = readiness.status;
    readiness.warnings.forEach((message) => addIssue(result.warnings, message, { sheet: SECTION_SHEET_MAP["14"] }));
  }
}

function createEmptyResult(sourceFileName?: string): AnnualReportXlsxImportResult {
  return {
    valid: false,
    sourceFileName,
    importedAt: new Date().toISOString(),
    detectedSheets: [],
    sectionReadiness: {},
    errors: [],
    warnings: [],
    ignored: [],
  };
}

export async function parseVyrocniZpravaImportArrayBuffer(buffer: ArrayBuffer, options: { sourceFileName?: string; currentProfile: SchoolProfile }): Promise<AnnualReportXlsxImportResult> {
  const result = createEmptyResult(options.sourceFileName);
  try {
    assertAnnualReportXlsxTemplateConfig();
  } catch (error) {
    addIssue(result.errors, error instanceof Error ? error.message : ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR);
    return result;
  }

  let workbook;
  try {
    const ExcelJS = await loadExcelJsModule();
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
  } catch {
    addIssue(result.errors, ANNUAL_REPORT_XLSX_UPLOAD_ERROR);
    return result;
  }

  if (!Array.isArray(workbook.worksheets)) {
    addIssue(result.errors, ANNUAL_REPORT_XLSX_UPLOAD_ERROR);
    return result;
  }

  result.detectedSheets = workbook.worksheets.map((sheet) => sheet.name);
  for (const requiredSheet of getRequiredImportSheetNames()) {
    if (!workbook.getWorksheet(requiredSheet)) addIssue(result.errors, `Chybí povinný list '${requiredSheet}'.`);
  }
  for (const sheetConfig of assertAnnualReportXlsxTemplateConfig().sheets) {
    if (sheetConfig.name === "README" || sheetConfig.headers.length === 0) continue;
    const sheet = workbook.getWorksheet(sheetConfig.name);
    if (!sheet) continue;
    validateSheetHeaders(sheet, [...sheetConfig.headers], result);
  }
  const knownSheetNames = getKnownImportSheetNames();
  for (const sheetName of result.detectedSheets) {
    if (!knownSheetNames.has(sheetName as AnnualReportXlsxImportSheetName)) {
      addIssue(result.ignored, `List '${sheetName}' není podporován a byl ignorován.`, { sheet: sheetName });
    }
  }
  if (result.errors.length > 0) {
    result.valid = false;
    return result;
  }
  parseProfileSheet(readRows(workbook.getWorksheet("Profil školy")!), result);
  const s01 = workbook.getWorksheet("01 Základní údaje");
  if (s01) parseSection01Sheet(readRows(s01), result);
  const s02 = workbook.getWorksheet("02 Obory vzdělání");
  if (s02) parseSection02Sheet(readRows(s02), result);
  const s03 = workbook.getWorksheet("03 Personální údaje");
  if (s03) parseSection03Sheet(readRows(s03), result);
  parseSection04Sheet(readRows(workbook.getWorksheet("04 Zápis a žáci")!), result);
  const s05 = workbook.getWorksheet("05 ŠVP");
  if (s05) parseSection05Sheet(readRows(s05), result);
  parseSection06Sheet(readRows(workbook.getWorksheet("06 Výsledky vzdělávání")!), result);
  const s07 = workbook.getWorksheet("07 Prevence a podpora");
  if (s07) parseSection07Sheet(readRows(s07), result);
  const s08 = workbook.getWorksheet("08 DVPP a rozvoj pracovníků");
  if (s08) parseSection08Sheet(readRows(s08), result);
  const s09 = workbook.getWorksheet("09 Aktivity a prezentace");
  if (s09) parseSection09Sheet(readRows(s09), result);
  const s10 = workbook.getWorksheet("10 ČŠI");
  if (s10) parseSection10Sheet(readRows(s10), result);
  parseSection11Sheet(readRows(workbook.getWorksheet("11 Hospodaření")!), result);
  const s12 = workbook.getWorksheet("12 Projekty a granty");
  if (s12) parseSection12Sheet(readRows(s12), result);
  const s13 = workbook.getWorksheet("13 Spolupráce s rodiči");
  if (s13) parseSection13Sheet(readRows(s13), result);
  const s14 = workbook.getWorksheet("14 Závěr");
  if (s14) parseSection14Sheet(readRows(s14), result);
  const publication = workbook.getWorksheet("Schválení a zveřejnění");
  if (publication) parsePublicationSheet(readRows(publication), result);
  appendReadinessWarnings(result, options.currentProfile);
  result.valid = result.errors.length === 0;
  return result;
}

export async function parseVyrocniZpravaImportFile(file: File, currentProfile: SchoolProfile): Promise<AnnualReportXlsxImportResult> {
  const buffer = await file.arrayBuffer();
  return parseVyrocniZpravaImportArrayBuffer(buffer, { sourceFileName: file.name, currentProfile });
}
