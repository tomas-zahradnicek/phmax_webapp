import type { AnnualReportPersonnelData } from "../vyrocni-zprava-personnel-types";
import type { AnnualReportSection04Data } from "../vyrocni-zprava-section04-types";
import type { AnnualReportSection05Data, Section05GoalLevel } from "../vyrocni-zprava-section05-types";
import type { AnnualReportSection06ClassResultRow, AnnualReportSection06Data } from "../vyrocni-zprava-section06-types";
import type { AnnualReportSection07Data } from "../vyrocni-zprava-section07-types";
import type { AnnualReportSection08Data } from "../vyrocni-zprava-section08-types";
import type { AnnualReportSection09Data } from "../vyrocni-zprava-section09-types";
import type { AnnualReportSection11Data } from "../vyrocni-zprava-section11-types";
import type { SchoolProfile } from "../../school-profile/school-profile-types";
import { formatSchoolTypeForReport } from "../vyrocni-zprava-text-formatting-helpers";
import { formatCzechDecimal, formatCzechInteger, formatCzechCzk } from "../vyrocni-zprava-number-formatting-helpers";
import {
  calculateAgeGenderTotals,
  calculateEducationGenderTotals,
  calculateQualificationTotals,
} from "../vyrocni-zprava-personnel-logic";
import { normalizeSecondarySchoolTypeKey } from "../vyrocni-zprava-section04-data-logic";
import { buildPupilCountTableRowOutputs } from "../vyrocni-zprava-section04-pupil-count-summary";
import type { AnnualReportSection04PupilCountRow } from "../vyrocni-zprava-section04-types";

export type DocxStructuredBlock =
  | { type: "heading"; text: string; level: 3 }
  | { type: "paragraph"; text: string }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
      layout?: "default" | "wide";
      columnWidthsPercent?: number[];
      boldBodyRowIndices?: number[];
      pageOrientation?: "portrait" | "landscape";
    };

export type AnnualReportDocxStructuredData = {
  schoolProfileData?: SchoolProfile;
  section03Data?: AnnualReportPersonnelData;
  section04Data?: AnnualReportSection04Data;
  section05Data?: AnnualReportSection05Data;
  section06Data?: AnnualReportSection06Data;
  section07Data?: AnnualReportSection07Data;
  section08Data?: AnnualReportSection08Data;
  section09Data?: AnnualReportSection09Data;
  section11Data?: AnnualReportSection11Data;
};

function hasAnyText(value: string | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function hasAnyRows(rows: string[][]): boolean {
  return rows.length > 0;
}

function buildHeading(text: string): DocxStructuredBlock {
  return { type: "heading", text, level: 3 };
}

function buildTable(
  headers: string[],
  rows: string[][],
  options?: {
    layout?: "default" | "wide";
    columnWidthsPercent?: number[];
    boldBodyRowIndices?: number[];
    pageOrientation?: "portrait" | "landscape";
  },
): DocxStructuredBlock {
  return {
    type: "table",
    headers,
    rows,
    layout: options?.layout,
    columnWidthsPercent: options?.columnWidthsPercent,
    boldBodyRowIndices: options?.boldBodyRowIndices,
    pageOrientation: options?.pageOrientation,
  };
}

function integerOrDash(value: number | undefined): string {
  return value === undefined ? "—" : formatCzechInteger(value);
}

function decimalOrDash(value: number | undefined, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }): string {
  return value === undefined ? "—" : formatCzechDecimal(value, options);
}

function textOrDash(value: string | undefined): string {
  return hasAnyText(value) ? value!.trim() : "—";
}

function textOrEmpty(value: string | undefined): string {
  return hasAnyText(value) ? value!.trim() : "";
}

function buildSection01DocxTables(profile: SchoolProfile): DocxStructuredBlock[] {
  const rows = [
    ["Oficiální název školy", textOrDash(profile.name)],
    ["Typ školy", textOrDash(formatSchoolTypeForReport(profile.schoolType) ?? profile.schoolType)],
    ["IČO", textOrDash(profile.ico)],
    ["RED IZO", textOrDash(profile.redIzo)],
    ["IZO", textOrDash(profile.izo)],
  ];
  if (!rows.some((row) => row[1] !== "—")) return [];
  return [buildHeading("1.1 Název školy"), buildTable(["Údaj", "Hodnota"], rows)];
}

