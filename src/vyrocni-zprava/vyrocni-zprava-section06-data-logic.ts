import type { SchoolProfile } from "../school-profile/school-profile-types";
import type {
  AnnualReportSection06ClassResultRow,
  AnnualReportSection06Data,
  AnnualReportSection06EducationalMeasuresTerm,
  AnnualReportSection06ExamData,
} from "./vyrocni-zprava-section06-types";

export const VYROCNI_ZPRAVA_SECTION06_LS_KEY = "vyrocni-zprava-section06-data-v1";

export type Section06Readiness = {
  status: "CHYBI_UDAJE" | "PRIPRAVENO";
  missingData: string[];
  recommendedData: string[];
  availableData: string[];
  warnings: string[];
};

type MeasureKey = keyof AnnualReportSection06EducationalMeasuresTerm;

const MEASURE_FIELDS: { key: MeasureKey; label: string }[] = [
  { key: "classTeacherPraise", label: "Pochvala třídního učitele" },
  { key: "principalPraise", label: "Pochvala ředitele školy" },
  { key: "classTeacherWarning", label: "Napomenutí třídního učitele" },
  { key: "classTeacherReprimand", label: "Důtka třídního učitele" },
  { key: "principalReprimand", label: "Důtka ředitele školy" },
  { key: "secondConductGrade", label: "2. stupeň z chování" },
  { key: "thirdConductGrade", label: "3. stupeň z chování" },
];

const CLASS_DETAIL_LABELS: { key: keyof AnnualReportSection06ClassResultRow; label: string }[] = [
  { key: "passedWithHonours", label: "Prospěl s vyznamenáním" },
  { key: "passed", label: "Prospěl" },
  { key: "failed", label: "Neprospěl" },
  { key: "notAssessed", label: "Nehodnocen" },
  { key: "reducedConductGrade", label: "Snížená známka z chování" },
  { key: "averageGrade", label: "Průměrný prospěch" },
  { key: "excusedAbsencePerPupil", label: "Omluvená absence na žáka" },
  { key: "unexcusedAbsencePerPupil", label: "Neomluvená absence na žáka" },
];

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

function normalizeClassResultRow(raw: unknown): AnnualReportSection06ClassResultRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    className: sanitizeOptionalText(o.className) ?? "",
    pupilsTotal: sanitizeOptionalNumber(o.pupilsTotal),
    classTeacher: sanitizeOptionalText(o.classTeacher),
    passedWithHonours: sanitizeOptionalNumber(o.passedWithHonours),
    passed: sanitizeOptionalNumber(o.passed),
    failed: sanitizeOptionalNumber(o.failed),
    notAssessed: sanitizeOptionalNumber(o.notAssessed),
    reducedConductGrade: sanitizeOptionalNumber(o.reducedConductGrade),
    averageGrade: sanitizeOptionalNumber(o.averageGrade),
    excusedAbsencePerPupil: sanitizeOptionalNumber(o.excusedAbsencePerPupil),
    unexcusedAbsencePerPupil: sanitizeOptionalNumber(o.unexcusedAbsencePerPupil),
  };
}

function normalizeMeasures(raw: unknown): AnnualReportSection06EducationalMeasuresTerm {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    classTeacherPraise: sanitizeOptionalNumber(o.classTeacherPraise),
    principalPraise: sanitizeOptionalNumber(o.principalPraise),
    classTeacherWarning: sanitizeOptionalNumber(o.classTeacherWarning),
    classTeacherReprimand: sanitizeOptionalNumber(o.classTeacherReprimand),
    principalReprimand: sanitizeOptionalNumber(o.principalReprimand),
    secondConductGrade: sanitizeOptionalNumber(o.secondConductGrade),
    thirdConductGrade: sanitizeOptionalNumber(o.thirdConductGrade),
  };
}

function normalizeExamData(raw: unknown): AnnualReportSection06ExamData {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    description: sanitizeOptionalText(o.description),
    pupilsTotal: sanitizeOptionalNumber(o.pupilsTotal),
    passed: sanitizeOptionalNumber(o.passed),
    failed: sanitizeOptionalNumber(o.failed),
    note: sanitizeOptionalText(o.note),
  };
}

