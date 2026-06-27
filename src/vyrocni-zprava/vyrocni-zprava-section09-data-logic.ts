import type { SchoolProfile } from "../school-profile/school-profile-types";
import type {
  AnnualReportSection09Competition,
  AnnualReportSection09Data,
  AnnualReportSection09ProjectOrCooperation,
  AnnualReportSection09SchoolEvent,
  Section09PublicEventFlag,
} from "./vyrocni-zprava-section09-types";

export const VYROCNI_ZPRAVA_SECTION09_LS_KEY = "vyrocni-zprava-section09-data-v1";

export type Section09Readiness = {
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

function sanitizePublicEvent(value: unknown): Section09PublicEventFlag | undefined {
  return value === "ANO" || value === "NE" || value === "CASTECNE" ? value : undefined;
}

function normalizeEventRow(raw: unknown): AnnualReportSection09SchoolEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    dateOrPeriod: sanitizeOptionalText(item.dateOrPeriod),
    title: sanitizeOptionalText(item.title) ?? "",
    eventType: sanitizeOptionalText(item.eventType),
    targetGroup: sanitizeOptionalText(item.targetGroup),
    description: sanitizeOptionalText(item.description),
    location: sanitizeOptionalText(item.location),
    partner: sanitizeOptionalText(item.partner),
    publicEvent: sanitizePublicEvent(item.publicEvent),
    note: sanitizeOptionalText(item.note),
  };
}

function normalizeCompetitionRow(raw: unknown): AnnualReportSection09Competition | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    dateOrPeriod: sanitizeOptionalText(item.dateOrPeriod),
    title: sanitizeOptionalText(item.title) ?? "",
    subjectOrArea: sanitizeOptionalText(item.subjectOrArea),
    participants: sanitizeOptionalText(item.participants),
    result: sanitizeOptionalText(item.result),
    level: sanitizeOptionalText(item.level),
    note: sanitizeOptionalText(item.note),
  };
}

function normalizeProjectRow(raw: unknown): AnnualReportSection09ProjectOrCooperation | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    title: sanitizeOptionalText(item.title) ?? "",
    type: sanitizeOptionalText(item.type),
    partner: sanitizeOptionalText(item.partner),
    period: sanitizeOptionalText(item.period),
    description: sanitizeOptionalText(item.description),
    output: sanitizeOptionalText(item.output),
    note: sanitizeOptionalText(item.note),
  };
}

function eventHasAnyValue(row: AnnualReportSection09SchoolEvent): boolean {
  return Boolean(
    pickFilledString(row.dateOrPeriod) ||
      pickFilledString(row.title) ||
      pickFilledString(row.eventType) ||
      pickFilledString(row.targetGroup) ||
      pickFilledString(row.description) ||
      pickFilledString(row.location) ||
      pickFilledString(row.partner) ||
      row.publicEvent ||
      pickFilledString(row.note),
  );
}

function competitionHasAnyValue(row: AnnualReportSection09Competition): boolean {
  return Boolean(
    pickFilledString(row.dateOrPeriod) ||
      pickFilledString(row.title) ||
      pickFilledString(row.subjectOrArea) ||
      pickFilledString(row.participants) ||
      pickFilledString(row.result) ||
      pickFilledString(row.level) ||
      pickFilledString(row.note),
  );
}

function projectHasAnyValue(row: AnnualReportSection09ProjectOrCooperation): boolean {
  return Boolean(
    pickFilledString(row.title) ||
      pickFilledString(row.type) ||
      pickFilledString(row.partner) ||
      pickFilledString(row.period) ||
      pickFilledString(row.description) ||
      pickFilledString(row.output) ||
      pickFilledString(row.note),
  );
}

function hasAnyPublicPresentationData(data: AnnualReportSection09Data["publicPresentation"]): boolean {
  return Boolean(
    pickFilledString(data.description) ||
      pickFilledString(data.website) ||
      pickFilledString(data.socialMedia) ||
      pickFilledString(data.mediaOutputs) ||
      pickFilledString(data.cooperationWithCommunity) ||
      pickFilledString(data.note),
  );
}

