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
import type { AnnualReportPublicationBlock, AnnualReportSectionStatus } from "../vyrocni-zprava-types";
import type { AnnualReportXlsxImportResult } from "./vyrocni-zprava-xlsx-import-types";

export type AnnualReportImportExistingData = {
  schoolProfile: SchoolProfile;
  section01Data: VyrocniZpravaSection01Data;
  section02Data: AnnualReportSection02Data;
  section03Data: AnnualReportPersonnelData;
  section04Data: AnnualReportSection04Data;
  section05Data: AnnualReportSection05Data;
  section06Data: AnnualReportSection06Data;
  section07Data: AnnualReportSection07Data;
  section08Data: AnnualReportSection08Data;
  section09Data: AnnualReportSection09Data;
  section10Data: AnnualReportSection10Data;
  section11Data: AnnualReportSection11Data;
  section12Data: AnnualReportSection12Data;
  section13Data: AnnualReportSection13Data;
  section14Data: AnnualReportSection14Data;
  publicationBlock?: AnnualReportPublicationBlock;
  sectionStatuses?: Partial<Record<string, AnnualReportSectionStatus>>;
};

export type AnnualReportImportSectionPreview = {
  id: "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12" | "13" | "14";
  label: string;
  detected: boolean;
  summary: string;
  readiness: "CHYBI_UDAJE" | "PRIPRAVENO" | "NEURCENO";
  overwrite: boolean;
  warningsCount: number;
  impact: "PREPISE" | "DOPLNI" | "BEZE_ZMENY";
};

export type AnnualReportImportPreviewSummary = {
  overwriteTargets: string[];
  manualOverwriteWarnings: string[];
  canConfirm: boolean;
  sectionSummaries: AnnualReportImportSectionPreview[];
};

function hasProfilePatch(result: AnnualReportXlsxImportResult): boolean {
  return Boolean(result.profilePatch && Object.keys(result.profilePatch).length > 0);
}

function hasAnyText(value?: string): boolean {
  return (value ?? "").trim().length > 0;
}

function hasAnyProfileData(profile: SchoolProfile): boolean {
  return Object.values(profile).some((value) => hasAnyText(value));
}

function hasAnySection01Data(data: VyrocniZpravaSection01Data): boolean {
  return Object.values(data).some((value) => hasAnyText(value));
}

function hasAnySection02Data(data: AnnualReportSection02Data): boolean {
  return (
    data.educationFields.length > 0 ||
    hasAnyText(data.registrySource) ||
    hasAnyText(data.registryVerifiedAt) ||
    hasAnyText(data.notes)
  );
}

function hasAnySection03Data(data: AnnualReportPersonnelData): boolean {
  return (
    Object.values(data.staffCounts).some((value) => typeof value === "number") ||
    Object.values(data.ageAndGender).some((pair) => typeof pair.men === "number" || typeof pair.women === "number") ||
    Object.values(data.educationAndGender).some((pair) => typeof pair.men === "number" || typeof pair.women === "number") ||
    Object.values(data.qualification).some(
      (pair) => typeof pair.qualified === "number" || typeof pair.notQualified === "number",
    ) ||
    hasAnyText(data.notes)
  );
}

function hasAnySection04Data(data: AnnualReportSection04Data): boolean {
  return (
    data.pupilCountsSeptember.length > 0 ||
    data.pupilCountsJune.length > 0 ||
    data.pupilsAdmittedDuringYear.length > 0 ||
    data.pupilsLeftDuringYear.length > 0 ||
    data.secondarySchoolAdmissions.length > 0 ||
    hasAnyText(data.notes)
  );
}

function hasAnySection05Data(data: AnnualReportSection05Data): boolean {
  return (
    hasAnyText(data.educationProgram.name) ||
    hasAnyText(data.educationProgram.applicableClasses) ||
    hasAnyText(data.schoolCurriculumPlan.description) ||
    (data.schoolCurriculumPlan.weeklyHourPlan?.length ?? 0) > 0 ||
    data.goalsEvaluation.length > 0 ||
    hasAnyText(data.overallEvaluation) ||
    hasAnyText(data.strengths) ||
    hasAnyText(data.areasForImprovement) ||
    hasAnyText(data.measuresForNextYear) ||
    hasAnyText(data.notes)
  );
}

function hasAnySection06Data(data: AnnualReportSection06Data): boolean {
  return (
    data.firstTermClassResults.length > 0 ||
    data.secondTermClassResults.length > 0 ||
    hasAnyText(data.summaryEvaluation) ||
    hasAnyText(data.notes)
  );
}