function hasAnyExamData(exam?: AnnualReportSection06ExamData): boolean {
  if (!exam) return false;
  return Boolean(
    pickFilledString(exam.description) ||
      exam.pupilsTotal !== undefined ||
      exam.passed !== undefined ||
      exam.failed !== undefined ||
      pickFilledString(exam.note),
  );
}

function hasMeasuresData(term?: AnnualReportSection06EducationalMeasuresTerm): boolean {
  if (!term) return false;
  return MEASURE_FIELDS.some((field) => term[field.key] !== undefined);
}

function isClassRowCompleteForRequired(row: AnnualReportSection06ClassResultRow): boolean {
  return Boolean(pickFilledString(row.className) && row.pupilsTotal !== undefined);
}

function rowHasAssessmentDetails(row: AnnualReportSection06ClassResultRow): boolean {
  return CLASS_DETAIL_LABELS.some((field) => row[field.key] !== undefined);
}

function sumPupils(rows: AnnualReportSection06ClassResultRow[]): number {
  return rows.reduce((sum, row) => sum + (row.pupilsTotal ?? 0), 0);
}

function validateExamWarnings(examName: string, exam?: AnnualReportSection06ExamData): string[] {
  if (!exam) return [];
  const warnings: string[] = [];
  if (exam.pupilsTotal !== undefined && exam.pupilsTotal < 0) warnings.push(`${examName}: počet žáků nesmí být záporný.`);
  if (exam.passed !== undefined && exam.passed < 0) warnings.push(`${examName}: počet úspěšných nesmí být záporný.`);
  if (exam.failed !== undefined && exam.failed < 0) warnings.push(`${examName}: počet neúspěšných nesmí být záporný.`);
  if (exam.pupilsTotal !== undefined && exam.failed !== undefined && exam.failed > exam.pupilsTotal) {
    warnings.push(`${examName}: počet neúspěšných je vyšší než celkový počet žáků.`);
  }
  return warnings;
}

function isExamRelevantForSchoolType(schoolType: string | undefined): boolean {
  const type = (schoolType ?? "").toLowerCase();
  return type.includes("střední") || type.includes("konzervatoř") || type.includes("vyšší odborn");
}

export function createDefaultSection06ClassResultRow(): AnnualReportSection06ClassResultRow {
  return {
    className: "",
    pupilsTotal: undefined,
    classTeacher: "",
    passedWithHonours: undefined,
    passed: undefined,
    failed: undefined,
    notAssessed: undefined,
    reducedConductGrade: undefined,
    averageGrade: undefined,
    excusedAbsencePerPupil: undefined,
    unexcusedAbsencePerPupil: undefined,
  };
}

export function createDefaultSection06Data(): AnnualReportSection06Data {
  return {
    firstTermClassResults: [],
    secondTermClassResults: [],
    educationalMeasures: {
      firstTerm: {},
      secondTerm: {},
    },
    finalExams: {},
    maturitaExams: {},
    absolutorium: {},
    summaryEvaluation: "",
    notes: "",
  };
}

export function normalizeSection06Data(raw: unknown): AnnualReportSection06Data | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    firstTermClassResults: Array.isArray(o.firstTermClassResults)
      ? o.firstTermClassResults
          .map(normalizeClassResultRow)
          .filter((row): row is AnnualReportSection06ClassResultRow => row !== null)
      : [],
    secondTermClassResults: Array.isArray(o.secondTermClassResults)
      ? o.secondTermClassResults
          .map(normalizeClassResultRow)
          .filter((row): row is AnnualReportSection06ClassResultRow => row !== null)
      : [],
    educationalMeasures: (() => {
      const measures = o.educationalMeasures;
      if (!measures || typeof measures !== "object") return { firstTerm: {}, secondTerm: {} };
      const mo = measures as Record<string, unknown>;
      return {
        firstTerm: normalizeMeasures(mo.firstTerm),
        secondTerm: normalizeMeasures(mo.secondTerm),
      };
    })(),
    finalExams: normalizeExamData(o.finalExams),
    maturitaExams: normalizeExamData(o.maturitaExams),
    absolutorium: normalizeExamData(o.absolutorium),
    summaryEvaluation: sanitizeOptionalText(o.summaryEvaluation) ?? "",
    notes: sanitizeOptionalText(o.notes) ?? "",
  };
}

