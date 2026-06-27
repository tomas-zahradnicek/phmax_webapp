import type { Section04GeneratorInput } from "./vyrocni-zprava-section04-generator-input";

export const SECTION04_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 04 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section04DraftResult = {
  ready: boolean;
  text: string;
};

function tableRow(label: string, total?: number, girls?: number): string {
  return `${label}: celkem ${total ?? "—"}, z toho dívek ${girls ?? "—"}.`;
}

function buildAdmissionSummary(summary: Section04GeneratorInput["firstGradeAdmissionCurrentYear"]): string {
  return [
    tableRow("Poprvé u zápisu", summary.firstTimeTotal, summary.firstTimeGirls),
    tableRow("Po odkladu", summary.afterDeferralTotal, summary.afterDeferralGirls),
    tableRow("Zapsaní", summary.enrolledTotal, summary.enrolledGirls),
    tableRow("Žádosti o odklad", summary.deferralRequestsTotal, summary.deferralRequestsGirls),
  ].join("\n");
}

function buildGradeCountList(rows: Section04GeneratorInput["pupilsAdmittedDuringYear"], emptyFallback: string): string {
  const filledRows = rows.filter((row) => row.grade);
  if (filledRows.length === 0) return emptyFallback;
  return filledRows.map((row) => `- ${row.grade}: ${row.count ?? "—"} žáků`).join("\n");
}

function buildSecondaryAdmissions(rows: Section04GeneratorInput["secondarySchoolAdmissions"]): string {
  const filledRows = rows.filter((row) => row.schoolType);
  if (filledRows.length === 0) return "Pro tuto podkapitolu nejsou v podkladech uvedeny doplňující údaje.";
  return filledRows.map((row) => `- ${row.schoolType}: ${row.count ?? "—"} žáků`).join("\n");
}

function buildPupilCountTable(title: string, rows: Section04GeneratorInput["pupilCountsSeptember"]): string {
  const filledRows = rows.filter((row) => row.className);
  if (filledRows.length === 0) {
    return `${title}\nPro tuto tabulku nejsou v podkladech uvedeny údaje.`;
  }
  const lines = [
    title,
    "Třída | Chlapci | Děvčata | Celkem | Třídní učitel",
    "--- | --- | --- | --- | ---",
  ];
  filledRows.forEach((row) => {
    lines.push(
      `${row.className} | ${row.boys ?? "—"} | ${row.girls ?? "—"} | ${row.total ?? "—"} | ${row.classTeacher ?? "—"}`,
    );
  });
  return lines.join("\n");
}

function buildIncompleteDraft(input: Section04GeneratorInput): string {
  const sections = [SECTION04_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
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

/** Deterministický návrh kapitoly 04 z validovaných vstupů – bez volání AI. */
export function generateSection04Draft(input: Section04GeneratorInput): Section04DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const sections = [
    "04 Údaje o přijímacím řízení nebo o zápisu k povinné školní docházce a následném přijetí do školy",
    "",
    input.schoolYear
      ? `Ve školním roce ${input.schoolYear} škola evidovala následující údaje k přijímacímu řízení, zápisu a přehledu počtů žáků.`
      : "Škola evidovala následující údaje k přijímacímu řízení, zápisu a přehledu počtů žáků.",
    "",
    "4.1 Žáci přijatí do 1. ročníku základní školy pro tento školní rok",
    buildAdmissionSummary(input.firstGradeAdmissionCurrentYear),
    "",
    "4.2 Žáci přijati v průběhu školního roku",
    buildGradeCountList(input.pupilsAdmittedDuringYear, "V průběhu školního roku nebyly uvedeny údaje o přijatých žácích."),
    "",
    "4.3 Žáci v průběhu školního roku odhlášeni",
    buildGradeCountList(input.pupilsLeftDuringYear, "V průběhu školního roku nebyly uvedeny údaje o odhlášených žácích."),
    "",
    "4.4 Zápis pro následující školní rok",
    buildAdmissionSummary(input.firstGradeEnrollmentNextYear),
    "",
    "4.5 Zvláštní zápis",
    tableRow("Počet přijatých dětí do prvních tříd", input.specialEnrollment.admittedTotal, input.specialEnrollment.admittedGirls),
    "",
    "4.6 Žáci přijati ke vzdělávání do střední školy",
    buildSecondaryAdmissions(input.secondarySchoolAdmissions),
    "",
    "4.7 Počty žáků",
    buildPupilCountTable("Počty žáků k 1. září", input.pupilCountsSeptember),
    "",
    buildPupilCountTable("Počty žáků k 30. červnu", input.pupilCountsJune),
  ];

  if (input.warnings.length > 0) {
    sections.push("", "Upozornění k ověření dat:");
    sections.push(...input.warnings.map((item) => `- ${item}`));
  }

  if (input.notes) {
    sections.push("", `Poznámka: ${input.notes}`);
  }

  return {
    ready: true,
    text: sections.join("\n"),
  };
}

export function isSection04IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION04_INCOMPLETE_DRAFT_PREFIX);
}
