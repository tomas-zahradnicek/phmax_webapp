import type { SchoolProfile } from "../school-profile/school-profile-types";
import type {
  AnnualReportSection07Data,
  AnnualReportSection07PreventionProgramme,
  AnnualReportSection07RiskBehaviourIncident,
} from "./vyrocni-zprava-section07-types";

export const VYROCNI_ZPRAVA_SECTION07_LS_KEY = "vyrocni-zprava-section07-data-v1";

export type Section07Readiness = {
  status: "CHYBI_UDAJE" | "PRIPRAVENO";
  missingData: string[];
  recommendedData: string[];
  availableData: string[];
  warnings: string[];
};

const SUPPORT_NEEDS_NUMERIC_KEYS = [
  "pupilsWithSvpTotal",
  "pupilsWithSupportMeasures",
  "pupilsWithIndividualEducationPlan",
  "pupilsWithPedagogicalIntervention",
  "pupilsWithTeachingAssistantSupport",
  "pupilsGifted",
  "pupilsExceptionallyGifted",
] as const;

const SUPPORT_NEEDS_NUMERIC_LABELS: Record<SupportNeedsNumericKey, string> = {
  pupilsWithSvpTotal: "Počet žáků se SVP celkem",
  pupilsWithSupportMeasures: "Počet žáků s podpůrnými opatřeními",
  pupilsWithIndividualEducationPlan: "Počet žáků s IVP",
  pupilsWithPedagogicalIntervention: "Počet žáků s pedagogickou intervencí",
  pupilsWithTeachingAssistantSupport: "Počet žáků s podporou asistenta pedagoga",
  pupilsGifted: "Počet nadaných žáků",
  pupilsExceptionallyGifted: "Počet mimořádně nadaných žáků",
};

type SupportNeedsNumericKey = (typeof SUPPORT_NEEDS_NUMERIC_KEYS)[number];

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" ? pickFilledString(value) : undefined;
}

function sanitizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return value;
}

function normalizeProgramme(raw: unknown): AnnualReportSection07PreventionProgramme | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    title: sanitizeOptionalText(item.title) ?? "",
    targetGroup: sanitizeOptionalText(item.targetGroup),
    description: sanitizeOptionalText(item.description),
    dateOrPeriod: sanitizeOptionalText(item.dateOrPeriod),
    provider: sanitizeOptionalText(item.provider),
  };
}

function normalizeRiskIncident(raw: unknown): AnnualReportSection07RiskBehaviourIncident | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    type: sanitizeOptionalText(item.type) ?? "",
    count: sanitizeOptionalNumber(item.count),
    adoptedMeasures: sanitizeOptionalText(item.adoptedMeasures),
    note: sanitizeOptionalText(item.note),
  };
}

function hasAtLeastOneSupportNeedsValue(data: AnnualReportSection07Data["pupilsWithSupportNeeds"]): boolean {
  return SUPPORT_NEEDS_NUMERIC_KEYS.some((key) => data[key] !== undefined);
}

function hasAnyProgrammeRow(programmes: AnnualReportSection07PreventionProgramme[]): boolean {
  return programmes.some(
    (item) =>
      Boolean(
        pickFilledString(item.title) ||
          pickFilledString(item.targetGroup) ||
          pickFilledString(item.description) ||
          pickFilledString(item.dateOrPeriod) ||
          pickFilledString(item.provider),
      ),
  );
}

function hasAnyRiskIncident(incidents: AnnualReportSection07RiskBehaviourIncident[]): boolean {
  return incidents.some(
    (item) =>
      Boolean(
        pickFilledString(item.type) ||
          item.count !== undefined ||
          pickFilledString(item.adoptedMeasures) ||
          pickFilledString(item.note),
      ),
  );
}

export function createDefaultSection07PreventionProgramme(): AnnualReportSection07PreventionProgramme {
  return {
    title: "",
    targetGroup: "",
    description: "",
    dateOrPeriod: "",
    provider: "",
  };
}

export function createDefaultSection07RiskBehaviourIncident(): AnnualReportSection07RiskBehaviourIncident {
  return {
    type: "",
    count: undefined,
    adoptedMeasures: "",
    note: "",
  };
}

