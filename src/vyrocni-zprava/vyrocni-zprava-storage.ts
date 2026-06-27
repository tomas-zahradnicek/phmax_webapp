import {

  createDefaultAnnualReport,

  mergeSectionDefinitions,

  refreshAllSections,

} from "./vyrocni-zprava-logic";

import type { AnnualReport } from "./vyrocni-zprava-types";

import { loadSchoolProfileFromStorage, migrateLegacySchoolProfileIfNeeded } from "../school-profile/school-profile-storage";



export const VYROCNI_ZPRAVA_LS_KEY = "vyrocni-zprava-state-v1";



export type VyrocniZpravaStorageV1 = {

  version: 1;

  report: AnnualReport;

  selectedSectionId: string;

};



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

    const report = refreshAllSections(createDefaultAnnualReport(), schoolProfile);

    return { version: 1, report, selectedSectionId: report.sections[0]?.id ?? "01" };

  }



  try {

    const raw = localStorage.getItem(VYROCNI_ZPRAVA_LS_KEY);

    if (!raw) {

      const report = refreshAllSections(createDefaultAnnualReport(), schoolProfile);

      return { version: 1, report, selectedSectionId: report.sections[0]?.id ?? "01" };

    }

    const loaded = parseStorage(raw);

    if (!loaded) {

      const report = refreshAllSections(createDefaultAnnualReport(), schoolProfile);

      return { version: 1, report, selectedSectionId: report.sections[0]?.id ?? "01" };

    }

    return loaded;

  } catch {

    const report = refreshAllSections(createDefaultAnnualReport(), schoolProfile);

    return { version: 1, report, selectedSectionId: report.sections[0]?.id ?? "01" };

  }

}



export function saveVyrocniZpravaStorage(payload: VyrocniZpravaStorageV1): void {

  if (typeof localStorage === "undefined") return;

  try {

    localStorage.setItem(VYROCNI_ZPRAVA_LS_KEY, JSON.stringify(payload));

  } catch {

    /* ignore quota / privacy mode */

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


