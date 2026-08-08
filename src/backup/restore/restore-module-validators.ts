import { parseIdentityRegistry } from "../../data/identity/identity-registry-storage";
import type { SchoolProfile } from "../../school-profile/school-profile-types";
import { normalizePersonnelData } from "../../vyrocni-zprava/vyrocni-zprava-personnel-logic";
import { parseSchoolYearLabel } from "../../domain/school-year/school-year-label";
import {
  isRecord,
  validateAnnualReportMainExport,
  validateNamedSnapshotsExport,
  validateScenarioLabelExport,
} from "../backup-validation";
import type { RestoreKnownModuleId } from "./restore-types";

export type ModuleValidationOk = { ok: true; data: unknown; vzStartYear: number | null };
export type ModuleValidationFail = { ok: false; reason: string };
export type ModuleValidationResult = ModuleValidationOk | ModuleValidationFail;

/** Persisted SchoolProfile string fields — restore must not invent defaults/ids. */
const SCHOOL_PROFILE_STRING_FIELDS = [
  "id",
  "name",
  "ico",
  "redIzo",
  "izo",
  "schoolType",
  "address",
  "municipality",
  "region",
  "founder",
  "principalName",
  "website",
  "email",
  "phone",
  "dataBox",
  "createdAt",
  "updatedAt",
] as const satisfies readonly (keyof SchoolProfile)[];

/**
 * Strict restore validator for persisted SchoolProfile JSON.
 * Preserves `id` verbatim (including legacy/non-UUID). Never generates UUIDs or defaults.
 */
export function validateSchoolProfileForRestore(value: unknown): ModuleValidationResult {
  if (!isRecord(value)) return { ok: false, reason: "school_profile_not_object" };

  for (const key of Object.keys(value)) {
    if (!(SCHOOL_PROFILE_STRING_FIELDS as readonly string[]).includes(key)) {
      return { ok: false, reason: `school_profile_unknown_field:${key}` };
    }
  }

  for (const field of SCHOOL_PROFILE_STRING_FIELDS) {
    if (!(field in value)) {
      return { ok: false, reason: `school_profile_missing_field:${field}` };
    }
    if (typeof value[field] !== "string") {
      return { ok: false, reason: `school_profile_bad_type:${field}` };
    }
  }

  const id = value.id as string;
  if (id.trim() === "") {
    return { ok: false, reason: "school_profile_empty_id" };
  }

  const validated: SchoolProfile = {
    id,
    name: value.name as string,
    ico: value.ico as string,
    redIzo: value.redIzo as string,
    izo: value.izo as string,
    schoolType: value.schoolType as string,
    address: value.address as string,
    municipality: value.municipality as string,
    region: value.region as string,
    founder: value.founder as string,
    principalName: value.principalName as string,
    website: value.website as string,
    email: value.email as string,
    phone: value.phone as string,
    dataBox: value.dataBox as string,
    createdAt: value.createdAt as string,
    updatedAt: value.updatedAt as string,
  };

  return { ok: true, data: validated, vzStartYear: null };
}

function validateVzDataEnvelope(value: unknown, label: string): ModuleValidationFail | null {
  if (!isRecord(value)) return { ok: false, reason: `${label}_not_object` };
  if (value.version !== 1) return { ok: false, reason: `${label}_bad_version` };
  if (!isRecord(value.data)) return { ok: false, reason: `${label}_missing_data` };
  if (value.savedAt != null && typeof value.savedAt !== "string") {
    return { ok: false, reason: `${label}_bad_saved_at` };
  }
  return null;
}

function validateAutosavePayload(value: unknown): boolean {
  return isRecord(value) || Array.isArray(value);
}