export function createDefaultSection07Data(): AnnualReportSection07Data {
  return {
    prevention: {
      preventionStrategyDescription: "",
      preventionProgrammes: [],
      preventionTeam: "",
      cooperation: "",
      evaluation: "",
    },
    riskBehaviourIncidents: [],
    pupilsWithSupportNeeds: {
      pupilsWithSvpTotal: undefined,
      pupilsWithSupportMeasures: undefined,
      pupilsWithIndividualEducationPlan: undefined,
      pupilsWithPedagogicalIntervention: undefined,
      pupilsWithTeachingAssistantSupport: undefined,
      pupilsGifted: undefined,
      pupilsExceptionallyGifted: undefined,
      note: "",
    },
    supportConditions: {
      counsellingWorkplaceDescription: "",
      cooperationWithPppSpc: "",
      supportMeasuresDescription: "",
      inclusionMeasures: "",
      giftedSupportDescription: "",
      teachingAssistantSupportDescription: "",
      materialAndOrganizationalConditions: "",
      evaluation: "",
    },
    languagePreparation: {
      pupilsWithLanguagePreparationEntitlement: undefined,
      languagePreparationProvided: "NERELEVANTNI",
      description: "",
      provider: "",
      note: "",
    },
    summaryEvaluation: "",
    notes: "",
  };
}

export function normalizeSection07Data(raw: unknown): AnnualReportSection07Data | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const defaults = createDefaultSection07Data();
  const preventionRaw = item.prevention && typeof item.prevention === "object" ? (item.prevention as Record<string, unknown>) : {};
  const supportNeedsRaw =
    item.pupilsWithSupportNeeds && typeof item.pupilsWithSupportNeeds === "object"
      ? (item.pupilsWithSupportNeeds as Record<string, unknown>)
      : {};
  const supportConditionsRaw =
    item.supportConditions && typeof item.supportConditions === "object"
      ? (item.supportConditions as Record<string, unknown>)
      : {};
  const languageRaw =
    item.languagePreparation && typeof item.languagePreparation === "object"
      ? (item.languagePreparation as Record<string, unknown>)
      : {};

  const languagePreparationProvided = languageRaw.languagePreparationProvided;

  return {
    prevention: {
      preventionStrategyDescription: sanitizeOptionalText(preventionRaw.preventionStrategyDescription) ?? "",
      preventionProgrammes: Array.isArray(preventionRaw.preventionProgrammes)
        ? preventionRaw.preventionProgrammes
            .map(normalizeProgramme)
            .filter((program): program is AnnualReportSection07PreventionProgramme => program !== null)
        : [],
      preventionTeam: sanitizeOptionalText(preventionRaw.preventionTeam) ?? "",
      cooperation: sanitizeOptionalText(preventionRaw.cooperation) ?? "",
      evaluation: sanitizeOptionalText(preventionRaw.evaluation) ?? "",
    },
    riskBehaviourIncidents: Array.isArray(item.riskBehaviourIncidents)
      ? item.riskBehaviourIncidents
          .map(normalizeRiskIncident)
          .filter((incident): incident is AnnualReportSection07RiskBehaviourIncident => incident !== null)
      : [],
    pupilsWithSupportNeeds: {
      pupilsWithSvpTotal: sanitizeOptionalNumber(supportNeedsRaw.pupilsWithSvpTotal),
      pupilsWithSupportMeasures: sanitizeOptionalNumber(supportNeedsRaw.pupilsWithSupportMeasures),
      pupilsWithIndividualEducationPlan: sanitizeOptionalNumber(supportNeedsRaw.pupilsWithIndividualEducationPlan),
      pupilsWithPedagogicalIntervention: sanitizeOptionalNumber(supportNeedsRaw.pupilsWithPedagogicalIntervention),
      pupilsWithTeachingAssistantSupport: sanitizeOptionalNumber(supportNeedsRaw.pupilsWithTeachingAssistantSupport),
      pupilsGifted: sanitizeOptionalNumber(supportNeedsRaw.pupilsGifted),
      pupilsExceptionallyGifted: sanitizeOptionalNumber(supportNeedsRaw.pupilsExceptionallyGifted),
      note: sanitizeOptionalText(supportNeedsRaw.note) ?? "",
    },
    supportConditions: {
      counsellingWorkplaceDescription: sanitizeOptionalText(supportConditionsRaw.counsellingWorkplaceDescription) ?? "",
      cooperationWithPppSpc: sanitizeOptionalText(supportConditionsRaw.cooperationWithPppSpc) ?? "",
      supportMeasuresDescription: sanitizeOptionalText(supportConditionsRaw.supportMeasuresDescription) ?? "",
      inclusionMeasures: sanitizeOptionalText(supportConditionsRaw.inclusionMeasures) ?? "",
      giftedSupportDescription: sanitizeOptionalText(supportConditionsRaw.giftedSupportDescription) ?? "",
      teachingAssistantSupportDescription: sanitizeOptionalText(supportConditionsRaw.teachingAssistantSupportDescription) ?? "",
      materialAndOrganizationalConditions:
        sanitizeOptionalText(supportConditionsRaw.materialAndOrganizationalConditions) ?? "",
      evaluation: sanitizeOptionalText(supportConditionsRaw.evaluation) ?? "",
    },
    languagePreparation: {
      pupilsWithLanguagePreparationEntitlement: sanitizeOptionalNumber(languageRaw.pupilsWithLanguagePreparationEntitlement),
      languagePreparationProvided:
        languagePreparationProvided === "ANO" ||
        languagePreparationProvided === "NE" ||
        languagePreparationProvided === "NERELEVANTNI"
          ? languagePreparationProvided
          : defaults.languagePreparation.languagePreparationProvided,
      description: sanitizeOptionalText(languageRaw.description) ?? "",
      provider: sanitizeOptionalText(languageRaw.provider) ?? "",
      note: sanitizeOptionalText(languageRaw.note) ?? "",
    },
    summaryEvaluation: sanitizeOptionalText(item.summaryEvaluation) ?? "",
    notes: sanitizeOptionalText(item.notes) ?? "",
  };
}