export function getSection06Readiness(params: {
  section06Data: AnnualReportSection06Data;
  schoolProfile: SchoolProfile;
}): Section06Readiness {
  const d = params.section06Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = pickFilledString(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  const completeFirstRows = d.firstTermClassResults.filter(isClassRowCompleteForRequired);
  const completeSecondRows = d.secondTermClassResults.filter(isClassRowCompleteForRequired);
  if (completeFirstRows.length === 0) {
    missingData.push("Alespoň jedna třída v 1. pololetí (třída + počet žáků)");
  } else {
    availableData.push(`1. pololetí: ${completeFirstRows.length} tříd`);
  }
  if (completeSecondRows.length === 0) {
    missingData.push("Alespoň jedna třída v 2. pololetí (třída + počet žáků)");
  } else {
    availableData.push(`2. pololetí: ${completeSecondRows.length} tříd`);
  }

  d.firstTermClassResults.forEach((row, index) => {
    const rowLabel = `1. pololetí řádek ${index + 1}`;
    const className = pickFilledString(row.className);
    if (className) {
      availableData.push(`1. pololetí třída: ${className}`);
    }
    if (!pickFilledString(row.classTeacher) && className) {
      recommendedData.push(`Třídní učitel (${rowLabel})`);
    }
    if (className && !rowHasAssessmentDetails(row)) {
      recommendedData.push(`Hodnoticí údaje (${rowLabel})`);
    }
    if (row.pupilsTotal !== undefined && row.pupilsTotal < 0) warnings.push(`${rowLabel}: počet žáků nesmí být záporný.`);
    if (row.failed !== undefined && row.failed < 0) warnings.push(`${rowLabel}: počet neprospěl nesmí být záporný.`);
    if (row.failed !== undefined && row.pupilsTotal !== undefined && row.failed > row.pupilsTotal) {
      warnings.push(`${rowLabel}: počet neprospěl je vyšší než počet žáků.`);
    }
    if (row.excusedAbsencePerPupil !== undefined && row.excusedAbsencePerPupil < 0) {
      warnings.push(`${rowLabel}: omluvená absence na žáka nesmí být záporná.`);
    }
    if (row.unexcusedAbsencePerPupil !== undefined && row.unexcusedAbsencePerPupil < 0) {
      warnings.push(`${rowLabel}: neomluvená absence na žáka nesmí být záporná.`);
    }
    if (row.averageGrade !== undefined && (row.averageGrade < 1 || row.averageGrade > 5)) {
      warnings.push(`${rowLabel}: průměrný prospěch je mimo očekávaný rozsah 1 až 5.`);
    }
    const sumKnown =
      row.passedWithHonours !== undefined &&
      row.passed !== undefined &&
      row.failed !== undefined &&
      row.notAssessed !== undefined &&
      row.pupilsTotal !== undefined;
    if (sumKnown) {
      const sum = (row.passedWithHonours ?? 0) + (row.passed ?? 0) + (row.failed ?? 0) + (row.notAssessed ?? 0);
      if (sum !== row.pupilsTotal) {
        warnings.push(`${rowLabel}: součet výsledků neodpovídá celkovému počtu žáků.`);
      }
    }
  });

  d.secondTermClassResults.forEach((row, index) => {
    const rowLabel = `2. pololetí řádek ${index + 1}`;
    const className = pickFilledString(row.className);
    if (className) {
      availableData.push(`2. pololetí třída: ${className}`);
    }
    if (!pickFilledString(row.classTeacher) && className) {
      recommendedData.push(`Třídní učitel (${rowLabel})`);
    }
    if (className && !rowHasAssessmentDetails(row)) {
      recommendedData.push(`Hodnoticí údaje (${rowLabel})`);
    }
    if (row.pupilsTotal !== undefined && row.pupilsTotal < 0) warnings.push(`${rowLabel}: počet žáků nesmí být záporný.`);
    if (row.failed !== undefined && row.failed < 0) warnings.push(`${rowLabel}: počet neprospěl nesmí být záporný.`);
    if (row.failed !== undefined && row.pupilsTotal !== undefined && row.failed > row.pupilsTotal) {
      warnings.push(`${rowLabel}: počet neprospěl je vyšší než počet žáků.`);
    }
    if (row.excusedAbsencePerPupil !== undefined && row.excusedAbsencePerPupil < 0) {
      warnings.push(`${rowLabel}: omluvená absence na žáka nesmí být záporná.`);
    }
    if (row.unexcusedAbsencePerPupil !== undefined && row.unexcusedAbsencePerPupil < 0) {
      warnings.push(`${rowLabel}: neomluvená absence na žáka nesmí být záporná.`);
    }
    if (row.averageGrade !== undefined && (row.averageGrade < 1 || row.averageGrade > 5)) {
      warnings.push(`${rowLabel}: průměrný prospěch je mimo očekávaný rozsah 1 až 5.`);
    }
    const sumKnown =
      row.passedWithHonours !== undefined &&
      row.passed !== undefined &&
      row.failed !== undefined &&
      row.notAssessed !== undefined &&
      row.pupilsTotal !== undefined;
    if (sumKnown) {
      const sum = (row.passedWithHonours ?? 0) + (row.passed ?? 0) + (row.failed ?? 0) + (row.notAssessed ?? 0);
      if (sum !== row.pupilsTotal) {
        warnings.push(`${rowLabel}: součet výsledků neodpovídá celkovému počtu žáků.`);
      }
    }
  });

  const firstTotal = sumPupils(completeFirstRows);
  const secondTotal = sumPupils(completeSecondRows);
  if (completeFirstRows.length > 0 && completeSecondRows.length > 0) {
    if (Math.abs(firstTotal - secondTotal) >= 20) {
      warnings.push(
        `Celkový počet žáků v 1. pololetí (${firstTotal}) a 2. pololetí (${secondTotal}) se výrazně liší.`,
      );
    }
  }

  if (!hasMeasuresData(d.educationalMeasures.firstTerm) && !hasMeasuresData(d.educationalMeasures.secondTerm)) {
    recommendedData.push("Výchovná opatření (1. a 2. pololetí)");
  } else {
    availableData.push("Výchovná opatření");
  }

  const relevantExams = isExamRelevantForSchoolType(schoolType);
  const anyExamData = hasAnyExamData(d.finalExams) || hasAnyExamData(d.maturitaExams) || hasAnyExamData(d.absolutorium);
  if (anyExamData) {
    availableData.push("Údaje o závěrečných/maturitních/absolutoriích zkouškách");
  } else if (relevantExams) {
    recommendedData.push("Výsledky závěrečných, maturitních nebo absolutorních zkoušek");
  }

  warnings.push(...validateExamWarnings("Závěrečné zkoušky", d.finalExams));
  warnings.push(...validateExamWarnings("Maturitní zkoušky", d.maturitaExams));
  warnings.push(...validateExamWarnings("Absolutorium", d.absolutorium));

  const summary = pickFilledString(d.summaryEvaluation);
  if (!summary) {
    missingData.push("Souhrnné vyhodnocení výsledků vzdělávání");
  } else {
    availableData.push("Souhrnné vyhodnocení výsledků vzdělávání");
    if (summary.length < 80) {
      warnings.push("Souhrnné vyhodnocení je velmi stručné. Zvažte doplnění konkrétních zjištění.");
    }
  }

  const hasAnyClassDetails =
    d.firstTermClassResults.some(rowHasAssessmentDetails) || d.secondTermClassResults.some(rowHasAssessmentDetails);
  if (!hasAnyClassDetails) {
    warnings.push("Ve třídních statistikách chybí podrobnější hodnoticí údaje.");
  }

  if (!pickFilledString(d.notes)) {
    recommendedData.push("Doplňující poznámky");
  } else {
    availableData.push("Doplňující poznámky");
  }

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
    warnings,
  };
}
