import type { Section12GeneratorInput } from "./vyrocni-zprava-section12-generator-input";
import { appendSentencePeriod } from "./vyrocni-zprava-text-formatting-helpers";

export const SECTION12_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 12 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section12DraftResult = {
  ready: boolean;
  text: string;
};

function buildIncompleteDraft(input: Section12GeneratorInput): string {
  const sections = [SECTION12_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
  if (input.recommendedData.length > 0) {
    sections.push("", "Doporučené doplňující údaje (neblokují vytvoření kapitoly):");
    sections.push(...input.recommendedData.map((item) => `- ${item}`));
  }
  return sections.join("\n");
}

function buildProjectSections(projects: Section12GeneratorInput["projects"]): string[] {
  if (projects.length === 0) {
    return ["12.1 Projekty a granty", "V podkladech nejsou uvedeny konkrétní projekty nebo granty.", ""];
  }
  const lines: string[] = [];
  projects.forEach((project, index) => {
    lines.push(`12.${index + 1} ${project.title}`);
    if (project.description) lines.push(appendSentencePeriod(project.description));
    if (project.focusAreas) lines.push(appendSentencePeriod(`Zaměření: ${project.focusAreas}`));
    if (project.provider) lines.push(appendSentencePeriod(`Poskytovatel: ${project.provider}`));
    if (project.amount) lines.push(appendSentencePeriod(`Výše podpory: ${project.amount}`));
    lines.push("");
  });
  return lines;
}

export function generateSection12Draft(input: Section12GeneratorInput): Section12DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return { ready: false, text: buildIncompleteDraft(input) };
  }

  const otherProgramsHeading = `12.${Math.max(input.projects.length, 1) + 1} Další programy`;
  const sections = [
    "12 Projekty a granty",
    "",
    ...buildProjectSections(input.projects),
    otherProgramsHeading,
    input.otherPrograms ?? "Další programy nejsou v podkladech samostatně uvedeny.",
  ];

  if (input.summaryEvaluation) {
    sections.push("", appendSentencePeriod(`Souhrnné vyhodnocení kapitoly: ${input.summaryEvaluation}`));
  }
  if (input.notes) {
    sections.push("", appendSentencePeriod(`Poznámky: ${input.notes}`));
  }

  return { ready: true, text: sections.join("\n") };
}

export function isSection12IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION12_INCOMPLETE_DRAFT_PREFIX);
}
