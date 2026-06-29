import type { SchoolProfile } from "../school-profile/school-profile-types";
import { formatSchoolTypeForReport } from "./vyrocni-zprava-text-formatting-helpers";
import type {
  AnnualReportSection12Data,
  AnnualReportSection12ProjectRecord,
} from "./vyrocni-zprava-section12-types";

export const VYROCNI_ZPRAVA_SECTION12_LS_KEY = "vyrocni-zprava-section12-data-v1";

export type Section12Readiness = {
  status: "CHYBI_UDAJE" | "PRIPRAVENO";
  missingData: string[];
  recommendedData: string[];
  availableData: string[];
  warnings: string[];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" ? pickFilledString(value) : undefined;
}

function normalizeProject(raw: unknown): AnnualReportSection12ProjectRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const title = sanitizeOptionalText(item.title);
  if (!title) return null;
  return {
    title,
    provider: sanitizeOptionalText(item.provider),
    amount: sanitizeOptionalText(item.amount),
    description: sanitizeOptionalText(item.description),
    focusAreas: sanitizeOptionalText(item.focusAreas),
  };
}

function projectHasDetails(row: AnnualReportSection12ProjectRecord): boolean {
  return Boolean(
    pickFilledString(row.provider) ||
      pickFilledString(row.amount) ||
      pickFilledString(row.description) ||
      pickFilledString(row.focusAreas),
  );
}

export function createDefaultSection12ProjectRecord(): AnnualReportSection12ProjectRecord {
  return { title: "", provider: "", amount: "", description: "", focusAreas: "" };
}

export function createDefaultSection12Data(): AnnualReportSection12Data {
  return { projects: [], otherPrograms: "", summaryEvaluation: "", notes: "" };
}

export function normalizeSection12Data(raw: unknown): AnnualReportSection12Data | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    projects: Array.isArray(item.projects)
      ? item.projects.map(normalizeProject).filter((row): row is AnnualReportSection12ProjectRecord => row !== null)
      : [],
    otherPrograms: sanitizeOptionalText(item.otherPrograms) ?? "",
    summaryEvaluation: sanitizeOptionalText(item.summaryEvaluation) ?? "",
    notes: sanitizeOptionalText(item.notes) ?? "",
  };
}

export function getSection12Readiness(params: {
  section12Data: AnnualReportSection12Data;
  schoolProfile: SchoolProfile;
}): Section12Readiness {
  const d = params.section12Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = formatSchoolTypeForReport(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  const validProjects = d.projects.filter((row) => pickFilledString(row.title));
  const otherPrograms = pickFilledString(d.otherPrograms);
  const summaryEvaluation = pickFilledString(d.summaryEvaluation);

  if (validProjects.length === 0 && !otherPrograms && !summaryEvaluation) {
    missingData.push("Alespoň jeden projekt/grant nebo popis dalších programů");
  } else {
    if (validProjects.length > 0) availableData.push(`Projekty a granty: ${validProjects.length}`);
    if (otherPrograms) availableData.push("Další programy");
    if (summaryEvaluation) availableData.push("Souhrnné vyhodnocení kapitoly");
  }

  validProjects.forEach((row, index) => {
    if (!projectHasDetails(row)) {
      recommendedData.push(`Doplňující údaje k projektu ${index + 1} (${row.title})`);
    }
  });

  if (!pickFilledString(d.notes)) recommendedData.push("Poznámky");
  else availableData.push("Poznámky");

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
    warnings,
  };
}
