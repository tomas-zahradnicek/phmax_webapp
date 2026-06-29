export type AnnualReportSection07PreventionProgramme = {
  title: string;
  targetGroup?: string;
  description?: string;
  dateOrPeriod?: string;
  provider?: string;
};

export type AnnualReportSection07RiskBehaviourIncident = {
  type: string;
  count?: number;
  adoptedMeasures?: string;
  note?: string;
};

export type AnnualReportSection07Data = {
  prevention: {
    preventionStrategyDescription?: string;
    preventionProgrammes?: AnnualReportSection07PreventionProgramme[];
    preventionTeam?: string;
    cooperation?: string;
    evaluation?: string;
  };
  riskBehaviourIncidents: AnnualReportSection07RiskBehaviourIncident[];
  pupilsWithSupportNeeds: {
    pupilsWithSvpTotal?: number;
    pupilsWithSupportMeasures?: number;
    pupilsWithIndividualEducationPlan?: number;
    pupilsWithPedagogicalIntervention?: number;
    pupilsWithTeachingAssistantSupport?: number;
    pupilsGifted?: number;
    pupilsExceptionallyGifted?: number;
    note?: string;
  };
  supportConditions: {
    counsellingWorkplaceDescription?: string;
    cooperationWithPppSpc?: string;
    supportMeasuresDescription?: string;
    inclusionMeasures?: string;
    giftedSupportDescription?: string;
    teachingAssistantSupportDescription?: string;
    materialAndOrganizationalConditions?: string;
    evaluation?: string;
  };
  languagePreparation: {
    pupilsWithLanguagePreparationEntitlement?: number;
    languagePreparationProvided?: "ANO" | "NE" | "NERELEVANTNI" | "NEUVEDENO";
    description?: string;
    provider?: string;
    note?: string;
  };
  summaryEvaluation?: string;
  notes?: string;
};

export type Section07StorageEnvelope = {
  version: 1;
  data: AnnualReportSection07Data;
  savedAt: string | null;
};