function validateCalculatorModule(data: unknown, options?: { allowNotes?: boolean }): ModuleValidationResult {
  if (!isRecord(data)) return { ok: false, reason: "calculator_not_object" };
  const allowed = new Set(["autosave", "namedSnapshots", ...(options?.allowNotes ? ["notes"] : [])]);
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) return { ok: false, reason: `calculator_unknown_field:${key}` };
  }
  if (data.autosave != null && !validateAutosavePayload(data.autosave)) {
    return { ok: false, reason: "autosave_invalid" };
  }
  if (data.namedSnapshots != null) {
    const named = validateNamedSnapshotsExport(data.namedSnapshots);
    if (!named.ok) return { ok: false, reason: "named_snapshots_invalid" };
  }
  if (options?.allowNotes && data.notes != null && typeof data.notes !== "string") {
    return { ok: false, reason: "notes_invalid" };
  }
  if (data.autosave == null && data.namedSnapshots == null && data.notes == null) {
    return { ok: false, reason: "calculator_empty" };
  }
  return { ok: true, data, vzStartYear: null };
}

function validateAnnualReportRestore(data: unknown): ModuleValidationResult {
  if (!isRecord(data)) return { ok: false, reason: "annual_report_not_object" };
  const allowed = new Set(["main", "personnel", "sections"]);
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) return { ok: false, reason: `annual_report_unknown_field:${key}` };
  }

  let vzStartYear: number | null = null;

  if (data.main != null) {
    const mainValidation = validateAnnualReportMainExport(data.main);
    if (!mainValidation.ok) return { ok: false, reason: "annual_report_main_invalid" };
    const main = data.main as { report?: { schoolYear?: unknown } };
    const schoolYear = main.report?.schoolYear;
    if (schoolYear != null && typeof schoolYear !== "string") {
      return { ok: false, reason: "annual_report_school_year_invalid" };
    }
    if (typeof schoolYear === "string") {
      vzStartYear = parseSchoolYearLabel(schoolYear);
    }
  }

  if (data.personnel != null) {
    const envFail = validateVzDataEnvelope(data.personnel, "personnel");
    if (envFail) return envFail;
    const personnel = data.personnel as { data: unknown };
    if (normalizePersonnelData(personnel.data) == null) {
      return { ok: false, reason: "personnel_data_invalid" };
    }
  }

  if (data.sections != null) {
    if (!isRecord(data.sections)) return { ok: false, reason: "sections_not_object" };
    for (const [sectionId, sectionPayload] of Object.entries(data.sections)) {
      if (!/^(0[1-2]|0[4-9]|1[0-4])$/.test(sectionId)) {
        return { ok: false, reason: `section_id_invalid:${sectionId}` };
      }
      const envFail = validateVzDataEnvelope(sectionPayload, `section_${sectionId}`);
      if (envFail) return envFail;
    }
  }

  if (data.main == null && data.personnel == null && data.sections == null) {
    return { ok: false, reason: "annual_report_empty" };
  }

  return { ok: true, data, vzStartYear };
}

/**
 * Restore-depth validation for a known module payload.
 * Stricter than export-only validateForExport for composite modules.
 */
export function validateKnownModuleDataForRestore(
  moduleId: RestoreKnownModuleId,
  data: unknown,
): ModuleValidationResult {
  switch (moduleId) {
    case "school-profile":
      return validateSchoolProfileForRestore(data);
    case "identity-registry": {
      const parsed = parseIdentityRegistry(data);
      if (!parsed) return { ok: false, reason: "identity_registry_invalid" };
      return { ok: true, data: parsed, vzStartYear: null };
    }
    case "annual-report":
      return validateAnnualReportRestore(data);
    case "phmax-pv":
    case "phmax-sd":
    case "phmax-zs":
    case "phmax-nv75":
      return validateCalculatorModule(data);
    case "phmax-ss":
      return validateCalculatorModule(data, { allowNotes: true });
    case "phmax-scenario-label": {
      const label = validateScenarioLabelExport(data);
      if (!label.ok || typeof data !== "string" || data.trim() === "") {
        return { ok: false, reason: "scenario_label_invalid" };
      }
      return { ok: true, data, vzStartYear: null };
    }
    default: {
      const _exhaustive: never = moduleId;
      return { ok: false, reason: `unsupported:${String(_exhaustive)}` };
    }
  }
}
