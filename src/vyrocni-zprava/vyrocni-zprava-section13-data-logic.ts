import type { SchoolProfile } from "../school-profile/school-profile-types";
import { formatSchoolTypeForReport } from "./vyrocni-zprava-text-formatting-helpers";
import type { AnnualReportSection13Data } from "./vyrocni-zprava-section13-types";

export const VYROCNI_ZPRAVA_SECTION13_LS_KEY = "vyrocni-zprava-section13-data-v1";

export type Section13Readiness = {
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

export function createDefaultSection13Data(): AnnualReportSection13Data {
  return { parentCooperation: "", founderCooperation: "", partners: "", summaryEvaluation: "", notes: "" };
}

export function normalizeSection13Data(raw: unknown): AnnualReportSection13Data | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    parentCooperation: sanitizeOptionalText(item.parentCooperation) ?? "",
    founderCooperation: sanitizeOptionalText(item.founderCooperation) ?? "",
    partners: sanitizeOptionalText(item.partners) ?? "",
    summaryEvaluation: sanitizeOptionalText(item.summaryEvaluation) ?? "",
    notes: sanitizeOptionalText(item.notes) ?? "",
  };
}

export function getSection13Readiness(params: {
  section13Data: AnnualReportSection13Data;
  schoolProfile: SchoolProfile;
}): Section13Readiness {
  const d = params.section13Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = formatSchoolTypeForReport(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  const hasParent = Boolean(pickFilledString(d.parentCooperation));
  const hasFounder = Boolean(pickFilledString(d.founderCooperation));
  const hasPartners = Boolean(pickFilledString(d.partners));

  if (!hasParent && !hasFounder && !hasPartners) {
    missingData.push("Alespoň jeden popis spolupráce (rodiče, zřizovatel nebo partneři)");
  } else {
    if (hasParent) availableData.push("Spolupráce se zákonnými zástupci");
    if (hasFounder) availableData.push("Spolupráce se zřizovatelem");
    if (hasPartners) availableData.push("Další partneři školy");
  }

  if (!pickFilledString(d.summaryEvaluation)) recommendedData.push("Souhrnné vyhodnocení kapitoly");
  else availableData.push("Souhrnné vyhodnocení kapitoly");

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