function buildSection03DocxTables(section03Data: AnnualReportPersonnelData): DocxStructuredBlock[] {
  const blocks: DocxStructuredBlock[] = [];
  const s = section03Data.staffCounts;
  const row31 = [
    ["Učitelé", integerOrDash(s.teachersPersons), decimalOrDash(s.teachersFte, { minimumFractionDigits: 0, maximumFractionDigits: 2 })],
    ["Vychovatelé", integerOrDash(s.educatorsPersons), decimalOrDash(s.educatorsFte, { minimumFractionDigits: 0, maximumFractionDigits: 2 })],
    ["Speciální pedagogové", integerOrDash(s.specialPedagoguesPersons), decimalOrDash(s.specialPedagoguesFte, { minimumFractionDigits: 0, maximumFractionDigits: 2 })],
    ["Asistenti pedagoga", integerOrDash(s.teachingAssistantsPersons), decimalOrDash(s.teachingAssistantsFte, { minimumFractionDigits: 0, maximumFractionDigits: 2 })],
    ["Správní a nepedagogičtí zaměstnanci", integerOrDash(s.nonTeachingStaffPersons), decimalOrDash(s.nonTeachingStaffFte, { minimumFractionDigits: 0, maximumFractionDigits: 2 })],
  ];
  const pedagogicalPersons = [s.teachersPersons, s.educatorsPersons, s.specialPedagoguesPersons, s.teachingAssistantsPersons].reduce<number>((acc, v) => acc + (v ?? 0), 0);
  const pedagogicalFte = [s.teachersFte, s.educatorsFte, s.specialPedagoguesFte, s.teachingAssistantsFte].reduce<number>((acc, v) => acc + (v ?? 0), 0);
  const totalPersons = pedagogicalPersons + (s.nonTeachingStaffPersons ?? 0);
  const totalFte = pedagogicalFte + (s.nonTeachingStaffFte ?? 0);
  row31.push(["Celkem pedagogičtí pracovníci", formatCzechInteger(pedagogicalPersons), formatCzechDecimal(pedagogicalFte, { minimumFractionDigits: 0, maximumFractionDigits: 2 })]);
  row31.push(["Celkem pracovníci školy", formatCzechInteger(totalPersons), formatCzechDecimal(totalFte, { minimumFractionDigits: 0, maximumFractionDigits: 2 })]);
  blocks.push(buildHeading("3.1 Základní údaje o pracovnících školy"));
  blocks.push(buildTable(["Kategorie", "Fyzické osoby", "Úvazky"], row31));

  const age = section03Data.ageAndGender;
  const row32: string[][] = [
    ["Do 35 let", integerOrDash(age.under35.men), integerOrDash(age.under35.women), formatCzechInteger((age.under35.men ?? 0) + (age.under35.women ?? 0))],
    ["36–45 let", integerOrDash(age.age36to45.men), integerOrDash(age.age36to45.women), formatCzechInteger((age.age36to45.men ?? 0) + (age.age36to45.women ?? 0))],
    ["46–55 let", integerOrDash(age.age46to55.men), integerOrDash(age.age46to55.women), formatCzechInteger((age.age46to55.men ?? 0) + (age.age46to55.women ?? 0))],
    ["Nad 55 let", integerOrDash(age.over55.men), integerOrDash(age.over55.women), formatCzechInteger((age.over55.men ?? 0) + (age.over55.women ?? 0))],
    ["V důchodovém věku", integerOrDash(age.retirementAge.men), integerOrDash(age.retirementAge.women), formatCzechInteger((age.retirementAge.men ?? 0) + (age.retirementAge.women ?? 0))],
  ];
  const ageTotals = calculateAgeGenderTotals(section03Data);
  row32.push([
    "Celkem",
    formatCzechInteger(ageTotals.totalMen),
    formatCzechInteger(ageTotals.totalWomen),
    formatCzechInteger(ageTotals.grandTotal),
  ]);
  blocks.push(buildHeading("3.2 Členění pedagogických zaměstnanců podle věku a pohlaví"));
  blocks.push(
    buildTable(["Věková skupina", "Muži", "Ženy", "Celkem"], row32, {
      boldBodyRowIndices: [row32.length - 1],
    }),
  );

  const education = section03Data.educationAndGender;
  const eduTotals = calculateEducationGenderTotals(section03Data);
  const row33: string[][] = [
    ["Nižší než maturita", integerOrDash(education.belowMaturita.men), integerOrDash(education.belowMaturita.women), formatCzechInteger((education.belowMaturita.men ?? 0) + (education.belowMaturita.women ?? 0))],
    ["Maturita", integerOrDash(education.maturita.men), integerOrDash(education.maturita.women), formatCzechInteger((education.maturita.men ?? 0) + (education.maturita.women ?? 0))],
    ["Vyšší odborné vzdělání", integerOrDash(education.higherVocational.men), integerOrDash(education.higherVocational.women), formatCzechInteger((education.higherVocational.men ?? 0) + (education.higherVocational.women ?? 0))],
    ["Vysokoškolské vzdělání", integerOrDash(education.university.men), integerOrDash(education.university.women), formatCzechInteger((education.university.men ?? 0) + (education.university.women ?? 0))],
  ];
  row33.push([
    "Celkem",
    formatCzechInteger(eduTotals.totalMen),
    formatCzechInteger(eduTotals.totalWomen),
    formatCzechInteger(eduTotals.grandTotal),
  ]);
  blocks.push(buildHeading("3.3 Členění pedagogických zaměstnanců podle vzdělání a pohlaví"));
  blocks.push(
    buildTable(["Vzdělání", "Muži", "Ženy", "Celkem"], row33, {
      boldBodyRowIndices: [row33.length - 1],
    }),
  );

  const q = section03Data.qualification;
  const qualTotals = calculateQualificationTotals(section03Data);
  const row34: string[][] = [
    ["Učitel 1. stupně", integerOrDash(q.primaryTeachers.qualified), integerOrDash(q.primaryTeachers.notQualified), formatCzechInteger((q.primaryTeachers.qualified ?? 0) + (q.primaryTeachers.notQualified ?? 0))],
    ["Učitel 2. stupně", integerOrDash(q.lowerSecondaryTeachers.qualified), integerOrDash(q.lowerSecondaryTeachers.notQualified), formatCzechInteger((q.lowerSecondaryTeachers.qualified ?? 0) + (q.lowerSecondaryTeachers.notQualified ?? 0))],
    ["Vychovatel", integerOrDash(q.educators.qualified), integerOrDash(q.educators.notQualified), formatCzechInteger((q.educators.qualified ?? 0) + (q.educators.notQualified ?? 0))],
    ["Asistent pedagoga", integerOrDash(q.teachingAssistants.qualified), integerOrDash(q.teachingAssistants.notQualified), formatCzechInteger((q.teachingAssistants.qualified ?? 0) + (q.teachingAssistants.notQualified ?? 0))],
    ["Speciální pedagog", integerOrDash(q.specialPedagogues.qualified), integerOrDash(q.specialPedagogues.notQualified), formatCzechInteger((q.specialPedagogues.qualified ?? 0) + (q.specialPedagogues.notQualified ?? 0))],
  ];
  row34.push([
    "Celkem",
    formatCzechInteger(qualTotals.totalQualified),
    formatCzechInteger(qualTotals.totalNotQualified),
    formatCzechInteger(qualTotals.grandTotal),
  ]);
  blocks.push(buildHeading("3.4 Členění pedagogických pracovníků podle odborné kvalifikace"));
  blocks.push(
    buildTable(["Kategorie", "Splňuje kvalifikaci", "Nesplňuje kvalifikaci", "Celkem"], row34, {
      boldBodyRowIndices: [row34.length - 1],
    }),
  );
  return blocks;
}

function buildPupilCountDocxRows(rows: AnnualReportSection04PupilCountRow[]): {
  tableRows: string[][];
  boldBodyRowIndices: number[];
} {
  const outputs = buildPupilCountTableRowOutputs(rows);
  const boldBodyRowIndices: number[] = [];
  const tableRows = outputs.map((row, index) => {
    if (row.isSummaryRow) boldBodyRowIndices.push(index);
    return [
      row.label,
      integerOrDash(row.boys),
      integerOrDash(row.girls),
      integerOrDash(row.total),
      row.isSummaryRow ? "" : row.classTeacher ?? "—",
    ];
  });
  return { tableRows, boldBodyRowIndices };
}

