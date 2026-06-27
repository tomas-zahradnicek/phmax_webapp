import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection02Readiness, type Section02Readiness } from "./vyrocni-zprava-section02-data-logic";
import type { AnnualReportSection02Data, AnnualReportSection02EducationField } from "./vyrocni-zprava-section02-types";

export type Section02GeneratorInput = {
  schoolYear: string;
  school: {
    name?: string;
    schoolType?: string;
  };
  educationFields: AnnualReportSection02EducationField[];
  registrySource?: string;
  registryVerifiedAt?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  readiness: Section02Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildEducationFields(data: AnnualReportSection02Data): AnnualReportSection02EducationField[] {
  return data.educationFields.map((field) => {
    const next: AnnualReportSection02EducationField = { name: pickFilledString(field.name) ?? "" };
    const code = pickFilledString(field.code);
    const form = pickFilledString(field.form);
    const level = pickFilledString(field.level);
    const note = pickFilledString(field.note);
    if (code) next.code = code;
    if (form) next.form = form;
    if (level) next.level = level;
    if (note) next.note = note;
    return next;
  });
}

/** Sestaví validovaný vstup pro generování kapitoly 02 – bez vymýšlení chybějících hodnot. */
export function buildSection02GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section02Data: AnnualReportSection02Data;
}): Section02GeneratorInput {
  const readiness = getSection02Readiness({
    section02Data: params.section02Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    school: {
      name: pickFilledString(params.schoolProfile.name),
      schoolType: pickFilledString(params.schoolProfile.schoolType),
    },
    educationFields: buildEducationFields(params.section02Data),
    registrySource: pickFilledString(params.section02Data.registrySource),
    registryVerifiedAt: pickFilledString(params.section02Data.registryVerifiedAt),
    notes: pickFilledString(params.section02Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    readiness: readiness.status,
  };
}

export { getSection02Readiness };
