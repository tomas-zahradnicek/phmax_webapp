import { formatCsHoursPerWeek, formatCsNumber } from "../cs-format";
import type { Section03GeneratorInput } from "./vyrocni-zprava-section03-generator-input";
import { formatCzechDecimal } from "./vyrocni-zprava-number-formatting-helpers";

export const SECTION03_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 03 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export const SECTION03_CALCULATOR_SUPPORT_PARAGRAPH =
  "Z podpůrných výpočtů aplikace jsou k dispozici také údaje vztahující se k PHmax/PHAmax/PHPmax. Tyto údaje slouží jako doplňkový podklad a nenahrazují personální členění pracovníků školy.";

export type Section03DraftResult = {
  ready: boolean;
  text: string;
};

function formatPersons(value: number | undefined): string {
  return value == null ? "–" : formatCsNumber(value, { maximumFractionDigits: 0 });
}

function formatFte(value: number | undefined): string {
  return value == null ? "–" : formatCzechDecimal(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatGenderCell(value: number | undefined): string {
  return value == null ? "–" : formatCsNumber(value, { maximumFractionDigits: 0 });
}

function buildIntroParagraph(input: Section03GeneratorInput): string {
  const parts: string[] = [];
  const schoolYear = input.schoolYear.trim();
  const { name, municipality, schoolType } = input.schoolIdentification;

  if (schoolYear) parts.push(`Ve školním roce ${schoolYear}`);
  if (name) {
    parts.push(parts.length > 0 ? ` v ${name}` : name);
  } else if (parts.length > 0) {
    parts.push(" ve škole");
  }
  if (municipality) parts.push(` (${municipality})`);
  if (schoolType) parts.push(` – ${schoolType}`);

  const prefix = parts.length > 0 ? `${parts.join("")} ` : "";
  return `${prefix}byl zpracován přehled personálního zabezpečení činnosti školy podle struktury výroční zprávy.`;
}

function buildStaffParagraph(input: Section03GeneratorInput): string {
  const s = input.staffCounts;
  const lines = [
    `Učitelé: ${formatPersons(s.teachersPersons)} fyzických osob, ${formatFte(s.teachersFte)} úvazků.`,
    `Vychovatelé: ${formatPersons(s.educatorsPersons)} fyzických osob, ${formatFte(s.educatorsFte)} úvazků.`,
    `Speciální pedagogové: ${formatPersons(s.specialPedagoguesPersons)} fyzických osob, ${formatFte(s.specialPedagoguesFte)} úvazků.`,
    `Asistenti pedagoga: ${formatPersons(s.teachingAssistantsPersons)} fyzických osob, ${formatFte(s.teachingAssistantsFte)} úvazků.`,
    `Správní a nepedagogičtí zaměstnanci: ${formatPersons(s.nonTeachingStaffPersons)} fyzických osob, ${formatFte(s.nonTeachingStaffFte)} úvazků.`,
    `Celkem pedagogičtí pracovníci: ${formatPersons(s.totalPedagogicalPersons)} fyzických osob, ${formatFte(s.totalPedagogicalFte)} úvazků.`,
    `Celkem pracovníci školy: ${formatPersons(s.totalPersons)} fyzických osob, ${formatFte(s.totalFte)} úvazků.`,
  ];
  return lines.join("\n");
}

function buildGenderSection(
  title: string,
  table: Section03GeneratorInput["ageAndGender"],
): string {
  const rowLines = table.rows.map(
    (row) =>
      `${row.label}: muži ${formatGenderCell(row.men)}, ženy ${formatGenderCell(row.women)}, celkem ${formatGenderCell(row.total)}.`,
  );
  rowLines.push(
    `Celkem: muži ${formatGenderCell(table.totalMen)}, ženy ${formatGenderCell(table.totalWomen)}, celkem ${formatGenderCell(table.grandTotal)}.`,
  );
  return `${title}\n${rowLines.join("\n")}`;
}

function buildQualificationSection(input: Section03GeneratorInput): string {
  const rowLines = input.qualification.rows.map(
    (row) =>
      `${row.label}: splňuje kvalifikaci ${formatGenderCell(row.qualified)}, nesplňuje kvalifikaci ${formatGenderCell(row.notQualified)}, celkem ${formatGenderCell(row.total)}.`,
  );
  rowLines.push(
    `Celkem: splňuje kvalifikaci ${formatGenderCell(input.qualification.totalQualified)}, nesplňuje kvalifikaci ${formatGenderCell(input.qualification.totalNotQualified)}, celkem ${formatGenderCell(input.qualification.grandTotal)}.`,
  );
  return `3.4 Členění pedagogických pracovníků podle odborné kvalifikace\n${rowLines.join("\n")}`;
}

function buildCalculatorParagraph(input: Section03GeneratorInput): string | null {
  if (!input.calculatorSupport.available) return null;

  const details: string[] = [];
  if (input.calculatorSupport.phmax != null) {
    details.push(`souhrnné PHmax ${formatCsHoursPerWeek(input.calculatorSupport.phmax)}`);
  }
  if (input.calculatorSupport.phamax != null) {
    details.push(`PHAmax ${formatCsHoursPerWeek(input.calculatorSupport.phamax)}`);
  }
  if (input.calculatorSupport.phpmax != null) {
    details.push(`PHPmax ${formatCsHoursPerWeek(input.calculatorSupport.phpmax)}`);
  }

  const detailText = details.length > 0 ? ` (${details.join(", ")})` : "";
  return `${SECTION03_CALCULATOR_SUPPORT_PARAGRAPH}${detailText}`;
}

function buildIncompleteDraft(input: Section03GeneratorInput): string {
  const missingLines = input.missingData.map((item) => `- ${item}`);
  const warningLines = input.warnings
    .filter((warning) => !input.missingData.includes(warning))
    .map((item) => `- ${item}`);

  const sections = [`${SECTION03_INCOMPLETE_DRAFT_PREFIX}`, ...missingLines];
  if (warningLines.length > 0) {
    sections.push("", "Upozornění:", ...warningLines);
  }
  return sections.join("\n");
}

/** Deterministický návrh kapitoly 03 z validovaných vstupů – bez volání AI. */
export function generateSection03Draft(input: Section03GeneratorInput): Section03DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const sections = [
    "03 Rámcový popis personálního zabezpečení činnosti školy",
    "",
    buildIntroParagraph(input),
    "",
    "3.1 Základní údaje o pracovnících školy",
    buildStaffParagraph(input),
    "",
    buildGenderSection(
      "3.2 Členění pedagogických zaměstnanců podle věku a pohlaví",
      input.ageAndGender,
    ),
    "",
    buildGenderSection(
      "3.3 Členění pedagogických zaměstnanců podle vzdělání a pohlaví",
      input.educationAndGender,
    ),
    "",
    buildQualificationSection(input),
  ];

  const calculatorParagraph = buildCalculatorParagraph(input);
  if (calculatorParagraph) {
    sections.push("", calculatorParagraph);
  }

  return {
    ready: true,
    text: sections.join("\n"),
  };
}

export function isSection03IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION03_INCOMPLETE_DRAFT_PREFIX);
}