function buildSection04DocxTables(section04Data: AnnualReportSection04Data): DocxStructuredBlock[] {
  const blocks: DocxStructuredBlock[] = [];
  const toAdmissionRows = (summary: AnnualReportSection04Data["firstGradeAdmissionCurrentYear"]): string[][] => [
    ["Poprvé u zápisu", integerOrDash(summary.firstTimeTotal), integerOrDash(summary.firstTimeGirls)],
    ["Po odkladu", integerOrDash(summary.afterDeferralTotal), integerOrDash(summary.afterDeferralGirls)],
    ["Zapsaní", integerOrDash(summary.enrolledTotal), integerOrDash(summary.enrolledGirls)],
    ["Žádosti o odklad", integerOrDash(summary.deferralRequestsTotal), integerOrDash(summary.deferralRequestsGirls)],
  ];
  blocks.push(buildHeading("4.1 Žáci přijatí do 1. ročníku základní školy pro tento školní rok"));
  blocks.push(buildTable(["Ukazatel", "Celkem", "Z toho dívek"], toAdmissionRows(section04Data.firstGradeAdmissionCurrentYear)));

  const admittedRows = section04Data.pupilsAdmittedDuringYear
    .filter((row) => hasAnyText(row.grade))
    .map((row) => [row.grade, integerOrDash(row.count)]);
  if (hasAnyRows(admittedRows)) {
    blocks.push(buildHeading("4.2 Žáci přijati v průběhu školního roku"));
    blocks.push(buildTable(["Ročník", "Počet žáků"], admittedRows));
  }

  const leftRows = section04Data.pupilsLeftDuringYear.filter((row) => hasAnyText(row.grade)).map((row) => [row.grade, integerOrDash(row.count)]);
  if (hasAnyRows(leftRows)) {
    blocks.push(buildHeading("4.3 Žáci v průběhu školního roku odhlášeni"));
    blocks.push(buildTable(["Ročník", "Počet žáků"], leftRows));
  }

  blocks.push(buildHeading("4.4 Zápis pro následující školní rok"));
  blocks.push(buildTable(["Ukazatel", "Celkem", "Z toho dívek"], toAdmissionRows(section04Data.firstGradeEnrollmentNextYear)));

  blocks.push(buildHeading("4.5 Zvláštní zápis"));
  blocks.push(buildTable(["Ukazatel", "Celkem", "Z toho dívek"], [["Přijaté děti", integerOrDash(section04Data.specialEnrollment.admittedTotal), integerOrDash(section04Data.specialEnrollment.admittedGirls)]]));

  const knownTypes: Array<{ display: string; keys: string[] }> = [
    { display: "Víceleté gymnázium", keys: ["víceleté gymnázium", "vícelete gymnazium"] },
    { display: "Úplné střední všeobecné vzdělání", keys: ["úplné střední všeobecné vzdělání", "uplne stredni vseobecne vzdelani"] },
    {
      display: "Úplné střední odborné vzdělání s maturitou",
      keys: ["úplné střední odborné vzdělání s maturitou", "uplne stredni odborne vzdelani s maturitou"],
    },
    {
      display: "Úplné střední odborné vzdělání s vyučením i maturitou",
      keys: [
        "úplné střední odborné vzdělání s vyučením i maturitou",
        "uplne stredni odborne vzdelani s vyucenim i maturitou",
      ],
    },
    {
      display: "Střední odborné vzdělání s výučním listem",
      keys: ["střední odborné vzdělání s výučním listem", "stredni odborne vzdelani s vyucnim listem"],
    },
    { display: "Nehlásí se nikam", keys: ["nehlásí se nikam", "nehlasi se nikam"] },
  ];
  const knownByKey = new Map<string, { display: string; index: number }>();
  knownTypes.forEach((item, index) => {
    item.keys.forEach((key) => knownByKey.set(normalizeSecondarySchoolTypeKey(key), { display: item.display, index }));
  });
  const knownBuckets = new Map<number, { label: string; count?: number }>();
  const customBuckets = new Map<string, { label: string; count?: number }>();
  section04Data.secondarySchoolAdmissions.forEach((row) => {
    if (!hasAnyText(row.schoolType)) return;
    const normalized = normalizeSecondarySchoolTypeKey(row.schoolType);
    const known = knownByKey.get(normalized);
    if (known) {
      const existing = knownBuckets.get(known.index);
      knownBuckets.set(known.index, {
        label: known.display,
        count: row.count ?? existing?.count,
      });
      return;
    }
    const existingCustom = customBuckets.get(normalized);
    customBuckets.set(normalized, {
      label: existingCustom?.label ?? row.schoolType,
      count: row.count ?? existingCustom?.count,
    });
  });
  const admissionRows: string[][] = [];
  knownTypes.forEach((_, index) => {
    const bucket = knownBuckets.get(index);
    if (!bucket) return;
    admissionRows.push([bucket.label, integerOrDash(bucket.count)]);
  });
  [...customBuckets.values()].forEach((bucket) => {
    admissionRows.push([bucket.label, integerOrDash(bucket.count)]);
  });
  if (hasAnyRows(admissionRows)) {
    blocks.push(buildHeading("4.6 Žáci přijati ke vzdělávání do střední školy"));
    blocks.push(buildTable(["Typ navazujícího vzdělávání", "Počet žáků"], admissionRows));
  }

  const pupilRowsSep = buildPupilCountDocxRows(section04Data.pupilCountsSeptember);
  if (hasAnyRows(pupilRowsSep.tableRows)) {
    blocks.push(buildHeading("4.7 Počty žáků"));
    blocks.push({ type: "paragraph", text: "Počty žáků k 1. září" });
    blocks.push(
      buildTable(["Třída", "Chlapců", "Dívek", "Celkem", "Třídní učitel"], pupilRowsSep.tableRows, {
        boldBodyRowIndices: pupilRowsSep.boldBodyRowIndices,
      }),
    );
  }

  const pupilRowsJune = buildPupilCountDocxRows(section04Data.pupilCountsJune);
  if (hasAnyRows(pupilRowsJune.tableRows)) {
    if (!hasAnyRows(pupilRowsSep.tableRows)) {
      blocks.push(buildHeading("4.7 Počty žáků"));
    }
    blocks.push({ type: "paragraph", text: "Počty žáků k 30. červnu" });
    blocks.push(
      buildTable(["Třída", "Chlapců", "Dívek", "Celkem", "Třídní učitel"], pupilRowsJune.tableRows, {
        boldBodyRowIndices: pupilRowsJune.boldBodyRowIndices,
      }),
    );
  }
  return blocks;
}

