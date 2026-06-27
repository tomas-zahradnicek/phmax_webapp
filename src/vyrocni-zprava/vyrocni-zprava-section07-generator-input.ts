import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection07Readiness, type Section07Readiness } from "./vyrocni-zprava-section07-data-logic";
import type {
  AnnualReportSection07Data,
  AnnualReportSection07PreventionProgramme,
  AnnualReportSection07RiskBehaviourIncident,
} from "./vyrocni-zprava-section07-types";

export type Section07GeneratorInput = {
  schoolYear: string;
  school: {
    name?: string;
    schoolType?: string;
  };
  prevention: AnnualReportSection07Data["prevention"] & {
    preventionProgrammes: AnnualReportSection07PreventionProgramme[];
  };
  riskBehaviourIncidents: AnnualReportSection07RiskBehaviourIncident[];
  pupilsWithSupportNeeds: AnnualReportSection07Data["pupilsWithSupportNeeds"];
  supportConditions: AnnualReportSection07Data["supportConditions"];
  languagePreparation: AnnualReportSection07Data["languagePreparation"];
  summaryEvaluation?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section07Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeProgrammes(programmes: AnnualReportSection07PreventionProgramme[] | undefined): AnnualReportSection07PreventionProgramme[] {
  return (programmes ?? []).map((item) => ({
    title: pickFilledString(item.title) ?? "",
    targetGroup: pickFilledString(item.targetGroup),
    description: pickFilledString(item.description),
    dateOrPeriod: pickFilledString(item.dateOrPeriod),
    provider: pickFilledString(item.provider),
  }));
}

function sanitizeRiskIncidents(incidents: AnnualReportSection07RiskBehaviourIncident[]): AnnualReportSection07RiskBehaviourIncident[] {
  return incidents.map((item) => ({
    type: pickFilledString(item.type) ?? "",
    count: item.count,
    adoptedMeasures: pickFilledString(item.adoptedMeasures),
    note: pickFilledString(item.note),
  }));
}

/** Sestaví validovaný vstup pro generování kapitoly 07 – bez doplňování chybějících faktů. */
export function buildSection07GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section07Data: AnnualReportSection07Data;
}): Section07GeneratorInput {
  const readiness = getSection07Readiness({
    section07Data: params.section07Data,
    schoolProfile: params.schoolProfile,
  });
  return {
    schoolYear: params.schoolYear.trim(),
    school: {
      name: pickFilledString(params.schoolProfile.name),
      schoolType: pickFilledString(params.schoolProfile.schoolType),
    },
    prevention: {
      preventionStrategyDescription: pickFilledString(params.section07Data.prevention.preventionStrategyDescription),
      preventionProgrammes: sanitizeProgrammes(params.section07Data.prevention.preventionProgrammes),
      preventionTeam: pickFilledString(params.section07Data.prevention.preventionTeam),
      cooperation: pickFilledString(params.section07Data.prevention.cooperation),
      evaluation: pickFilledString(params.section07Data.prevention.evaluation),
    },
    riskBehaviourIncidents: sanitizeRiskIncidents(params.section07Data.riskBehaviourIncidents),
    pupilsWithSupportNeeds: {
      ...params.section07Data.pupilsWithSupportNeeds,
      note: pickFilledString(params.section07Data.pupilsWithSupportNeeds.note),
    },
    supportConditions: {
      ...params.section07Data.supportConditions,
      counsellingWorkplaceDescription: pickFilledString(params.section07Data.supportConditions.counsellingWorkplaceDescription),
      cooperationWithPppSpc: pickFilledString(params.section07Data.supportConditions.cooperationWithPppSpc),
      supportMeasuresDescription: pickFilledString(params.section07Data.supportConditions.supportMeasuresDescription),
      inclusionMeasures: pickFilledString(params.section07Data.supportConditions.inclusionMeasures),
      giftedSupportDescription: pickFilledString(params.section07Data.supportConditions.giftedSupportDescription),
      teachingAssistantSupportDescription: pickFilledString(params.section07Data.supportConditions.teachingAssistantSupportDescription),
      materialAndOrganizationalConditions: pickFilledString(params.section07Data.supportConditions.materialAndOrganizationalConditions),
      evaluation: pickFilledString(params.section07Data.supportConditions.evaluation),
    },
    languagePreparation: {
      ...params.section07Data.languagePreparation,
      description: pickFilledString(params.section07Data.languagePreparation.description),
      provider: pickFilledString(params.section07Data.languagePreparation.provider),
      note: pickFilledString(params.section07Data.languagePreparation.note),
    },
    summaryEvaluation: pickFilledString(params.section07Data.summaryEvaluation),
    notes: pickFilledString(params.section07Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection07Readiness };
