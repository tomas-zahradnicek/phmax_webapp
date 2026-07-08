import {

  createDefaultAnnualReport,

  mergeSectionDefinitions,

  refreshAllSections,

} from "./vyrocni-zprava-logic";

import type { AnnualReport } from "./vyrocni-zprava-types";

import { loadSchoolProfileFromStorage, migrateLegacySchoolProfileIfNeeded } from "../school-profile/school-profile-storage";



export const VYROCNI_ZPRAVA_LS_KEY = "vyrocni-zprava-state-v1";
export const VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX = "vyrocni-zprava-diagnostic-backup-v1:";



export type VyrocniZpravaStorageV1 = {

  version: 1;

  report: AnnualReport;

  selectedSectionId: string;
  loadIssue?: VyrocniZpravaStorageLoadIssue;

};

export type VyrocniZpravaStorageLoadIssueCode =
  | "invalid_json"
  | "incompatible_version"
  | "invalid_shape"
  | "storage_unavailable";

export type VyrocniZpravaStorageLoadIssue = {
  code: VyrocniZpravaStorageLoadIssueCode;
  backupKey?: string;
};

export type VyrocniZpravaStorageSaveIssueCode =
  | "storage_unavailable"
  | "quota_exceeded"
  | "other_dom_exception"
  | "unknown_error";

export type VyrocniZpravaStorageSaveIssue = {
  code: VyrocniZpravaStorageSaveIssueCode;
};

export type VyrocniZpravaStorageSaveResult =
  | { ok: true }
  | { ok: false; saveIssue: VyrocniZpravaStorageSaveIssue };



type LegacyAnnualReport = AnnualReport & {

  schoolProfile?: unknown;

};



function isRecord(value: unknown): value is Record<string, unknown> {

  return typeof value === "object" && value !== null;

}



function stripLegacySchoolProfile(report: LegacyAnnualReport): AnnualReport {

  const { schoolProfile: _legacy, ...rest } = report;

  return rest;

}

function createDefaultStorage(schoolProfile = loadSchoolProfileFromStorage()): VyrocniZpravaStorageV1 {
  const report = refreshAllSections(createDefaultAnnualReport(), schoolProfile);
  return { version: 1, report, selectedSectionId: report.sections[0]?.id ?? "01" };
}

function createDiagnosticBackupKey(): string {
  return `${VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX}${new Date().toISOString()}`;
}

function writeDiagnosticBackup(raw: string): string | undefined {
  if (typeof localStorage === "undefined") return undefined;
  try {
    const backupKey = createDiagnosticBackupKey();
    localStorage.setItem(backupKey, raw);
    return backupKey;
  } catch {
    return undefined;
  }
}

function classifySaveIssue(error: unknown): VyrocniZpravaStorageSaveIssue {
  if (typeof localStorage === "undefined") {
    return { code: "storage_unavailable" };
  }
  const domErrorName =
    typeof error === "object" && error !== null && "name" in error ? String((error as { name?: unknown }).name) : "";
  if (domErrorName === "QuotaExceededError") {
    return { code: "quota_exceeded" };
  }
  if (domErrorName.length > 0) {
    return { code: "other_dom_exception" };
  }
  return { code: "unknown_error" };
}




function parseStorage(raw: string): VyrocniZpravaStorageV1 | null {

  try {

    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed) || parsed.version !== 1) return null;

    if (!isRecord(parsed.report) || typeof parsed.selectedSectionId !== "string") return null;

    const legacyReport = parsed.report as LegacyAnnualReport;

    if (!Array.isArray(legacyReport.sections)) return null;



    if (legacyReport.schoolProfile) {

      migrateLegacySchoolProfileIfNeeded(legacyReport.schoolProfile);

    }



    const schoolProfile = loadSchoolProfileFromStorage();

    const report = mergeSectionDefinitions(stripLegacySchoolProfile(legacyReport), schoolProfile);

    return {

      version: 1,

      report,

      selectedSectionId: parsed.selectedSectionId,

    };

  } catch {

    return null;

  }

}



export function loadVyrocniZpravaStorage(): VyrocniZpravaStorageV1 {

  const schoolProfile = loadSchoolProfileFromStorage();



  if (typeof localStorage === "undefined") {
    return {
      ...createDefaultStorage(schoolProfile),
      loadIssue: { code: "storage_unavailable" },
    };

  }



  try {

    const raw = localStorage.getItem(VYROCNI_ZPRAVA_LS_KEY);

    if (!raw) {
      return createDefaultStorage(schoolProfile);

    }

    try {
      JSON.parse(raw);
    } catch {
      const backupKey = writeDiagnosticBackup(raw);
      return {
        ...createDefaultStorage(schoolProfile),
        loadIssue: { code: "invalid_json", backupKey },
      };
    }

    const loaded = parseStorage(raw);

    if (!loaded) {
      const parsed = JSON.parse(raw) as { version?: unknown };
      const code: VyrocniZpravaStorageLoadIssueCode =
        parsed?.version !== 1 ? "incompatible_version" : "invalid_shape";
      const backupKey = writeDiagnosticBackup(raw);
      return {
        ...createDefaultStorage(schoolProfile),
        loadIssue: { code, backupKey },
      };

    }

    return loaded;

  } catch {
    return {
      ...createDefaultStorage(schoolProfile),
      loadIssue: { code: "storage_unavailable" },
    };

  }

}



export function saveVyrocniZpravaStorage(payload: VyrocniZpravaStorageV1): VyrocniZpravaStorageSaveResult {
  if (typeof localStorage === "undefined") {
    return { ok: false, saveIssue: { code: "storage_unavailable" } };
  }

  try {

    localStorage.setItem(VYROCNI_ZPRAVA_LS_KEY, JSON.stringify(payload));
    return { ok: true };

  } catch (error) {
    return { ok: false, saveIssue: classifySaveIssue(error) };
  }

}



export function clearVyrocniZpravaStorage(): void {

  if (typeof localStorage === "undefined") return;

  try {

    localStorage.removeItem(VYROCNI_ZPRAVA_LS_KEY);

  } catch {

    /* ignore */

  }

}



export function createFreshVyrocniZpravaStorage(schoolYear?: string): VyrocniZpravaStorageV1 {

  const schoolProfile = loadSchoolProfileFromStorage();

  const report = refreshAllSections(createDefaultAnnualReport(schoolYear), schoolProfile);

  return {

    version: 1,

    report,

    selectedSectionId: report.sections[0]?.id ?? "01",

  };

}