function goalLevelLabel(level: Section05GoalLevel | undefined): string {
  if (!level) return "—";
  const labels: Record<Section05GoalLevel, string> = {
    VETSINA_HODIN: "Objevuje se ve většině hodin a činností",
    NEKTERE_HODINY: "Objevuje se pouze v některých hodinách a činnostech",
    NEOBJEVUJE_SE: "V hodinách a činnostech se neobjevuje",
  };
  return labels[level];
}

function buildSection52CurriculumBlocks(section05Data: AnnualReportSection05Data): DocxStructuredBlock[] {
  const advancedRows = section05Data.schoolCurriculumPlan.advancedCurriculumPlan?.rows ?? [];
  const advancedRowsWithData = advancedRows.filter(
    (row) =>
      hasAnyText(row.educationalArea) ||
      hasAnyText(row.subject) ||
      (row.subjectDetails ?? []).some((detail) => hasAnyText(detail)) ||
      hasAnyText(row.grade1) ||
      hasAnyText(row.grade2) ||
      hasAnyText(row.grade3) ||
      hasAnyText(row.grade4) ||
      hasAnyText(row.grade5) ||
      hasAnyText(row.firstStageAllocation) ||
      hasAnyText(row.grade6) ||
      hasAnyText(row.grade7) ||
      hasAnyText(row.grade8) ||
      hasAnyText(row.grade9) ||
      hasAnyText(row.secondStageAllocation) ||
      row.isTotalRow === true,
  );
  if (advancedRowsWithData.length > 0) {
    const boldBodyRowIndices: number[] = [];
    const rows = advancedRowsWithData.map((row, index) => {
      if (row.isTotalRow) boldBodyRowIndices.push(index);
      return [
        textOrEmpty(row.educationalArea),
        [textOrEmpty(row.subject), ...(row.subjectDetails ?? []).map((detail) => detail.trim()).filter(Boolean)].filter(Boolean).join("\n"),
        textOrEmpty(row.grade1),
        textOrEmpty(row.grade2),
        textOrEmpty(row.grade3),
        textOrEmpty(row.grade4),
        textOrEmpty(row.grade5),
        textOrEmpty(row.firstStageAllocation),
        textOrEmpty(row.grade6),
        textOrEmpty(row.grade7),
        textOrEmpty(row.grade8),
        textOrEmpty(row.grade9),
        textOrEmpty(row.secondStageAllocation),
      ];
    });
    return [
      buildHeading("5.2 Učební plán školy"),
      buildTable(
        [
          "Vzdělávací oblast",
          "Předmět",
          "1. r.",
          "2. r.",
          "3. r.",
          "4. r.",
          "5. r.",
          "Dotace I.",
          "6. r.",
          "7. r.",
          "8. r.",
          "9. r.",
          "Dotace II.",
        ],
        rows,
        {
          layout: "wide",
          boldBodyRowIndices,
          pageOrientation: "landscape",
          columnWidthsPercent: [12, 14, 5, 5, 5, 5, 5, 7, 5, 5, 5, 5, 7],
        },
      ),
    ];
  }

  const rows = (section05Data.schoolCurriculumPlan.weeklyHourPlan ?? []).filter((row) => hasAnyText(row.subject)).map((row) => [
    row.subject,
    integerOrDash(row.grade1),
    integerOrDash(row.grade2),
    integerOrDash(row.grade3),
    integerOrDash(row.grade4),
    integerOrDash(row.grade5),
    integerOrDash(row.grade6),
    integerOrDash(row.grade7),
    integerOrDash(row.grade8),
    integerOrDash(row.grade9),
  ]);
  if (!hasAnyRows(rows)) return [];
  return [
    buildHeading("5.2 Učební plán školy"),
    buildTable(
      ["Předmět", "1. r.", "2. r.", "3. r.", "4. r.", "5. r.", "6. r.", "7. r.", "8. r.", "9. r."],
      rows,
      { layout: "wide" },
    ),
  ];
}

function buildSection53GoalsBlocks(section05Data: AnnualReportSection05Data): DocxStructuredBlock[] {
  const blocks: DocxStructuredBlock[] = [];
  const goalRows = section05Data.goalsEvaluation
    .filter((row) => hasAnyText(row.goal))
    .map((row) => [row.goal.trim(), goalLevelLabel(row.level), textOrDash(row.evidence), textOrDash(row.note)]);
  if (hasAnyRows(goalRows)) {
    blocks.push(buildHeading("5.3 Naplňování cílů"));
    blocks.push(
      buildTable(["Cíl", "Míra naplňování", "Důkaz / příklad z praxe", "Poznámka"], goalRows, {
        layout: "wide",
        columnWidthsPercent: [24, 22, 30, 24],
      }),
    );
  }

  const summaryRows: string[][] = [];
  if (hasAnyText(section05Data.overallEvaluation)) {
    summaryRows.push(["Celkové vyhodnocení", section05Data.overallEvaluation!.trim()]);
  }
  if (hasAnyText(section05Data.strengths)) {
    summaryRows.push(["Silné stránky", section05Data.strengths!.trim()]);
  }
  if (hasAnyText(section05Data.areasForImprovement)) {
    summaryRows.push(["Oblasti ke zlepšení", section05Data.areasForImprovement!.trim()]);
  }
  if (hasAnyText(section05Data.measuresForNextYear)) {
    summaryRows.push(["Opatření pro další školní rok", section05Data.measuresForNextYear!.trim()]);
  }
  if (hasAnyRows(summaryRows)) {
    blocks.push(buildTable(["Položka", "Text"], summaryRows, { columnWidthsPercent: [28, 72] }));
  }

  return blocks;
}

function buildSection05DocxTables(section05Data: AnnualReportSection05Data): DocxStructuredBlock[] {
  return [...buildSection52CurriculumBlocks(section05Data), ...buildSection53GoalsBlocks(section05Data)];
}

