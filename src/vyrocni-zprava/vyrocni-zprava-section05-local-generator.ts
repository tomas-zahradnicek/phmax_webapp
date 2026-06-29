import type { Section05GeneratorInput } from "./vyrocni-zprava-section05-generator-input";
import type { Section05GoalLevel } from "./vyrocni-zprava-section05-types";
import { appendSentencePeriod, normalizeOptionalText } from "./vyrocni-zprava-text-formatting-helpers";

export const SECTION05_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 05 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section05DraftResult = {
  ready: boolean;
  text: string;
};

const GOAL_LEVEL_LABELS: Record<Section05GoalLevel, string> = {
  VETSINA_HODIN: "Objevuje se ve většině hodin a činností",
  NEKTERE_HODINY: "Objevuje se pouze v některých hodinách a činnostech",
  NEOBJEVUJE_SE: "V hodinách a činnostech se neobjevuje",
};

function buildIncompleteDraft(input: Section05GeneratorInput): string {
  const sections = [SECTION05_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
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

function buildWeeklyPlanTable(input: Section05GeneratorInput): string {
  const rows = input.schoolCurriculumPlan.weeklyHourPlan.filter((row) => row.subject);
  if (rows.length === 0) {
    return "V podkladech nebyl uveden detailní týdenní hodinový plán.";
  }

  const lines = [
    "Předmět | 1. ročník | 2. ročník | 3. ročník | 4. ročník | 5. ročník | 6. ročník | 7. ročník | 8. ročník | 9. ročník",
    "--- | --- | --- | --- | --- | --- | --- | --- | --- | ---",
  ];
  rows.forEach((row) => {
    lines.push(
      `${row.subject} | ${row.grade1 ?? "—"} | ${row.grade2 ?? "—"} | ${row.grade3 ?? "—"} | ${row.grade4 ?? "—"} | ${row.grade5 ?? "—"} | ${row.grade6 ?? "—"} | ${row.grade7 ?? "—"} | ${row.grade8 ?? "—"} | ${row.grade9 ?? "—"}`,
    );
  });
  return lines.join("\n");
}

function buildGoalsList(input: Section05GeneratorInput): string {
  const rows = input.goalsEvaluation.filter((row) => row.goal);
  if (rows.length === 0) {
    return "V podkladech nejsou uvedeny konkrétní cíle ŠVP.";
  }
  const lines: string[] = [];
  rows.forEach((row, index) => {
    lines.push(`${index + 1}. ${row.goal}`);
    if (row.level) lines.push(`   Míra naplňování: ${GOAL_LEVEL_LABELS[row.level]}.`);
    if (row.evidence) lines.push(`   Důkaz / příklad z praxe: ${row.evidence}`);
    if (row.note) lines.push(`   Poznámka: ${row.note}`);
  });
  return lines.join("\n");
}

function buildClosingParagraph(input: Section05GeneratorInput): string[] {
  const parts: string[] = [];
  if (input.strengths) parts.push(appendSentencePeriod(`Silné stránky: ${normalizeOptionalText(input.strengths) ?? ""}`));
  if (input.areasForImprovement)
    parts.push(appendSentencePeriod(`Oblasti ke zlepšení: ${normalizeOptionalText(input.areasForImprovement) ?? ""}`));
  if (input.measuresForNextYear)
    parts.push(appendSentencePeriod(`Opatření pro další školní rok: ${normalizeOptionalText(input.measuresForNextYear) ?? ""}`));
  return parts;
}

/** Deterministický návrh kapitoly 05 z validovaných vstupů – bez volání AI. */
export function generateSection05Draft(input: Section05GeneratorInput): Section05DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const sections = [
    "05 Stručné vyhodnocení naplňování cílů školního vzdělávacího programu",
    "",
    input.schoolYear
      ? `Ve školním roce ${input.schoolYear} bylo provedeno vyhodnocení naplňování cílů školního vzdělávacího programu na základě poskytnutých podkladů.`
      : "Bylo provedeno vyhodnocení naplňování cílů školního vzdělávacího programu na základě poskytnutých podkladů.",
    "",
    "5.1 Vzdělávací program",
    appendSentencePeriod(`Název školního vzdělávacího programu: ${input.educationProgram.name}`),
  ];

  if (input.educationProgram.applicableClasses) {
    sections.push(appendSentencePeriod(`Zařazené třídy / ročníky: ${input.educationProgram.applicableClasses}`));
  }
  if (input.educationProgram.note) {
    sections.push(`Poznámka: ${input.educationProgram.note}`);
  }

  sections.push("", "5.2 Učební plán školy");
  if (input.schoolCurriculumPlan.description) {
    sections.push(input.schoolCurriculumPlan.description);
  }
  sections.push(buildWeeklyPlanTable(input));
  if (input.schoolCurriculumPlan.note) {
    sections.push(`Poznámka k učebnímu plánu: ${input.schoolCurriculumPlan.note}`);
  }

  sections.push("", "5.3 Naplňování cílů");
  sections.push(buildGoalsList(input));
  sections.push("", `Celkové vyhodnocení: ${input.overallEvaluation}`);

  const closing = buildClosingParagraph(input);
  if (closing.length > 0) {
    sections.push("", ...closing);
  }

  if (input.notes) {
    sections.push("", `Doplňující poznámky: ${input.notes}`);
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

export function isSection05IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION05_INCOMPLETE_DRAFT_PREFIX);
}