function hasAnySection07Data(data: AnnualReportSection07Data): boolean {
  return (
    hasAnyText(data.prevention.preventionStrategyDescription) ||
    (data.prevention.preventionProgrammes?.length ?? 0) > 0 ||
    data.riskBehaviourIncidents.length > 0 ||
    hasAnyText(data.summaryEvaluation) ||
    hasAnyText(data.notes)
  );
}

function hasAnySection08Data(data: AnnualReportSection08Data): boolean {
  return (
    hasAnyText(data.dvppOverview.description) ||
    data.qualificationStudies.length > 0 ||
    data.additionalQualificationStudies.length > 0 ||
    data.professionalDevelopmentTrainings.length > 0 ||
    data.nonTeachingStaffDevelopment.length > 0 ||
    hasAnyText(data.selfStudy.description) ||
    hasAnyText(data.summaryEvaluation) ||
    hasAnyText(data.notes)
  );
}

function hasAnySection09Data(data: AnnualReportSection09Data): boolean {
  return (
    hasAnyText(data.publicPresentation.description) ||
    data.schoolEvents.length > 0 ||
    data.competitions.length > 0 ||
    data.projectsAndCooperation.length > 0 ||
    hasAnyText(data.summaryEvaluation) ||
    hasAnyText(data.notes)
  );
}

function hasAnySection10Data(data: AnnualReportSection10Data): boolean {
  return (
    data.inspections.length > 0 ||
    hasAnyText(data.noInspectionStatement) ||
    hasAnyText(data.summaryEvaluation) ||
    hasAnyText(data.notes) ||
    data.inspectionActivityStatus !== "NEUVEDENO"
  );
}

function hasAnySection11Data(data: AnnualReportSection11Data): boolean {
  return (
    data.grantsAndSubsidies.length > 0 ||
    data.investmentsAndRepairs.length > 0 ||
    hasAnyText(data.summaryCommentary) ||
    hasAnyText(data.notes) ||
    hasAnyText(data.reportingPeriod)
  );
}

function hasAnySection12Data(data: AnnualReportSection12Data): boolean {
  return (
    data.projects.length > 0 ||
    hasAnyText(data.otherPrograms) ||
    hasAnyText(data.summaryEvaluation) ||
    hasAnyText(data.notes)
  );
}

function hasAnySection13Data(data: AnnualReportSection13Data): boolean {
  return (
    hasAnyText(data.parentCooperation) ||
    hasAnyText(data.founderCooperation) ||
    hasAnyText(data.partners) ||
    hasAnyText(data.summaryEvaluation) ||
    hasAnyText(data.notes)
  );
}

function hasAnySection14Data(data: AnnualReportSection14Data): boolean {
  return hasAnyText(data.overallEvaluation) || hasAnyText(data.futurePlans) || hasAnyText(data.notes);
}

function warningCountForSheet(result: AnnualReportXlsxImportResult, sheetName: string): number {
  return result.warnings.filter((item) => item.sheet === sheetName).length;
}

function hasAnyPublicationBlockData(block: AnnualReportPublicationBlock | undefined): boolean {
  if (!block) return false;
  return Object.values(block).some((value) => hasAnyText(value));
}

function getManualOverwriteWarnings(
  overwriteTargets: string[],
  statuses: Partial<Record<string, AnnualReportSectionStatus>> | undefined,
): string[] {
  if (!statuses) return [];
  return overwriteTargets
    .filter((target) => /^\d{2}$/.test(target))
    .filter((target) => statuses[target] === "UPRAVENO_UZIVATELEM" || statuses[target] === "SCHVALENO")
    .map((target) => {
      const status = statuses[target] === "SCHVALENO" ? "schválená kapitola" : "ručně upravená kapitola";
      return `${target} (${status})`;
    });
}

export function getImportOverwriteTargets(
  result: AnnualReportXlsxImportResult,
  existingData: AnnualReportImportExistingData,
): string[] {
  const targets: string[] = [];
  if (hasProfilePatch(result) && hasAnyProfileData(existingData.schoolProfile)) targets.push("Profil školy");
  if (result.section01Data && hasAnySection01Data(existingData.section01Data)) targets.push("01");
  if (result.section02Data && hasAnySection02Data(existingData.section02Data)) targets.push("02");
  if (result.section03Data && hasAnySection03Data(existingData.section03Data)) targets.push("03");
  if (result.section04Data && hasAnySection04Data(existingData.section04Data)) targets.push("04");
  if (result.section05Data && hasAnySection05Data(existingData.section05Data)) targets.push("05");
  if (result.section06Data && hasAnySection06Data(existingData.section06Data)) targets.push("06");
  if (result.section07Data && hasAnySection07Data(existingData.section07Data)) targets.push("07");
  if (result.section08Data && hasAnySection08Data(existingData.section08Data)) targets.push("08");
  if (result.section09Data && hasAnySection09Data(existingData.section09Data)) targets.push("09");
  if (result.section10Data && hasAnySection10Data(existingData.section10Data)) targets.push("10");
  if (result.section11Data && hasAnySection11Data(existingData.section11Data)) targets.push("11");
  if (result.section12Data && hasAnySection12Data(existingData.section12Data)) targets.push("12");
  if (result.section13Data && hasAnySection13Data(existingData.section13Data)) targets.push("13");
  if (result.section14Data && hasAnySection14Data(existingData.section14Data)) targets.push("14");
  if (result.publicationBlockPatch && hasAnyPublicationBlockData(existingData.publicationBlock)) {
    targets.push("Schválení a zveřejnění");
  }
  return targets;
}