function buildClassResultRows(rows: AnnualReportSection06ClassResultRow[]): string[][] {
  return rows
    .filter((row) => hasAnyText(row.className))
    .map((row) => [
      row.className,
      integerOrDash(row.pupilsTotal),
      row.classTeacher ?? "—",
      integerOrDash(row.passedWithHonours),
      integerOrDash(row.passed),
      integerOrDash(row.failed),
      integerOrDash(row.notAssessed),
      integerOrDash(row.reducedConductGrade),
      decimalOrDash(row.averageGrade, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      decimalOrDash(row.excusedAbsencePerPupil, { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
      decimalOrDash(row.unexcusedAbsencePerPupil, { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
    ]);
}

function buildSection06DocxTables(section06Data: AnnualReportSection06Data): DocxStructuredBlock[] {
  const blocks: DocxStructuredBlock[] = [];
  const headers = [
    "Třída",
    "Žáků",
    "Třídní učitel",
    "Vyzn.",
    "Prospěl",
    "Neprospěl",
    "Nehodn.",
    "Sn. chov.",
    "Průměr",
    "Oml. abs./žák",
    "Neoml. abs./žák",
  ];
  const firstRows = buildClassResultRows(section06Data.firstTermClassResults);
  if (hasAnyRows(firstRows)) {
    blocks.push(buildHeading("6.1 Souhrnná statistika tříd 1. pololetí školního roku"));
    blocks.push(buildTable(headers, firstRows, { layout: "wide" }));
  }
  const secondRows = buildClassResultRows(section06Data.secondTermClassResults);
  if (hasAnyRows(secondRows)) {
    blocks.push(buildHeading("6.2 Souhrnná statistika tříd 2. pololetí školního roku"));
    blocks.push(buildTable(headers, secondRows, { layout: "wide" }));
  }

  blocks.push(buildHeading("6.3 Výchovná opatření"));
  blocks.push(
    buildTable(
      ["Výchovné opatření", "1. pololetí", "2. pololetí"],
      [
        ["Pochvala třídního učitele", integerOrDash(section06Data.educationalMeasures.firstTerm?.classTeacherPraise), integerOrDash(section06Data.educationalMeasures.secondTerm?.classTeacherPraise)],
        ["Pochvala ředitele školy", integerOrDash(section06Data.educationalMeasures.firstTerm?.principalPraise), integerOrDash(section06Data.educationalMeasures.secondTerm?.principalPraise)],
        ["Napomenutí třídního učitele", integerOrDash(section06Data.educationalMeasures.firstTerm?.classTeacherWarning), integerOrDash(section06Data.educationalMeasures.secondTerm?.classTeacherWarning)],
        ["Důtka třídního učitele", integerOrDash(section06Data.educationalMeasures.firstTerm?.classTeacherReprimand), integerOrDash(section06Data.educationalMeasures.secondTerm?.classTeacherReprimand)],
        ["Důtka ředitele školy", integerOrDash(section06Data.educationalMeasures.firstTerm?.principalReprimand), integerOrDash(section06Data.educationalMeasures.secondTerm?.principalReprimand)],
        ["2. stupeň z chování", integerOrDash(section06Data.educationalMeasures.firstTerm?.secondConductGrade), integerOrDash(section06Data.educationalMeasures.secondTerm?.secondConductGrade)],
        ["3. stupeň z chování", integerOrDash(section06Data.educationalMeasures.firstTerm?.thirdConductGrade), integerOrDash(section06Data.educationalMeasures.secondTerm?.thirdConductGrade)],
      ],
    ),
  );
  return blocks;
}

function buildSection07DocxTables(section07Data: AnnualReportSection07Data): DocxStructuredBlock[] {
  const blocks: DocxStructuredBlock[] = [];

  const preventionSummaryRows = [
    ["Popis preventivní strategie školy", textOrDash(section07Data.prevention.preventionStrategyDescription)],
    ["Preventivní tým / odpovědné osoby", textOrDash(section07Data.prevention.preventionTeam)],
    ["Spolupráce s institucemi", textOrDash(section07Data.prevention.cooperation)],
    ["Vyhodnocení prevence", textOrDash(section07Data.prevention.evaluation)],
  ];
  blocks.push(buildHeading("7.1 Prevence sociálně patologických jevů a rizikového chování"));
  blocks.push(buildTable(["Oblast", "Popis"], preventionSummaryRows, { columnWidthsPercent: [32, 68] }));

  const preventionProgramRows = (section07Data.prevention.preventionProgrammes ?? [])
    .filter(
      (row) =>
        hasAnyText(row.title) ||
        hasAnyText(row.targetGroup) ||
        hasAnyText(row.description) ||
        hasAnyText(row.dateOrPeriod) ||
        hasAnyText(row.provider),
    )
    .map((row) => [textOrDash(row.title), textOrDash(row.targetGroup), textOrDash(row.description), textOrDash(row.dateOrPeriod), textOrDash(row.provider)]);
  if (hasAnyRows(preventionProgramRows)) {
    blocks.push({ type: "paragraph", text: "Preventivní programy a aktivity" });
    blocks.push(
      buildTable(
        ["Název programu/aktivity", "Cílová skupina", "Popis", "Období", "Poskytovatel"],
        preventionProgramRows,
        {
          layout: "wide",
          columnWidthsPercent: [18, 12, 34, 12, 24],
        },
      ),
    );
  }

  const riskRows = section07Data.riskBehaviourIncidents
    .filter((row) => hasAnyText(row.type) || row.count !== undefined || hasAnyText(row.adoptedMeasures) || hasAnyText(row.note))
    .map((row) => [textOrDash(row.type), integerOrDash(row.count), textOrDash(row.adoptedMeasures), textOrEmpty(row.note)]);
  if (hasAnyRows(riskRows)) {
    blocks.push(buildHeading("7.2 Počet výskytu rizikového chování, které škola řešila, a přijatá opatření"));
    blocks.push(
      buildTable(
        ["Typ rizikového chování", "Počet řešených případů", "Přijatá opatření", "Poznámka"],
        riskRows,
        { layout: "wide" },
      ),
    );
  }

  blocks.push(buildHeading("7.3 Počty žáků se speciálními vzdělávacími potřebami"));
  blocks.push(
    buildTable(
      ["Ukazatel", "Počet"],
      [
        ["Žáci se SVP celkem", integerOrDash(section07Data.pupilsWithSupportNeeds.pupilsWithSvpTotal)],
        ["Žáci s podpůrnými opatřeními", integerOrDash(section07Data.pupilsWithSupportNeeds.pupilsWithSupportMeasures)],
        ["Žáci s IVP", integerOrDash(section07Data.pupilsWithSupportNeeds.pupilsWithIndividualEducationPlan)],
        ["Žáci s pedagogickou intervencí", integerOrDash(section07Data.pupilsWithSupportNeeds.pupilsWithPedagogicalIntervention)],
        ["Žáci s podporou asistenta pedagoga", integerOrDash(section07Data.pupilsWithSupportNeeds.pupilsWithTeachingAssistantSupport)],
        ["Nadaní žáci", integerOrDash(section07Data.pupilsWithSupportNeeds.pupilsGifted)],
        ["Mimořádně nadaní žáci", integerOrDash(section07Data.pupilsWithSupportNeeds.pupilsExceptionallyGifted)],
      ],
    ),
  );

  blocks.push(buildHeading("7.4 Podmínky pro vzdělávání a zajištění podpory"));
  blocks.push(
    buildTable(
      ["Oblast", "Popis"],
      [
        ["Popis práce školního poradenského pracoviště", textOrDash(section07Data.supportConditions.counsellingWorkplaceDescription)],
        ["Spolupráce s PPP/SPC", textOrDash(section07Data.supportConditions.cooperationWithPppSpc)],
        ["Popis podpůrných opatření", textOrDash(section07Data.supportConditions.supportMeasuresDescription)],
        ["Inkluzivní opatření", textOrDash(section07Data.supportConditions.inclusionMeasures)],
        ["Podpora nadaných a mimořádně nadaných žáků", textOrDash(section07Data.supportConditions.giftedSupportDescription)],
        ["Podpora asistenty pedagoga", textOrDash(section07Data.supportConditions.teachingAssistantSupportDescription)],
        ["Materiální a organizační podmínky", textOrDash(section07Data.supportConditions.materialAndOrganizationalConditions)],
        ["Vyhodnocení podpory", textOrDash(section07Data.supportConditions.evaluation)],
      ],
    ),
  );

  const languagePreparationValue =
    section07Data.languagePreparation.languagePreparationProvided === "ANO"
      ? "ano"
      : section07Data.languagePreparation.languagePreparationProvided === "NE"
        ? "ne"
        : section07Data.languagePreparation.languagePreparationProvided === "NERELEVANTNI"
          ? "nerelevantní"
          : "—";
  blocks.push(buildHeading("7.5 Zajištění podpory žáků s nárokem na poskytování jazykové přípravy"));
  blocks.push(
    buildTable(
      ["Údaj", "Hodnota"],
      [
        [
          "Počet žáků s nárokem na jazykovou přípravu",
          integerOrDash(section07Data.languagePreparation.pupilsWithLanguagePreparationEntitlement),
        ],
        ["Poskytování jazykové přípravy", languagePreparationValue],
        ["Popis zajištění jazykové přípravy", textOrDash(section07Data.languagePreparation.description)],
        ["Poskytovatel", textOrDash(section07Data.languagePreparation.provider)],
        ["Poznámka", textOrDash(section07Data.languagePreparation.note)],
      ],
    ),
  );

  return blocks;
}

function mapCompleted(value: "ANO" | "NE" | "PROBIHA" | undefined): string {
  if (value === "ANO") return "ANO";
  if (value === "NE") return "NE";
  if (value === "PROBIHA") return "PROBÍHÁ";
  return "—";
}

function buildSection08DocxTables(section08Data: AnnualReportSection08Data): DocxStructuredBlock[] {
  const blocks: DocxStructuredBlock[] = [];
  const overviewRows: string[][] = [];
  if (hasAnyText(section08Data.dvppOverview.description)) overviewRows.push(["Popis DVPP ve školním roce", section08Data.dvppOverview.description!.trim()]);
  if (hasAnyText(section08Data.dvppOverview.priorities)) overviewRows.push(["Priority DVPP", section08Data.dvppOverview.priorities!.trim()]);
  if (hasAnyText(section08Data.dvppOverview.evaluation)) overviewRows.push(["Vyhodnocení DVPP", section08Data.dvppOverview.evaluation!.trim()]);
  if (hasAnyRows(overviewRows)) {
    blocks.push(buildHeading("8.1 Další vzdělávání pedagogických pracovníků"));
    blocks.push(buildTable(["Oblast", "Popis"], overviewRows));
  }

  const qualificationRows = section08Data.qualificationStudies
    .filter((row) => hasAnyText(row.title) || hasAnyText(row.participantGroup) || hasAnyText(row.provider) || hasAnyText(row.period) || row.completed || hasAnyText(row.note))
    .map((row) => [row.title || "—", row.participantGroup || "—", row.provider || "—", row.period || "—", mapCompleted(row.completed), row.note || "—"]);
  if (hasAnyRows(qualificationRows)) {
    blocks.push(buildHeading("8.1.1 Studium ke splnění kvalifikačních předpokladů"));
    blocks.push(buildTable(["Název studia", "Účastníci", "Poskytovatel", "Období", "Dokončeno", "Poznámka"], qualificationRows));
  }

  const additionalRows = section08Data.additionalQualificationStudies
    .filter((row) => hasAnyText(row.title) || hasAnyText(row.participantGroup) || hasAnyText(row.provider) || hasAnyText(row.period) || row.completed || hasAnyText(row.note))
    .map((row) => [row.title || "—", row.participantGroup || "—", row.provider || "—", row.period || "—", mapCompleted(row.completed), row.note || "—"]);
  if (hasAnyRows(additionalRows)) {
    blocks.push(buildHeading("8.1.2 Studium ke splnění dalších kvalifikačních předpokladů"));
    blocks.push(buildTable(["Název studia", "Účastníci", "Poskytovatel", "Období", "Dokončeno", "Poznámka"], additionalRows));
  }

  const trainingRows = section08Data.professionalDevelopmentTrainings
    .filter((row) => hasAnyText(row.title) || hasAnyText(row.topic) || hasAnyText(row.participantGroup) || hasAnyText(row.provider) || hasAnyText(row.period) || row.hours !== undefined)
    .map((row) => [row.title || "—", row.topic || "—", row.participantGroup || "—", row.provider || "—", row.period || "—", integerOrDash(row.hours)]);
  if (hasAnyRows(trainingRows)) {
    blocks.push(buildHeading("8.1.3 Studium k prohlubování odborné kvalifikace"));
    blocks.push(buildTable(["Název vzdělávání", "Téma", "Účastníci", "Poskytovatel", "Období", "Počet hodin"], trainingRows));
  }

  const nonTeachingRows = section08Data.nonTeachingStaffDevelopment
    .filter((row) => hasAnyText(row.title) || hasAnyText(row.staffGroup) || hasAnyText(row.provider) || hasAnyText(row.period) || row.hours !== undefined)
    .map((row) => [row.title || "—", row.staffGroup || "—", row.provider || "—", row.period || "—", integerOrDash(row.hours)]);
  if (hasAnyRows(nonTeachingRows)) {
    blocks.push(buildHeading("8.2 Odborný rozvoj nepedagogických pracovníků"));
    blocks.push(buildTable(["Název vzdělávání", "Skupina pracovníků", "Poskytovatel", "Období", "Počet hodin"], nonTeachingRows));
  }
  return blocks;
}

function mapPublicEvent(value: "ANO" | "NE" | "CASTECNE" | undefined): string {
  if (value === "ANO") return "ANO";
  if (value === "NE") return "NE";
  if (value === "CASTECNE") return "ČÁSTEČNĚ";
  return "—";
}

function buildSection09DocxTables(section09Data: AnnualReportSection09Data): DocxStructuredBlock[] {
  const blocks: DocxStructuredBlock[] = [];
  const eventRows = section09Data.schoolEvents
    .filter((row) => hasAnyText(row.title) || hasAnyText(row.dateOrPeriod) || hasAnyText(row.eventType))
    .map((row) => [
      row.dateOrPeriod || "—",
      row.title || "—",
      row.eventType || "—",
      row.targetGroup || "—",
      row.location || "—",
      mapPublicEvent(row.publicEvent),
      row.description || "—",
    ]);
  if (hasAnyRows(eventRows)) {
    blocks.push(buildHeading("9.1 Akce školy"));
    blocks.push(
      buildTable(
        ["Datum/období", "Název akce", "Typ", "Určeno pro", "Místo", "Veřejná akce", "Popis"],
        eventRows,
        { layout: "wide" },
      ),
    );
  }

  const competitionRows = section09Data.competitions
    .filter((row) => hasAnyText(row.title) || hasAnyText(row.dateOrPeriod) || hasAnyText(row.subjectOrArea))
    .map((row) => [row.dateOrPeriod || "—", row.title || "—", row.subjectOrArea || "—", row.participants || "—", row.result || "—", row.level || "—"]);
  if (hasAnyRows(competitionRows)) {
    blocks.push(buildHeading("9.2 Účast žáků na soutěžích"));
    blocks.push(
      buildTable(
        ["Datum/období", "Název soutěže", "Oblast", "Účastníci", "Výsledek", "Úroveň"],
        competitionRows,
        { layout: "wide" },
      ),
    );
  }

  const projectRows = section09Data.projectsAndCooperation
    .filter((row) => hasAnyText(row.title) || hasAnyText(row.type) || hasAnyText(row.partner))
    .map((row) => [row.title || "—", row.type || "—", row.partner || "—", row.period || "—", row.output || "—"]);
  const presentationRows: string[][] = [];
  if (hasAnyText(section09Data.publicPresentation.description)) presentationRows.push(["Popis prezentace školy", section09Data.publicPresentation.description!.trim()]);
  if (hasAnyText(section09Data.publicPresentation.website)) presentationRows.push(["Web školy", section09Data.publicPresentation.website!.trim()]);
  if (hasAnyText(section09Data.publicPresentation.socialMedia))
    presentationRows.push(["Sociální sítě / online komunikace", section09Data.publicPresentation.socialMedia!.trim()]);
  if (hasAnyText(section09Data.publicPresentation.mediaOutputs)) presentationRows.push(["Mediální výstupy", section09Data.publicPresentation.mediaOutputs!.trim()]);
  if (hasAnyText(section09Data.publicPresentation.cooperationWithCommunity))
    presentationRows.push(["Spolupráce s obcí, zřizovatelem a veřejností", section09Data.publicPresentation.cooperationWithCommunity!.trim()]);

  if (hasAnyRows(projectRows) || hasAnyRows(presentationRows)) {
    blocks.push(buildHeading("9.3 Projekty, spolupráce a prezentace školy na veřejnosti"));
    if (hasAnyRows(projectRows)) {
      blocks.push(
        buildTable(
          ["Název", "Typ", "Partner", "Období", "Výstup"],
          projectRows,
          { layout: "wide" },
        ),
      );
      section09Data.projectsAndCooperation
        .filter((row) => hasAnyText(row.title) && hasAnyText(row.description))
        .forEach((row) => {
          blocks.push({ type: "paragraph", text: `Popis projektu „${row.title.trim()}“: ${row.description!.trim()}` });
        });
    }
    if (hasAnyRows(presentationRows)) {
      blocks.push(buildTable(["Oblast", "Popis"], presentationRows));
    }
  }
  return blocks;
}

function buildSection11DocxTables(section11Data: AnnualReportSection11Data): DocxStructuredBlock[] {
  const warnings: string[] = [];
  if ((section11Data.economicResult.profitOrLoss ?? 0) < 0) {
    warnings.push("Hospodářský výsledek: záporná hodnota vyžaduje ověření.");
  }
  if ((section11Data.economicResult.mainActivityResult ?? 0) < 0) {
    warnings.push("Výsledek hlavní činnosti: záporná hodnota vyžaduje ověření.");
  }
  const blocks: DocxStructuredBlock[] = [
    buildHeading("11.1 Přehled příjmů a výdajů školy"),
    { type: "paragraph", text: "Příjmy/výnosy" },
    buildTable(
      ["Položka", "Částka"],
      [
        ["Příspěvek ze státního rozpočtu", formatCzechCzk(section11Data.revenue.stateBudgetContribution)],
        ["Příspěvek zřizovatele", formatCzechCzk(section11Data.revenue.founderContribution)],
        ["Dotace a projekty", formatCzechCzk(section11Data.revenue.grantsAndProjects)],
        ["Vlastní příjmy", formatCzechCzk(section11Data.revenue.ownRevenue)],
        ["Dary", formatCzechCzk(section11Data.revenue.donations)],
        ["Ostatní příjmy", formatCzechCzk(section11Data.revenue.otherRevenue)],
        ["Příjmy / výnosy celkem", formatCzechCzk(section11Data.revenue.totalRevenue)],
      ],
    ),
    { type: "paragraph", text: "Výdaje/náklady" },
    buildTable(
      ["Položka", "Částka"],
      [
        ["Mzdové náklady", formatCzechCzk(section11Data.expenses.salaryCosts)],
        ["Zákonné odvody", formatCzechCzk(section11Data.expenses.statutoryContributions)],
        ["Provozní náklady", formatCzechCzk(section11Data.expenses.operatingCosts)],
        ["Energie", formatCzechCzk(section11Data.expenses.energyCosts)],
        ["Opravy a údržba", formatCzechCzk(section11Data.expenses.repairsAndMaintenance)],
        ["Vybavení a materiál", formatCzechCzk(section11Data.expenses.equipmentAndMaterials)],
        ["Služby", formatCzechCzk(section11Data.expenses.services)],
        ["Výdaje projektů a dotací", formatCzechCzk(section11Data.expenses.grantsAndProjectsExpenses)],
        ["Ostatní výdaje", formatCzechCzk(section11Data.expenses.otherExpenses)],
        ["Výdaje / náklady celkem", formatCzechCzk(section11Data.expenses.totalExpenses)],
      ],
    ),
    buildHeading("11.2 Hospodářský výsledek"),
    buildTable(
      ["Ukazatel", "Částka"],
      [
        ["Hospodářský výsledek", formatCzechCzk(section11Data.economicResult.profitOrLoss)],
        ["Výsledek hlavní činnosti", formatCzechCzk(section11Data.economicResult.mainActivityResult)],
        ["Výsledek doplňkové činnosti", formatCzechCzk(section11Data.economicResult.supplementaryActivityResult)],
        ["Příděl do rezervního fondu", formatCzechCzk(section11Data.economicResult.reserveFundAllocation)],
        [
          "Orientační výsledek z uvedených celkových příjmů a výdajů",
          section11Data.revenue.totalRevenue === undefined || section11Data.expenses.totalExpenses === undefined
            ? "neuvedeno"
            : formatCzechCzk(section11Data.revenue.totalRevenue - section11Data.expenses.totalExpenses),
        ],
      ],
    ),
  ];

  const grantsRows = section11Data.grantsAndSubsidies
    .filter((row) => hasAnyText(row.title) || hasAnyText(row.provider) || row.amount !== undefined || row.usedAmount !== undefined || hasAnyText(row.purpose))
    .map((row) => [row.title || "—", row.provider || "—", row.amount === undefined ? "—" : formatCzechCzk(row.amount), row.purpose || "—", row.usedAmount === undefined ? "—" : formatCzechCzk(row.usedAmount)]);
  if (hasAnyRows(grantsRows)) {
    blocks.push(buildHeading("11.3 Dotace, granty a projekty"));
    blocks.push(buildTable(["Název", "Poskytovatel", "Částka", "Účel", "Čerpáno"], grantsRows));
  }

  const supplementaryRows: string[][] = [
    ["Doplňková činnost vykonávána", section11Data.supplementaryActivity.carriedOut ?? "NEUVEDENO"],
    ["Popis doplňkové činnosti", section11Data.supplementaryActivity.description || "—"],
    ["Výnosy doplňkové činnosti", section11Data.supplementaryActivity.revenue === undefined ? "—" : formatCzechCzk(section11Data.supplementaryActivity.revenue)],
    ["Náklady doplňkové činnosti", section11Data.supplementaryActivity.expenses === undefined ? "—" : formatCzechCzk(section11Data.supplementaryActivity.expenses)],
    ["Výsledek doplňkové činnosti", section11Data.supplementaryActivity.result === undefined ? "—" : formatCzechCzk(section11Data.supplementaryActivity.result)],
    ["Poznámka", section11Data.supplementaryActivity.note || "—"],
  ];
  if (supplementaryRows.some((row) => row[1] !== "—" && row[1] !== "NEUVEDENO")) {
    blocks.push(buildHeading("11.4 Doplňková činnost"));
    blocks.push(buildTable(["Ukazatel", "Hodnota"], supplementaryRows));
  }

  const investmentRows = section11Data.investmentsAndRepairs
    .filter((row) => hasAnyText(row.title) || row.amount !== undefined || hasAnyText(row.fundingSource) || hasAnyText(row.description))
    .map((row) => [row.title || "—", row.amount === undefined ? "—" : formatCzechCzk(row.amount), row.fundingSource || "—", row.description || "—"]);
  if (hasAnyRows(investmentRows)) {
    blocks.push(buildHeading("11.5 Investice, opravy a větší nákupy"));
    blocks.push(buildTable(["Název", "Částka", "Zdroj financování", "Popis"], investmentRows));
  }

  const commentaryRows: string[][] = [];
  if (hasAnyText(section11Data.summaryCommentary)) {
    commentaryRows.push(["Souhrnný komentář", section11Data.summaryCommentary!.trim()]);
  }
  if (warnings.length > 0) {
    warnings.forEach((warning) => commentaryRows.push(["Upozornění k ověření dat", warning]));
  }
  if (hasAnyRows(commentaryRows)) {
    blocks.push(buildHeading("11.6 Souhrnný komentář k hospodaření školy"));
    blocks.push(buildTable(["Položka", "Text"], commentaryRows));
  }
  return blocks;
}

export function getStructuredDocxBlocksForSection(
  sectionNumber: string,
  data: AnnualReportDocxStructuredData | undefined,
): DocxStructuredBlock[] {
  if (!data) return [];
  if (sectionNumber === "01" && data.schoolProfileData) return buildSection01DocxTables(data.schoolProfileData);
  if (sectionNumber === "03" && data.section03Data) return buildSection03DocxTables(data.section03Data);
  if (sectionNumber === "04" && data.section04Data) return buildSection04DocxTables(data.section04Data);
  if (sectionNumber === "05" && data.section05Data) return buildSection05DocxTables(data.section05Data);
  if (sectionNumber === "06" && data.section06Data) return buildSection06DocxTables(data.section06Data);
  if (sectionNumber === "07" && data.section07Data) return buildSection07DocxTables(data.section07Data);
  if (sectionNumber === "08" && data.section08Data) return buildSection08DocxTables(data.section08Data);
  if (sectionNumber === "09" && data.section09Data) return buildSection09DocxTables(data.section09Data);
  if (sectionNumber === "11" && data.section11Data) return buildSection11DocxTables(data.section11Data);
  return [];
}
