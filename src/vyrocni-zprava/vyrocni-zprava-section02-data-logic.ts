import type { SchoolProfile } from "../school-profile/school-profile-types";
import type { AnnualReportSection02Data, AnnualReportSection02EducationField } from "./vyrocni-zprava-section02-types";

export const VYROCNI_ZPRAVA_SECTION02_LS_KEY = "vyrocni-zprava-section02-data-v1";

export type Section02Readiness = {
  status: "CHYBI_UDAJE" | "PRIPRAVENO";
  missingData: string[];
  recommendedData: string[];
  availableData: string[];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" ? pickFilledString(value) : undefined;
}

function normalizeEducationField(raw: unknown): AnnualReportSection02EducationField | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = sanitizeOptionalText(o.name) ?? "";
  return {
    code: sanitizeOptionalText(o.code),
    name,
    form: sanitizeOptionalText(o.form),
    level: sanitizeOptionalText(o.level),
    note: sanitizeOptionalText(o.note),
  };
}

export function createDefaultSection02EducationField(): AnnualReportSection02EducationField {
  return {
    code: "",
    name: "",
    form: "",
    level: "",
    note: "",
  };
}

export function createDefaultSection02Data(): AnnualReportSection02Data {
  return {
    educationFields: [],
    registrySource: "",
    registryVerifiedAt: "",
    notes: "",
  };
}

export function normalizeSection02Data(raw: unknown): AnnualReportSection02Data | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const fields = Array.isArray(o.educationFields)
    ? o.educationFields
        .map(normalizeEducationField)
        .filter((field): field is AnnualReportSection02EducationField => field !== null)
    : [];
  return {
    educationFields: fields,
    registrySource: sanitizeOptionalText(o.registrySource) ?? "",
    registryVerifiedAt: sanitizeOptionalText(o.registryVerifiedAt) ?? "",
    notes: sanitizeOptionalText(o.notes) ?? "",
  };
}

export function detectSection02MissingFields(section02Data: AnnualReportSection02Data): string[] {
  const missing: string[] = [];
  if (section02Data.educationFields.length === 0) {
    missing.push("Alespoň jeden obor vzdělání");
    return missing;
  }

  section02Data.educationFields.forEach((field, index) => {
    if (!pickFilledString(field.name)) {
      missing.push(`Název oboru / vzdělávacího programu (řádek ${index + 1})`);
    }
  });

  return missing;
}

export function getSection02Readiness(params: {
  section02Data: AnnualReportSection02Data;
  schoolProfile: SchoolProfile;
}): Section02Readiness {
  const missingData = detectSection02MissingFields(params.section02Data);
  const recommendedData: string[] = [];
  const availableData: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = pickFilledString(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  params.section02Data.educationFields.forEach((field, index) => {
    const row = index + 1;
    const name = pickFilledString(field.name);
    if (name) {
      availableData.push(`Obor ${row}: ${name}`);
    }

    const code = pickFilledString(field.code);
    if (code) {
      availableData.push(`Kód oboru ${row}: ${code}`);
    } else if (name) {
      recommendedData.push(`Kód oboru (řádek ${row})`);
    }

    const form = pickFilledString(field.form);
    if (form) availableData.push(`Forma vzdělávání ${row}: ${form}`);
    const level = pickFilledString(field.level);
    if (level) availableData.push(`Stupeň vzdělání ${row}: ${level}`);
  });

  const registrySource = pickFilledString(params.section02Data.registrySource);
  const registryVerifiedAt = pickFilledString(params.section02Data.registryVerifiedAt);
  if (registrySource) {
    availableData.push(`Zdroj ověření v rejstříku: ${registrySource}`);
  } else {
    recommendedData.push("Zdroj ověření v rejstříku");
  }

  if (registryVerifiedAt) {
    availableData.push(`Datum ověření: ${registryVerifiedAt}`);
  } else {
    recommendedData.push("Datum ověření");
  }

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
  };
}
