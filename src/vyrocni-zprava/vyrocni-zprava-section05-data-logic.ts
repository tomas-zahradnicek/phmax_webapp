import type { SchoolProfile } from "../school-profile/school-profile-types";
import type {
  AnnualReportSection05Data,
  AnnualReportSection05GoalEvaluation,
  AnnualReportSection05WeeklyHourRow,
  Section05GoalLevel,
} from "./vyrocni-zprava-section05-types";

export const VYROCNI_ZPRAVA_SECTION05_LS_KEY = "vyrocni-zprava-section05-data-v1";

const GOAL_LEVEL_LABELS: Record<Section05GoalLevel, string> = {
  VETSINA_HODIN: "Objevuje se ve většině hodin a činností",
  NEKTERE_HODINY: "Objevuje se pouze v některých hodinách a činnostech",
  NEOBJEVUJE_SE: "V hodinách a činnostech se neobjevuje",
};

export type Section05Readiness = {
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

function sanitizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return value;
}

function sanitizeGoalLevel(value: unknown): Section05GoalLevel | undefined {
  if (value === "VETSINA_HODIN" || value === "NEKTERE_HODINY" || value === "NEOBJEVUJE_SE") return value;
  return undefined;
}

function normalizeWeeklyHourRow(raw: unknown): AnnualReportSection05WeeklyHourRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    subject: sanitizeOptionalText(o.subject) ?? "",
    grade1: sanitizeOptionalNumber(o.grade1),
    grade2: sanitizeOptionalNumber(o.grade2),
    grade3: sanitizeOptionalNumber(o.grade3),
    grade4: sanitizeOptionalNumber(o.grade4),
    grade5: sanitizeOptionalNumber(o.grade5),
    grade6: sanitizeOptionalNumber(o.grade6),
    grade7: sanitizeOptionalNumber(o.grade7),
    grade8: sanitizeOptionalNumber(o.grade8),
    grade9: sanitizeOptionalNumber(o.grade9),
  };
}

function normalizeGoalEvaluation(raw: unknown): AnnualReportSection05GoalEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    goal: sanitizeOptionalText(o.goal) ?? "",
    level: sanitizeGoalLevel(o.level),
    evidence: sanitizeOptionalText(o.evidence),
    note: sanitizeOptionalText(o.note),
  };
}

export function createDefaultSection05WeeklyHourRow(): AnnualReportSection05WeeklyHourRow {
  return {
    subject: "",
    grade1: undefined,
    grade2: undefined,
    grade3: undefined,
    grade4: undefined,
    grade5: undefined,
    grade6: undefined,
    grade7: undefined,
    grade8: undefined,
    grade9: undefined,
  };
}

export function createDefaultSection05GoalEvaluation(): AnnualReportSection05GoalEvaluation {
  return {
    goal: "",
    level: undefined,
    evidence: "",
    note: "",
  };
}

export function createDefaultSection05Data(): AnnualReportSection05Data {
  return {
    educationProgram: {
      name: "",
      applicableClasses: "",
      note: "",
    },
    schoolCurriculumPlan: {
      description: "",
      weeklyHourPlan: [],
      note: "",
    },
    goalsEvaluation: [],
    overallEvaluation: "",
    strengths: "",
    areasForImprovement: "",
    measuresForNextYear: "",
    notes: "",
  };
}

export function normalizeSection05Data(raw: unknown): AnnualReportSection05Data | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    educationProgram: (() => {
      const p = o.educationProgram;
      if (!p || typeof p !== "object") return { name: "", applicableClasses: "", note: "" };
      const po = p as Record<string, unknown>;
      return {
        name: sanitizeOptionalText(po.name) ?? "",
        applicableClasses: sanitizeOptionalText(po.applicableClasses) ?? "",
        note: sanitizeOptionalText(po.note) ?? "",
      };
    })(),
    schoolCurriculumPlan: (() => {
      const p = o.schoolCurriculumPlan;
      if (!p || typeof p !== "object") return { description: "", weeklyHourPlan: [], note: "" };
      const po = p as Record<string, unknown>;
      return {
        description: sanitizeOptionalText(po.description) ?? "",
        weeklyHourPlan: Array.isArray(po.weeklyHourPlan)
          ? po.weeklyHourPlan
              .map(normalizeWeeklyHourRow)
              .filter((row): row is AnnualReportSection05WeeklyHourRow => row !== null)
          : [],
        note: sanitizeOptionalText(po.note) ?? "",
      };
    })(),
    goalsEvaluation: Array.isArray(o.goalsEvaluation)
      ? o.goalsEvaluation
          .map(normalizeGoalEvaluation)
          .filter((row): row is AnnualReportSection05GoalEvaluation => row !== null)
      : [],
    overallEvaluation: sanitizeOptionalText(o.overallEvaluation) ?? "",
    strengths: sanitizeOptionalText(o.strengths) ?? "",
    areasForImprovement: sanitizeOptionalText(o.areasForImprovement) ?? "",
    measuresForNextYear: sanitizeOptionalText(o.measuresForNextYear) ?? "",
    notes: sanitizeOptionalText(o.notes) ?? "",
  };
}

