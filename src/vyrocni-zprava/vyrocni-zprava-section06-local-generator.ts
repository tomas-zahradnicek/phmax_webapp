import type { Section06GeneratorInput } from "./vyrocni-zprava-section06-generator-input";
import type { AnnualReportSection06ClassResultRow, AnnualReportSection06EducationalMeasuresTerm } from "./vyrocni-zprava-section06-types";
import { formatCzechDecimal, formatCzechInteger } from "./vyrocni-zprava-number-formatting-helpers";

export const SECTION06_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 06 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section06DraftResult = {
  ready: boolean;
  text: string;
};

function buildIncompleteDraft(input: Section06GeneratorInput): string {
  const sections = [SECTION06_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
  if (input.recommendedData.length > 0) {
    sections.push("", "Doporučené doplňující údaje (negenerují blokaci kapitoly):");
    sections.push(...input.recommendedData.map((item) => `- ${item}`));
  }
  if (input.warnings.length > 0) {
    sections.push("", "Upozornění k ověření dat:");
    sections.push(...input.warnings.map((item) => `- ${item}`));
  }
  return sections.join("\n");
}

function buildClassResultsTable(title: string, rows: AnnualReportSection06ClassResultRow[]): string {
  const validRows = rows.filter((row) => row.className);
  if (validRows.length === 0) {
    return `${title}\nPro tuto podkapitolu nejsou v podkladech uvedeny údaje.`;
  }
  const lines = [
    title,
    "Třída | Počet žáků | Třídní učitel | Prospěl s vyznamenáním | Prospěl | Neprospěl | Nehodnocen | Snížená známka z chování | Průměrný prospěch | Omluvená absence na žáka | Neomluvená absence na žáka",
    "--- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---",
  ];
  validRows.forEach((row) => {
    const averageGrade = row.averageGrade === undefined ? "—" : formatCzechDecimal(row.averageGrade, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const excusedAbsence = row.excusedAbsencePerPupil === undefined ? "—" : formatCzechDecimal(row.excusedAbsencePerPupil, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
    const unexcusedAbsence = row.unexcusedAbsencePerPupil === undefined ? "—" : formatCzechDecimal(row.unexcusedAbsencePerPupil, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
    lines.push(
      `${row.className} | ${formatCzechInteger(row.pupilsTotal)} | ${row.classTeacher ?? "—"} | ${formatCzechInteger(row.passedWithHonours)} | ${formatCzechInteger(row.passed)} | ${formatCzechInteger(row.failed)} | ${formatCzechInteger(row.notAssessed)} | ${formatCzechInteger(row.reducedConductGrade)} | ${averageGrade} | ${excusedAbsence} | ${unexcusedAbsence}`,
    );
  });
  return lines.join("\n");
}

function buildMeasuresTerm(title: string, term?: AnnualReportSection06EducationalMeasuresTerm): string {
  const lines = [
    `${title}: pochvala třídního učitele ${formatCzechInteger(term?.classTeacherPraise)}, pochvala ředitele školy ${formatCzechInteger(term?.principalPraise)}, napomenutí třídního učitele ${formatCzechInteger(term?.classTeacherWarning)}, důtka třídního učitele ${formatCzechInteger(term?.classTeacherReprimand)}, důtka ředitele školy ${formatCzechInteger(term?.principalReprimand)}, 2. stupeň z chování ${formatCzechInteger(term?.secondConductGrade)}, 3. stupeň z chování ${formatCzechInteger(term?.thirdConductGrade)}.`,
  ];
  return lines.join("\n");
}

function hasExamData(input: Section06GeneratorInput): boolean {
  return Boolean(input.finalExams || input.maturitaExams || input.absolutorium);
}

function buildExamParagraph(label: string, exam?: Section06GeneratorInput["finalExams"]): string {
  if (!exam) return `${label}: údaje nejsou uvedeny.`;
  const parts = [
    `${label}:`,
    exam.description ? `popis ${exam.description}` : "popis neuveden",
    `počet žáků ${exam.pupilsTotal ?? "—"}`,
    `uspěli ${exam.passed ?? "—"}`,
    `neuspěli ${exam.failed ?? "—"}`,
  ];
  if (exam.note) parts.push(`poznámka ${exam.note}`);
  return parts.join(", ") + ".";
}

/** Deterministický návrh kapitoly 06 z validovaných vstupů – bez volání AI. */
export function generateSection06Draft(input: Section06GeneratorInput): Section06DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const sections = [
    "06 Údaje o výsledcích vzdělávání žáků podle cílů stanovených vzdělávacími programy a podle poskytovaného stupně vzdělání",
    "",
    input.schoolYear
      ? `Ve školním roce ${input.schoolYear} byly na základě poskytnutých podkladů zpracovány následující údaje o výsledcích vzdělávání žáků.`
      : "Na základě poskytnutých podkladů byly zpracovány následující údaje o výsledcích vzdělávání žáků.",
    "",
    "6.1 Souhrnná statistika tříd 1. pololetí školního roku",
    buildClassResultsTable("Výsledky tříd v 1. pololetí", input.firstTermClassResults),
    "",
    "6.2 Souhrnná statistika tříd 2. pololetí školního roku",
    buildClassResultsTable("Výsledky tříd v 2. pololetí", input.secondTermClassResults),
    "",
    "6.3 Výchovná opatření",
    buildMeasuresTerm("1. pololetí", input.educationalMeasures.firstTerm),
    buildMeasuresTerm("2. pololetí", input.educationalMeasures.secondTerm),
    "",
    `Souhrnné vyhodnocení: ${input.summaryEvaluation}`,
  ];

  if (hasExamData(input)) {
    sections.push(
      "",
      "6.4 Výsledky závěrečných zkoušek, maturitních zkoušek a absolutorií",
      buildExamParagraph("Závěrečné zkoušky", input.finalExams),
      buildExamParagraph("Maturitní zkoušky", input.maturitaExams),
      buildExamParagraph("Absolutorium", input.absolutorium),
    );
  }

  if (input.notes) {
    sections.push("", `Poznámky: ${input.notes}`);
  }

  if (input.warnings.length > 0) {
    sections.push("", "Upozornění k ověření dat:");
    sections.push(...input.warnings.map((item) => `- ${item}`));
  }

  return {
    ready: true,
    text: sections.join("\n"),
  };
}

export function isSection06IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION06_INCOMPLETE_DRAFT_PREFIX);
}
