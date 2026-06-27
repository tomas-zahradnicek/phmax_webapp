import type { AnnualReportPersonnelData } from "../vyrocni-zprava-personnel-types";
import type { AnnualReportSection04Data } from "../vyrocni-zprava-section04-types";
import type { AnnualReportSection05Data } from "../vyrocni-zprava-section05-types";
import type { AnnualReportSection06ClassResultRow, AnnualReportSection06Data } from "../vyrocni-zprava-section06-types";
import type { AnnualReportSection07Data } from "../vyrocni-zprava-section07-types";
import type { AnnualReportSection11Data } from "../vyrocni-zprava-section11-types";
import { formatCzechDecimal, formatCzechInteger, formatCzechCzk } from "../vyrocni-zprava-number-formatting-helpers";

export type DocxStructuredBlock =
  | { type: "heading"; text: string; level: 3 }
  | { type: "paragraph"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export type AnnualReportDocxStructuredData = {
  section03Data?: AnnualReportPersonnelData;
  section04Data?: AnnualReportSection04Data;
  section05Data?: AnnualReportSection05Data;
  section06Data?: AnnualReportSection06Data;
  section07Data?: AnnualReportSection07Data;
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

function buildTable(headers: string[], rows: string[][]): DocxStructuredBlock {
  return { type: "table", headers, rows };
}

function integerOrDash(value: number | undefined): string {
  return value === undefined ? "—" : formatCzechInteger(value);
}

function decimalOrDash(value: number | undefined, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }): string {
  return value === undefined ? "—" : formatCzechDecimal(value, options);
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
  blocks.push(buildHeading("3.2 Členění pedagogických zaměstnanců podle věku a pohlaví"));
  blocks.push(buildTable(["Věková skupina", "Muži", "Ženy", "Celkem"], row32));

  const education = section03Data.educationAndGender;
  const row33: string[][] = [
    ["Nižší než maturita", integerOrDash(education.belowMaturita.men), integerOrDash(education.belowMaturita.women), formatCzechInteger((education.belowMaturita.men ?? 0) + (education.belowMaturita.women ?? 0))],
    ["Maturita", integerOrDash(education.maturita.men), integerOrDash(education.maturita.women), formatCzechInteger((education.maturita.men ?? 0) + (education.maturita.women ?? 0))],
    ["Vyšší odborné vzdělání", integerOrDash(education.higherVocational.men), integerOrDash(education.higherVocational.women), formatCzechInteger((education.higherVocational.men ?? 0) + (education.higherVocational.women ?? 0))],
    ["Vysokoškolské vzdělání", integerOrDash(education.university.men), integerOrDash(education.university.women), formatCzechInteger((education.university.men ?? 0) + (education.university.women ?? 0))],
  ];
  blocks.push(buildHeading("3.3 Členění pedagogických zaměstnanců podle vzdělání a pohlaví"));
  blocks.push(buildTable(["Vzdělání", "Muži", "Ženy", "Celkem"], row33));

  const q = section03Data.qualification;
  const row34: string[][] = [
    ["Učitel 1. stupně", integerOrDash(q.primaryTeachers.qualified), integerOrDash(q.primaryTeachers.notQualified), formatCzechInteger((q.primaryTeachers.qualified ?? 0) + (q.primaryTeachers.notQualified ?? 0))],
    ["Učitel 2. stupně", integerOrDash(q.lowerSecondaryTeachers.qualified), integerOrDash(q.lowerSecondaryTeachers.notQualified), formatCzechInteger((q.lowerSecondaryTeachers.qualified ?? 0) + (q.lowerSecondaryTeachers.notQualified ?? 0))],
    ["Vychovatel", integerOrDash(q.educators.qualified), integerOrDash(q.educators.notQualified), formatCzechInteger((q.educators.qualified ?? 0) + (q.educators.notQualified ?? 0))],
    ["Asistent pedagoga", integerOrDash(q.teachingAssistants.qualified), integerOrDash(q.teachingAssistants.notQualified), formatCzechInteger((q.teachingAssistants.qualified ?? 0) + (q.teachingAssistants.notQualified ?? 0))],
    ["Speciální pedagog", integerOrDash(q.specialPedagogues.qualified), integerOrDash(q.specialPedagogues.notQualified), formatCzechInteger((q.specialPedagogues.qualified ?? 0) + (q.specialPedagogues.notQualified ?? 0))],
  ];
  blocks.push(buildHeading("3.4 Členění pedagogických pracovníků podle odborné kvalifikace"));
  blocks.push(buildTable(["Kategorie", "Splňuje kvalifikaci", "Nesplňuje kvalifikaci", "Celkem"], row34));
  return blocks;
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

  const leftRows = section04Data.pupilsLeftDuringYear.filter((row) => hasAnyText(row.grade)).map((row) => [row.grade, integerOrDash(row.count)]);
  if (hasAnyRows(leftRows)) {
    blocks.push(buildHeading("4.3 Žáci v průběhu školního roku odhlášeni"));
    blocks.push(buildTable(["Ročník", "Počet žáků"], leftRows));
  }

  blocks.push(buildHeading("4.4 Zápis pro následující školní rok"));
  blocks.push(buildTable(["Ukazatel", "Celkem", "Z toho dívek"], toAdmissionRows(section04Data.firstGradeEnrollmentNextYear)));

  blocks.push(buildHeading("4.5 Zvláštní zápis"));
  blocks.push(buildTable(["Ukazatel", "Celkem", "Z toho dívek"], [["Přijaté děti", integerOrDash(section04Data.specialEnrollment.admittedTotal), integerOrDash(section04Data.specialEnrollment.admittedGirls)]]));

  const admissionRows = section04Data.secondarySchoolAdmissions.filter((row) => hasAnyText(row.schoolType)).map((row) => [row.schoolType, integerOrDash(row.count)]);
  if (hasAnyRows(admissionRows)) {
    blocks.push(buildHeading("4.6 Žáci přijati ke vzdělávání do střední školy"));
    blocks.push(buildTable(["Typ navazujícího vzdělávání", "Počet žáků"], admissionRows));
  }

  const pupilRowsSep = section04Data.pupilCountsSeptember.filter((row) => hasAnyText(row.className)).map((row) => [
    row.className,
    integerOrDash(row.boys),
    integerOrDash(row.girls),
    integerOrDash(row.total),
    row.classTeacher ?? "—",
  ]);
  if (hasAnyRows(pupilRowsSep)) {
    blocks.push(buildHeading("4.7 Počty žáků"));
    blocks.push({ type: "paragraph", text: "Počty žáků k 1. září" });
    blocks.push(buildTable(["Třída", "Chlapců", "Dívek", "Celkem", "Třídní učitel"], pupilRowsSep));
  }

  const pupilRowsJune = section04Data.pupilCountsJune.filter((row) => hasAnyText(row.className)).map((row) => [
    row.className,
    integerOrDash(row.boys),
    integerOrDash(row.girls),
    integerOrDash(row.total),
    row.classTeacher ?? "—",
  ]);
  if (hasAnyRows(pupilRowsJune)) {
    blocks.push({ type: "paragraph", text: "Počty žáků k 30. červnu" });
    blocks.push(buildTable(["Třída", "Chlapců", "Dívek", "Celkem", "Třídní učitel"], pupilRowsJune));
  }
  return blocks;
}

function buildSection05DocxTables(section05Data: AnnualReportSection05Data): DocxStructuredBlock[] {
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
    buildTable(["Předmět", "1. ročník", "2. ročník", "3. ročník", "4. ročník", "5. ročník", "6. ročník", "7. ročník", "8. ročník", "9. ročník"], rows),
  ];
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
    "Počet žáků",
    "Třídní učitel",
    "Prospěl s vyznamenáním",
    "Prospěl",
    "Neprospěl",
    "Nehodnocen",
    "Snížená známka z chování",
    "Průměrný prospěch",
    "Omluvená absence na žáka",
    "Neomluvená absence na žáka",
  ];
  const firstRows = buildClassResultRows(section06Data.firstTermClassResults);
  if (hasAnyRows(firstRows)) {
    blocks.push(buildHeading("6.1 Souhrnná statistika tříd 1. pololetí školního roku"));
    blocks.push(buildTable(headers, firstRows));
  }
  const secondRows = buildClassResultRows(section06Data.secondTermClassResults);
  if (hasAnyRows(secondRows)) {
    blocks.push(buildHeading("6.2 Souhrnná statistika tříd 2. pololetí školního roku"));
    blocks.push(buildTable(headers, secondRows));
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
  return [
    buildHeading("7.3 Počty žáků se speciálními vzdělávacími potřebami"),
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
  ];
}

function buildSection11DocxTables(section11Data: AnnualReportSection11Data): DocxStructuredBlock[] {
  return [
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
}

export function getStructuredDocxBlocksForSection(
  sectionNumber: string,
  data: AnnualReportDocxStructuredData | undefined,
): DocxStructuredBlock[] {
  if (!data) return [];
  if (sectionNumber === "03" && data.section03Data) return buildSection03DocxTables(data.section03Data);
  if (sectionNumber === "04" && data.section04Data) return buildSection04DocxTables(data.section04Data);
  if (sectionNumber === "05" && data.section05Data) return buildSection05DocxTables(data.section05Data);
  if (sectionNumber === "06" && data.section06Data) return buildSection06DocxTables(data.section06Data);
  if (sectionNumber === "07" && data.section07Data) return buildSection07DocxTables(data.section07Data);
  if (sectionNumber === "11" && data.section11Data) return buildSection11DocxTables(data.section11Data);
  return [];
}
