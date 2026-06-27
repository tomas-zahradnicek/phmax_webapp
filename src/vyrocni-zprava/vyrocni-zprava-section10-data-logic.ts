import type { SchoolProfile } from "../school-profile/school-profile-types";
import type {
  AnnualReportSection10Data,
  AnnualReportSection10InspectionRecord,
  Section10InspectionActivityStatus,
} from "./vyrocni-zprava-section10-types";

export const VYROCNI_ZPRAVA_SECTION10_LS_KEY = "vyrocni-zprava-section10-data-v1";

export type Section10Readiness = {
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

function sanitizeStatus(value: unknown): Section10InspectionActivityStatus | undefined {
  return value === "PROBEHLA" || value === "NEPROBEHLA" || value === "NEUVEDENO" ? value : undefined;
}

function normalizeInspectionRecord(raw: unknown): AnnualReportSection10InspectionRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    dateOrPeriod: sanitizeOptionalText(item.dateOrPeriod),
    inspectionType: sanitizeOptionalText(item.inspectionType),
    subject: sanitizeOptionalText(item.subject),
    reportReference: sanitizeOptionalText(item.reportReference),
    reportUrl: sanitizeOptionalText(item.reportUrl),
    mainFindings: sanitizeOptionalText(item.mainFindings),
    conclusions: sanitizeOptionalText(item.conclusions),
    adoptedMeasures: sanitizeOptionalText(item.adoptedMeasures),
    note: sanitizeOptionalText(item.note),
  };
}

function inspectionRowHasAnyValue(row: AnnualReportSection10InspectionRecord): boolean {
  return Boolean(
    pickFilledString(row.dateOrPeriod) ||
      pickFilledString(row.inspectionType) ||
      pickFilledString(row.subject) ||
      pickFilledString(row.reportReference) ||
      pickFilledString(row.reportUrl) ||
      pickFilledString(row.mainFindings) ||
      pickFilledString(row.conclusions) ||
      pickFilledString(row.adoptedMeasures) ||
      pickFilledString(row.note),
  );
}

function isLikelyUrl(value: string | undefined): boolean {
  const url = pickFilledString(value);
  if (!url) return true;
  return /^(https?:\/\/|www\.)/i.test(url);
}

function mentionsDeficiencies(text: string | undefined): boolean {
  const value = pickFilledString(text);
  if (!value) return false;
  return /(nedostat|pochyben|slabin|rizik|nevyhov|zlepš|opatřen)/i.test(value);
}

export function createDefaultSection10InspectionRecord(): AnnualReportSection10InspectionRecord {
  return {
    dateOrPeriod: "",
    inspectionType: "",
    subject: "",
    reportReference: "",
    reportUrl: "",
    mainFindings: "",
    conclusions: "",
    adoptedMeasures: "",
    note: "",
  };
}

export function createDefaultSection10Data(): AnnualReportSection10Data {
  return {
    inspectionActivityStatus: "NEUVEDENO",
    inspections: [],
    noInspectionStatement: "",
    summaryEvaluation: "",
    notes: "",
  };
}

export function normalizeSection10Data(raw: unknown): AnnualReportSection10Data | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    inspectionActivityStatus: sanitizeStatus(item.inspectionActivityStatus) ?? "NEUVEDENO",
    inspections: Array.isArray(item.inspections)
      ? item.inspections
          .map(normalizeInspectionRecord)
          .filter((row): row is AnnualReportSection10InspectionRecord => row !== null)
      : [],
    noInspectionStatement: sanitizeOptionalText(item.noInspectionStatement) ?? "",
    summaryEvaluation: sanitizeOptionalText(item.summaryEvaluation) ?? "",
    notes: sanitizeOptionalText(item.notes) ?? "",
  };
}