export function getSection05Readiness(params: {
  section05Data: AnnualReportSection05Data;
  schoolProfile: SchoolProfile;
}): Section05Readiness {
  const d = params.section05Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = pickFilledString(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  const educationProgramName = pickFilledString(d.educationProgram.name);
  if (educationProgramName) {
    availableData.push(`Název ŠVP: ${educationProgramName}`);
  } else {
    missingData.push("Název školního vzdělávacího programu");
  }

  const applicableClasses = pickFilledString(d.educationProgram.applicableClasses);
  if (applicableClasses) {
    availableData.push(`Zařazené třídy / ročníky: ${applicableClasses}`);
  } else {
    recommendedData.push("Zařazené třídy / ročníky");
  }

  const curriculumDescription = pickFilledString(d.schoolCurriculumPlan.description);
  if (curriculumDescription) {
    availableData.push("Popis učebního plánu školy");
  } else {
    recommendedData.push("Stručný popis učebního plánu školy");
  }

  const weeklyPlanRows = d.schoolCurriculumPlan.weeklyHourPlan ?? [];
  const weeklyPlanWithSubject = weeklyPlanRows.filter((row) => pickFilledString(row.subject));
  if (weeklyPlanWithSubject.length > 0) {
    availableData.push(`Týdenní hodinový plán: ${weeklyPlanWithSubject.length} předmětů`);
  } else {
    recommendedData.push("Týdenní hodinový plán (tabulka předmětů)");
    warnings.push("Učební plán je prázdný. Doplňte alespoň základní přehled předmětů.");
  }

  if (d.goalsEvaluation.length === 0) {
    missingData.push("Alespoň jeden cíl ŠVP v části naplňování cílů");
  }

  d.goalsEvaluation.forEach((goalRow, index) => {
    const rowIndex = index + 1;
    const goalText = pickFilledString(goalRow.goal);
    if (!goalText) {
      missingData.push(`Cíl ŠVP (řádek ${rowIndex})`);
    }

    if (!goalRow.level) {
      missingData.push(`Míra naplňování cíle (řádek ${rowIndex})`);
    } else {
      availableData.push(`Cíl ${rowIndex}: ${GOAL_LEVEL_LABELS[goalRow.level]}`);
    }

    const evidence = pickFilledString(goalRow.evidence);
    if (!evidence) {
      recommendedData.push(`Důkaz / příklad z praxe (řádek ${rowIndex})`);
    }

    if (goalRow.level === "NEOBJEVUJE_SE") {
      const rowNote = pickFilledString(goalRow.note);
      const measure = pickFilledString(d.measuresForNextYear);
      if (!rowNote && !measure) {
        warnings.push(
          `Cíl ${rowIndex} je označen jako „neobjevuje se“, ale chybí poznámka nebo opatření pro další rok.`,
        );
      }
    }
  });

  const overallEvaluation = pickFilledString(d.overallEvaluation);
  if (!overallEvaluation) {
    missingData.push("Celkové vyhodnocení naplňování ŠVP");
  } else {
    availableData.push("Celkové vyhodnocení naplňování ŠVP");
    if (overallEvaluation.length < 80) {
      warnings.push("Celkové vyhodnocení je velmi stručné. Zvažte doplnění konkrétních zjištění.");
    }
  }

  const strengths = pickFilledString(d.strengths);
  if (!strengths) {
    recommendedData.push("Silné stránky");
  } else {
    availableData.push("Silné stránky");
  }

  const areasForImprovement = pickFilledString(d.areasForImprovement);
  if (!areasForImprovement) {
    recommendedData.push("Oblasti ke zlepšení");
  } else {
    availableData.push("Oblasti ke zlepšení");
  }

  const measuresForNextYear = pickFilledString(d.measuresForNextYear);
  if (!measuresForNextYear) {
    recommendedData.push("Opatření pro další školní rok");
  } else {
    availableData.push("Opatření pro další školní rok");
  }

  const notes = pickFilledString(d.notes);
  if (!notes) {
    recommendedData.push("Doplňující poznámky");
  } else {
    availableData.push("Doplňující poznámky");
  }

  const goalLevels = d.goalsEvaluation.map((item) => item.level).filter((item): item is Section05GoalLevel => !!item);
  const uniqueGoalLevels = new Set(goalLevels);
  const hasAnyGoalExplanation = d.goalsEvaluation.some(
    (row) => pickFilledString(row.evidence) || pickFilledString(row.note),
  );
  if (
    d.goalsEvaluation.length > 1 &&
    uniqueGoalLevels.size === 1 &&
    !hasAnyGoalExplanation &&
    !areasForImprovement &&
    !measuresForNextYear
  ) {
    warnings.push("Všechny cíle mají stejnou míru naplňování bez doplňujícího vysvětlení.");
  }

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
    warnings,
  };
}