export function getSection07Readiness(params: {
  section07Data: AnnualReportSection07Data;
  schoolProfile: SchoolProfile;
}): Section07Readiness {
  const d = params.section07Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = pickFilledString(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  const preventionStrategy = pickFilledString(d.prevention.preventionStrategyDescription);
  if (!preventionStrategy) {
    missingData.push("Popis preventivní strategie školy");
  } else {
    availableData.push("Popis preventivní strategie školy");
  }

  const programmes = d.prevention.preventionProgrammes ?? [];
  const hasProgrammes = hasAnyProgrammeRow(programmes);
  const preventionEvaluation = pickFilledString(d.prevention.evaluation);
  const hasRiskIncidents = hasAnyRiskIncident(d.riskBehaviourIncidents);

  if (!hasProgrammes && !preventionEvaluation && !hasRiskIncidents) {
    missingData.push("Alespoň jeden podklad prevence (preventivní aktivita / vyhodnocení prevence / výskyty rizikového chování)");
  } else {
    if (hasProgrammes) availableData.push(`Preventivní aktivity: ${programmes.length}`);
    if (preventionEvaluation) availableData.push("Vyhodnocení prevence");
    if (hasRiskIncidents) availableData.push(`Výskyty rizikového chování: ${d.riskBehaviourIncidents.length}`);
  }

  if (!hasAtLeastOneSupportNeedsValue(d.pupilsWithSupportNeeds)) {
    missingData.push("Alespoň jeden číselný údaj o žácích se speciálními vzdělávacími potřebami nebo nadaných");
  } else {
    availableData.push("Číselné údaje o žácích se SVP / nadaných");
  }

  const supportMeasuresDescription = pickFilledString(d.supportConditions.supportMeasuresDescription);
  if (!supportMeasuresDescription) {
    missingData.push("Popis podpůrných opatření");
  } else {
    availableData.push("Popis podpůrných opatření");
  }

  const summaryEvaluation = pickFilledString(d.summaryEvaluation);
  if (!summaryEvaluation) {
    missingData.push("Souhrnné vyhodnocení kapitoly");
  } else {
    availableData.push("Souhrnné vyhodnocení kapitoly");
    if (summaryEvaluation.length < 80) {
      warnings.push("Souhrnné vyhodnocení je velmi stručné. Zvažte doplnění konkrétních zjištění.");
    }
  }

  if (!pickFilledString(d.prevention.preventionTeam)) {
    recommendedData.push("Preventivní tým / odpovědné osoby");
  } else {
    availableData.push("Preventivní tým / odpovědné osoby");
  }
  if (!pickFilledString(d.prevention.cooperation)) {
    recommendedData.push("Spolupráce s institucemi");
  } else {
    availableData.push("Spolupráce s institucemi");
  }

  if (!pickFilledString(d.supportConditions.counsellingWorkplaceDescription)) {
    recommendedData.push("Popis práce školního poradenského pracoviště");
  } else {
    availableData.push("Popis práce školního poradenského pracoviště");
  }
  if (!pickFilledString(d.supportConditions.cooperationWithPppSpc)) {
    recommendedData.push("Spolupráce s PPP/SPC");
  } else {
    availableData.push("Spolupráce s PPP/SPC");
  }
  if (!pickFilledString(d.supportConditions.giftedSupportDescription)) {
    recommendedData.push("Podpora nadaných a mimořádně nadaných žáků");
  } else {
    availableData.push("Podpora nadaných a mimořádně nadaných žáků");
  }
  if (!pickFilledString(d.supportConditions.teachingAssistantSupportDescription)) {
    recommendedData.push("Podpora asistenty pedagoga");
  } else {
    availableData.push("Podpora asistenty pedagoga");
  }

  if (
    d.languagePreparation.pupilsWithLanguagePreparationEntitlement === undefined &&
    !pickFilledString(d.languagePreparation.description) &&
    !pickFilledString(d.languagePreparation.provider)
  ) {
    recommendedData.push("Údaje o jazykové přípravě");
  } else {
    availableData.push("Údaje o jazykové přípravě");
  }

  if (!pickFilledString(d.notes)) {
    recommendedData.push("Doplňující poznámky");
  } else {
    availableData.push("Doplňující poznámky");
  }

  programmes.forEach((programme, index) => {
    if (!pickFilledString(programme.title)) {
      warnings.push(`Preventivní aktivita ${index + 1}: chybí název programu/aktivity.`);
    }
  });

  d.riskBehaviourIncidents.forEach((incident, index) => {
    if (incident.count !== undefined && !pickFilledString(incident.adoptedMeasures)) {
      warnings.push(`Výskyt ${index + 1}: je uveden počet případů, ale chybí přijatá opatření.`);
    }
  });

  const checkNonNegative = (label: string, value: number | undefined) => {
    if (value !== undefined && value < 0) warnings.push(`${label}: záporné hodnoty nejsou přípustné.`);
  };

  d.riskBehaviourIncidents.forEach((incident, index) =>
    checkNonNegative(`Výskyt rizikového chování ${index + 1} (počet případů)`, incident.count),
  );
  SUPPORT_NEEDS_NUMERIC_KEYS.forEach((key) => checkNonNegative(SUPPORT_NEEDS_NUMERIC_LABELS[key], d.pupilsWithSupportNeeds[key]));
  checkNonNegative(
    "Žáci s nárokem na jazykovou přípravu",
    d.languagePreparation.pupilsWithLanguagePreparationEntitlement,
  );

  const supportTotal = d.pupilsWithSupportNeeds.pupilsWithSvpTotal;
  const gifted = d.pupilsWithSupportNeeds.pupilsGifted;
  const exceptionallyGifted = d.pupilsWithSupportNeeds.pupilsExceptionallyGifted;
  if (supportTotal !== undefined && gifted !== undefined && gifted > supportTotal) {
    warnings.push("Počet nadaných žáků je vyšší než počet žáků se SVP celkem. Ověřte prosím zadané hodnoty.");
  }
  if (
    supportTotal !== undefined &&
    exceptionallyGifted !== undefined &&
    exceptionallyGifted > supportTotal
  ) {
    warnings.push("Počet mimořádně nadaných žáků je vyšší než počet žáků se SVP celkem. Ověřte prosím zadané hodnoty.");
  }

  if (
    d.languagePreparation.languagePreparationProvided === "ANO" &&
    !pickFilledString(d.languagePreparation.description)
  ) {
    warnings.push("Je uvedeno, že jazyková příprava byla poskytována, ale chybí její popis.");
  }
  if (
    d.languagePreparation.languagePreparationProvided === "NE" &&
    (d.languagePreparation.pupilsWithLanguagePreparationEntitlement ?? 0) > 0
  ) {
    warnings.push("Jazyková příprava je označena jako neposkytovaná, ale je uveden počet žáků s nárokem.");
  }

  if (!d.riskBehaviourIncidents.every((item) => pickFilledString(item.adoptedMeasures) || item.count === undefined)) {
    recommendedData.push("Doplnit přijatá opatření k evidovaným výskytům rizikového chování");
  }

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
    warnings,
  };
}