/** Vyhodnotí připravenost kapitoly 10 pouze z ručně zadaných údajů bez inferencí z jiných modulů. */
export function getSection10Readiness(params: {
  section10Data: AnnualReportSection10Data;
  schoolProfile: SchoolProfile;
}): Section10Readiness {
  const d = params.section10Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = pickFilledString(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  const status = d.inspectionActivityStatus;
  if (!status || status === "NEUVEDENO") {
    missingData.push("Informace, zda ve školním roce proběhla inspekční činnost ČŠI");
  } else {
    availableData.push("Informace o inspekční činnosti ČŠI");
  }

  const summaryEvaluation = pickFilledString(d.summaryEvaluation);
  const noInspectionStatement = pickFilledString(d.noInspectionStatement);
  const filledRows = d.inspections.filter(inspectionRowHasAnyValue);
  const validRows = filledRows.filter((row) => Boolean(pickFilledString(row.dateOrPeriod) || pickFilledString(row.subject)));

  if (status === "PROBEHLA") {
    if (validRows.length === 0) {
      missingData.push("Alespoň jeden validní záznam o inspekční činnosti (datum/období nebo předmět)");
    } else {
      availableData.push(`Záznamy o inspekční činnosti: ${validRows.length}`);
    }

    if (!summaryEvaluation) {
      missingData.push("Souhrnné vyhodnocení kapitoly");
    } else {
      availableData.push("Souhrnné vyhodnocení kapitoly");
    }
  }

  if (status === "NEPROBEHLA") {
    if (!summaryEvaluation && !noInspectionStatement) {
      missingData.push("Text pro případ neproběhlé inspekční činnosti nebo souhrnné vyhodnocení");
    } else {
      if (noInspectionStatement) availableData.push("Text k neproběhlé inspekční činnosti");
      if (summaryEvaluation) availableData.push("Souhrnné vyhodnocení kapitoly");
    }
  }

  if (summaryEvaluation && summaryEvaluation.length < 80) {
    warnings.push("Souhrnné vyhodnocení je velmi stručné. Zvažte doplnění konkrétních zjištění.");
  }

  if (status === "PROBEHLA") {
    validRows.forEach((row, index) => {
      const rowNo = index + 1;
      if (!pickFilledString(row.inspectionType)) {
        recommendedData.push(`Typ inspekční činnosti (záznam ${rowNo})`);
      }
      if (!pickFilledString(row.reportReference)) {
        recommendedData.push(`Číslo jednací / označení zprávy (záznam ${rowNo})`);
      }
      if (!pickFilledString(row.reportUrl)) {
        recommendedData.push(`Odkaz na zprávu (záznam ${rowNo})`);
      }
      if (!pickFilledString(row.mainFindings)) {
        recommendedData.push(`Hlavní zjištění (záznam ${rowNo})`);
      }
      if (!pickFilledString(row.conclusions)) {
        recommendedData.push(`Závěry (záznam ${rowNo})`);
      }
      if (!pickFilledString(row.adoptedMeasures)) {
        recommendedData.push(`Přijatá opatření (záznam ${rowNo})`);
      }
    });

    if (validRows.some((row) => !pickFilledString(row.reportReference) && !pickFilledString(row.reportUrl))) {
      warnings.push("U alespoň jednoho záznamu proběhlé inspekce chybí číslo jednací i odkaz na zprávu.");
    }
    if (validRows.some((row) => !pickFilledString(row.mainFindings))) {
      warnings.push("U proběhlé inspekční činnosti chybí hlavní zjištění.");
    }
    if (validRows.some((row) => !pickFilledString(row.conclusions))) {
      warnings.push("U proběhlé inspekční činnosti chybí závěry.");
    }
  }

  filledRows.forEach((row, index) => {
    if (!pickFilledString(row.dateOrPeriod) && !pickFilledString(row.subject)) {
      warnings.push(`Záznam inspekční činnosti ${index + 1}: chybí datum/období i předmět.`);
    }
    if (!isLikelyUrl(row.reportUrl)) {
      warnings.push(`Záznam inspekční činnosti ${index + 1}: odkaz na zprávu nemá očekávaný formát URL.`);
    }
    if ((mentionsDeficiencies(row.mainFindings) || mentionsDeficiencies(row.conclusions)) && !pickFilledString(row.adoptedMeasures)) {
      warnings.push(`Záznam inspekční činnosti ${index + 1}: jsou uvedeny nedostatky, ale chybí přijatá opatření.`);
    }
  });

  if (status === "NEPROBEHLA" && filledRows.length > 0) {
    warnings.push("Jsou vyplněny záznamy inspekcí, ale stav je nastaven na „Neproběhla“.");
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