function hasAnyImportedData(result: AnnualReportXlsxImportResult): boolean {
  return Boolean(
    hasProfilePatch(result) ||
      result.section01Data ||
      result.section02Data ||
      result.section03Data ||
      result.section04Data ||
      result.section05Data ||
      result.section06Data ||
      result.section07Data ||
      result.section08Data ||
      result.section09Data ||
      result.section10Data ||
      result.section11Data ||
      result.section12Data ||
      result.section13Data ||
      result.section14Data ||
      result.publicationBlockPatch,
  );
}

export function canConfirmImport(
  result: AnnualReportXlsxImportResult,
  overwriteConfirmed: boolean,
  existingData: AnnualReportImportExistingData,
): boolean {
  if (!result.valid || result.errors.length > 0) return false;
  if (!hasAnyImportedData(result)) return false;
  const hasOverwriteTargets = getImportOverwriteTargets(result, existingData).length > 0;
  if (!hasOverwriteTargets) return true;
  return overwriteConfirmed;
}

export function buildImportPreviewSummary(
  result: AnnualReportXlsxImportResult,
  existingData: AnnualReportImportExistingData,
  overwriteConfirmed: boolean,
): AnnualReportImportPreviewSummary {
  const overwriteTargets = getImportOverwriteTargets(result, existingData);
  const manualOverwriteWarnings = getManualOverwriteWarnings(overwriteTargets, existingData.sectionStatuses);
  const sectionSummaries: AnnualReportImportSectionPreview[] = [
    {
      id: "01",
      label: "01 Základní údaje",
      detected: Boolean(result.section01Data),
      summary: result.section01Data ? `Pole: ${Object.values(result.section01Data).filter((item) => hasAnyText(item)).length}` : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["01"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("01"),
      warningsCount: warningCountForSheet(result, "01 Základní údaje"),
      impact: !result.section01Data ? "BEZE_ZMENY" : overwriteTargets.includes("01") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "02",
      label: "02 Obory vzdělání",
      detected: Boolean(result.section02Data),
      summary: result.section02Data ? `Obory: ${result.section02Data.educationFields.length}` : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["02"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("02"),
      warningsCount: warningCountForSheet(result, "02 Obory vzdělání"),
      impact: !result.section02Data ? "BEZE_ZMENY" : overwriteTargets.includes("02") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "03",
      label: "03 Personální údaje",
      detected: Boolean(result.section03Data),
      summary: result.section03Data ? "Importována personální data." : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["03"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("03"),
      warningsCount: warningCountForSheet(result, "03 Personální údaje"),
      impact: !result.section03Data ? "BEZE_ZMENY" : overwriteTargets.includes("03") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "04",
      label: "04 Zápis a žáci",
      detected: Boolean(result.section04Data),
      summary: result.section04Data
        ? `Řádky: ${
            result.section04Data.pupilCountsSeptember.length +
            result.section04Data.pupilCountsJune.length +
            result.section04Data.pupilsAdmittedDuringYear.length +
            result.section04Data.pupilsLeftDuringYear.length
          }`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["04"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("04"),
      warningsCount: warningCountForSheet(result, "04 Zápis a žáci"),
      impact: !result.section04Data ? "BEZE_ZMENY" : overwriteTargets.includes("04") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "05",
      label: "05 ŠVP",
      detected: Boolean(result.section05Data),
      summary: result.section05Data
        ? `Cíle: ${result.section05Data.goalsEvaluation.length}, plán: ${result.section05Data.schoolCurriculumPlan.weeklyHourPlan?.length ?? 0}`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["05"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("05"),
      warningsCount: warningCountForSheet(result, "05 ŠVP"),
      impact: !result.section05Data ? "BEZE_ZMENY" : overwriteTargets.includes("05") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "06",
      label: "06 Výsledky vzdělávání",
      detected: Boolean(result.section06Data),
      summary: result.section06Data
        ? `Řádky: ${result.section06Data.firstTermClassResults.length + result.section06Data.secondTermClassResults.length}`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["06"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("06"),
      warningsCount: warningCountForSheet(result, "06 Výsledky vzdělávání"),
      impact: !result.section06Data ? "BEZE_ZMENY" : overwriteTargets.includes("06") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "07",
      label: "07 Prevence a podpora",
      detected: Boolean(result.section07Data),
      summary: result.section07Data
        ? `Programy: ${result.section07Data.prevention.preventionProgrammes?.length ?? 0}, výskyty: ${result.section07Data.riskBehaviourIncidents.length}`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["07"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("07"),
      warningsCount: warningCountForSheet(result, "07 Prevence a podpora"),
      impact: !result.section07Data ? "BEZE_ZMENY" : overwriteTargets.includes("07") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "08",
      label: "08 DVPP a rozvoj pracovníků",
      detected: Boolean(result.section08Data),
      summary: result.section08Data
        ? `Aktivity: ${
            result.section08Data.qualificationStudies.length +
            result.section08Data.additionalQualificationStudies.length +
            result.section08Data.professionalDevelopmentTrainings.length +
            result.section08Data.nonTeachingStaffDevelopment.length
          }`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["08"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("08"),
      warningsCount: warningCountForSheet(result, "08 DVPP a rozvoj pracovníků"),
      impact: !result.section08Data ? "BEZE_ZMENY" : overwriteTargets.includes("08") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "09",
      label: "09 Aktivity a prezentace",
      detected: Boolean(result.section09Data),
      summary: result.section09Data
        ? `Akce: ${result.section09Data.schoolEvents.length}, soutěže: ${result.section09Data.competitions.length}, projekty: ${result.section09Data.projectsAndCooperation.length}`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["09"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("09"),
      warningsCount: warningCountForSheet(result, "09 Aktivity a prezentace"),
      impact: !result.section09Data ? "BEZE_ZMENY" : overwriteTargets.includes("09") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "10",
      label: "10 ČŠI",
      detected: Boolean(result.section10Data),
      summary: result.section10Data
        ? `Záznamy: ${result.section10Data.inspections.length}, status: ${result.section10Data.inspectionActivityStatus ?? "NEUVEDENO"}`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["10"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("10"),
      warningsCount: warningCountForSheet(result, "10 ČŠI"),
      impact: !result.section10Data ? "BEZE_ZMENY" : overwriteTargets.includes("10") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "11",
      label: "11 Hospodaření",
      detected: Boolean(result.section11Data),
      summary: result.section11Data
        ? `Dotace: ${result.section11Data.grantsAndSubsidies.length}, investice: ${result.section11Data.investmentsAndRepairs.length}`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["11"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("11"),
      warningsCount: warningCountForSheet(result, "11 Hospodaření"),
      impact: !result.section11Data ? "BEZE_ZMENY" : overwriteTargets.includes("11") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "12",
      label: "12 Projekty a granty",
      detected: Boolean(result.section12Data),
      summary: result.section12Data
        ? `Projekty: ${result.section12Data.projects.length}${hasAnyText(result.section12Data.otherPrograms) ? ", další programy" : ""}`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["12"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("12"),
      warningsCount: warningCountForSheet(result, "12 Projekty a granty"),
      impact: !result.section12Data ? "BEZE_ZMENY" : overwriteTargets.includes("12") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "13",
      label: "13 Spolupráce s rodiči",
      detected: Boolean(result.section13Data),
      summary: result.section13Data
        ? `Pole: ${[result.section13Data.parentCooperation, result.section13Data.founderCooperation, result.section13Data.partners].filter((item) => hasAnyText(item)).length}`
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["13"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("13"),
      warningsCount: warningCountForSheet(result, "13 Spolupráce s rodiči"),
      impact: !result.section13Data ? "BEZE_ZMENY" : overwriteTargets.includes("13") ? "PREPISE" : "DOPLNI",
    },
    {
      id: "14",
      label: "14 Závěr",
      detected: Boolean(result.section14Data),
      summary: result.section14Data
        ? `${hasAnyText(result.section14Data.overallEvaluation) ? "zhodnocení" : ""}${hasAnyText(result.section14Data.futurePlans) ? ", plány" : ""}`.replace(/^, /, "") || "data k importu"
        : "V této části nebyla nalezena data k importu.",
      readiness: result.sectionReadiness["14"] ?? "NEURCENO",
      overwrite: overwriteTargets.includes("14"),
      warningsCount: warningCountForSheet(result, "14 Závěr"),
      impact: !result.section14Data ? "BEZE_ZMENY" : overwriteTargets.includes("14") ? "PREPISE" : "DOPLNI",
    },
  ];

  return {
    overwriteTargets,
    manualOverwriteWarnings,
    canConfirm: canConfirmImport(result, overwriteConfirmed, existingData),
    sectionSummaries,
  };
}