function hasAnyValidActivity(data: AnnualReportSection09Data): boolean {
  return (
    data.schoolEvents.some((item) => eventHasAnyValue(item) && Boolean(pickFilledString(item.title))) ||
    data.competitions.some((item) => competitionHasAnyValue(item) && Boolean(pickFilledString(item.title))) ||
    data.projectsAndCooperation.some((item) => projectHasAnyValue(item) && Boolean(pickFilledString(item.title)))
  );
}

export function createDefaultSection09SchoolEvent(): AnnualReportSection09SchoolEvent {
  return {
    dateOrPeriod: "",
    title: "",
    eventType: "",
    targetGroup: "",
    description: "",
    location: "",
    partner: "",
    publicEvent: undefined,
    note: "",
  };
}

export function createDefaultSection09Competition(): AnnualReportSection09Competition {
  return {
    dateOrPeriod: "",
    title: "",
    subjectOrArea: "",
    participants: "",
    result: "",
    level: "",
    note: "",
  };
}

export function createDefaultSection09ProjectOrCooperation(): AnnualReportSection09ProjectOrCooperation {
  return {
    title: "",
    type: "",
    partner: "",
    period: "",
    description: "",
    output: "",
    note: "",
  };
}

export function createDefaultSection09Data(): AnnualReportSection09Data {
  return {
    publicPresentation: {
      description: "",
      website: "",
      socialMedia: "",
      mediaOutputs: "",
      cooperationWithCommunity: "",
      note: "",
    },
    schoolEvents: [],
    competitions: [],
    projectsAndCooperation: [],
    extraordinaryAchievements: "",
    summaryEvaluation: "",
    notes: "",
  };
}

export function normalizeSection09Data(raw: unknown): AnnualReportSection09Data | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const publicPresentation =
    item.publicPresentation && typeof item.publicPresentation === "object"
      ? (item.publicPresentation as Record<string, unknown>)
      : {};

  return {
    publicPresentation: {
      description: sanitizeOptionalText(publicPresentation.description) ?? "",
      website: sanitizeOptionalText(publicPresentation.website) ?? "",
      socialMedia: sanitizeOptionalText(publicPresentation.socialMedia) ?? "",
      mediaOutputs: sanitizeOptionalText(publicPresentation.mediaOutputs) ?? "",
      cooperationWithCommunity: sanitizeOptionalText(publicPresentation.cooperationWithCommunity) ?? "",
      note: sanitizeOptionalText(publicPresentation.note) ?? "",
    },
    schoolEvents: Array.isArray(item.schoolEvents)
      ? item.schoolEvents.map(normalizeEventRow).filter((row): row is AnnualReportSection09SchoolEvent => row !== null)
      : [],
    competitions: Array.isArray(item.competitions)
      ? item.competitions
          .map(normalizeCompetitionRow)
          .filter((row): row is AnnualReportSection09Competition => row !== null)
      : [],
    projectsAndCooperation: Array.isArray(item.projectsAndCooperation)
      ? item.projectsAndCooperation
          .map(normalizeProjectRow)
          .filter((row): row is AnnualReportSection09ProjectOrCooperation => row !== null)
      : [],
    extraordinaryAchievements: sanitizeOptionalText(item.extraordinaryAchievements) ?? "",
    summaryEvaluation: sanitizeOptionalText(item.summaryEvaluation) ?? "",
    notes: sanitizeOptionalText(item.notes) ?? "",
  };
}

