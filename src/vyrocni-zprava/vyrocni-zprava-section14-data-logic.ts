import type { SchoolProfile } from "../school-profile/school-profile-types";
import { formatSchoolTypeForReport } from "./vyrocni-zprava-text-formatting-helpers";
import type { AnnualReportSection14Data } from "./vyrocni-zprava-section14-types";

export const VYROCNI_ZPRAVA_SECTION14_LS_KEY = "vyrocni-zprava-section14-data-v1";

export type Section14Readiness = {
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

export function createDefaultSection14Data(): AnnualReportSection14Data {
  return { overallEvaluation: "", futurePlans: "", notes: "" };
}

export function normalizeSection14Data(raw: unknown): AnnualReportSection14Data | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    overallEvaluation: sanitizeOptionalText(item.overallEvaluation) ?? "",
    futurePlans: sanitizeOptionalText(item.futurePlans) ?? "",
    notes: sanitizeOptionalText(item.notes) ?? "",
  };
}

export function getSection14Readiness(params: {
  section14Data: AnnualReportSection14Data;
  schoolProfile: SchoolProfile;
}): Section14Readiness {
  const d = params.section14Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = formatSchoolTypeForReport(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  const overallEvaluation = pickFilledString(d.overallEvaluation);
  if (!overallEvaluation) {
    missingData.push("Celkové zhodnocení školního roku");
  } else {
    availableData.push("Celkové zhodnocení školního roku");
    if (overallEvaluation.length < 80) {
      warnings.push("Celkové zhodnocení je velmi stručné.");
    }
  }

  if (!pickFilledString(d.futurePlans)) recommendedData.push("Plány do dalšího období");
  else availableData.push("Plány do dalšího období");

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