/** Vyhodnotí připravenost kapitoly 09 pouze z ručně zadaných údajů bez inferencí z jiných modulů. */
export function getSection09Readiness(params: {
  section09Data: AnnualReportSection09Data;
  schoolProfile: SchoolProfile;
}): Section09Readiness {
  const d = params.section09Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = pickFilledString(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  const hasPublicPresentationDescription = Boolean(pickFilledString(d.publicPresentation.description));
  const hasValidActivity = hasAnyValidActivity(d);
  const hasExtraordinaryAchievements = Boolean(pickFilledString(d.extraordinaryAchievements));
  if (!hasPublicPresentationDescription && !hasValidActivity && !hasExtraordinaryAchievements) {
    missingData.push(
      "Alespoň jeden podklad (popis prezentace školy / validní aktivita v tabulkách / mimořádné výsledky a úspěchy žáků)",
    );
  } else {
    if (hasPublicPresentationDescription) availableData.push("Popis prezentace školy");
    if (hasValidActivity) availableData.push("Evidované aktivity školy");
    if (hasExtraordinaryAchievements) availableData.push("Mimořádné výsledky a úspěchy žáků");
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

  if (!pickFilledString(d.publicPresentation.website)) {
    recommendedData.push("Web školy");
  } else {
    availableData.push("Web školy");
  }
  if (!pickFilledString(d.publicPresentation.mediaOutputs)) {
    recommendedData.push("Mediální výstupy");
  } else {
    availableData.push("Mediální výstupy");
  }
  if (!pickFilledString(d.publicPresentation.cooperationWithCommunity)) {
    recommendedData.push("Spolupráce s obcí, zřizovatelem a veřejností");
  } else {
    availableData.push("Spolupráce s obcí, zřizovatelem a veřejností");
  }

  d.schoolEvents.forEach((row, index) => {
    if (!eventHasAnyValue(row)) return;
    if (!pickFilledString(row.title)) warnings.push(`Akce školy ${index + 1}: chybí název akce.`);
    if (!pickFilledString(row.dateOrPeriod)) recommendedData.push(`Datum / období (akce školy ${index + 1})`);
    if (!pickFilledString(row.targetGroup)) recommendedData.push(`Určeno pro (akce školy ${index + 1})`);
    if (row.publicEvent === "ANO" && !pickFilledString(row.description)) {
      warnings.push(`Akce školy ${index + 1}: akce je označena jako veřejná, ale chybí popis.`);
    }
  });

  d.competitions.forEach((row, index) => {
    if (!competitionHasAnyValue(row)) return;
    if (!pickFilledString(row.title)) warnings.push(`Soutěž ${index + 1}: chybí název soutěže.`);
    if (pickFilledString(row.title) && !pickFilledString(row.result)) {
      warnings.push(`Soutěž ${index + 1}: chybí výsledek / umístění.`);
    }
    if (!pickFilledString(row.dateOrPeriod)) recommendedData.push(`Datum / období (soutěž ${index + 1})`);
    if (!pickFilledString(row.result)) recommendedData.push(`Výsledek / umístění (soutěž ${index + 1})`);
  });

  d.projectsAndCooperation.forEach((row, index) => {
    if (!projectHasAnyValue(row)) return;
    if (!pickFilledString(row.title)) warnings.push(`Projekt / spolupráce ${index + 1}: chybí název.`);
    if (!pickFilledString(row.period)) recommendedData.push(`Období (projekt / spolupráce ${index + 1})`);
    if (!pickFilledString(row.partner)) recommendedData.push(`Partner (projekt / spolupráce ${index + 1})`);
  });

  if (!hasAnyPublicPresentationData(d.publicPresentation)) {
    warnings.push("Nejsou vyplněny žádné údaje o prezentaci školy na veřejnosti.");
  }

  const allListsEmpty =
    d.schoolEvents.every((row) => !eventHasAnyValue(row)) &&
    d.competitions.every((row) => !competitionHasAnyValue(row)) &&
    d.projectsAndCooperation.every((row) => !projectHasAnyValue(row));
  if (allListsEmpty && summaryEvaluation && !hasPublicPresentationDescription && !hasExtraordinaryAchievements) {
    warnings.push("Tabulky aktivit jsou prázdné a je vyplněno pouze souhrnné vyhodnocení.");
  }

  if (!pickFilledString(d.notes)) {
    recommendedData.push("Poznámky");
  } else {
    availableData.push("Poznámky");
  }

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
    warnings,
  };
}
