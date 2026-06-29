import type { Section14GeneratorInput } from "./vyrocni-zprava-section14-generator-input";
import { appendSentencePeriod } from "./vyrocni-zprava-text-formatting-helpers";

export const SECTION14_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 14 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section14DraftResult = {
  ready: boolean;
  text: string;
};

function buildIncompleteDraft(input: Section14GeneratorInput): string {
  const sections = [SECTION14_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
  if (input.recommendedData.length > 0) {
    sections.push("", "Doporučené doplňující údaje (neblokují vytvoření kapitoly):");
    sections.push(...input.recommendedData.map((item) => `- ${item}`));
  }
  if (input.warnings.length > 0) {
    sections.push("", "Upozornění k ověření dat:");
    sections.push(...input.warnings.map((item) => `- ${item}`));
  }
  return sections.join("\n");
}

export function generateSection14Draft(input: Section14GeneratorInput): Section14DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return { ready: false, text: buildIncompleteDraft(input) };
  }

  const sections = [
    "14 Závěr",
    "",
    appendSentencePeriod(input.overallEvaluation ?? ""),
    "",
    "V následujícím období bude škola nadále usilovat o:",
    input.futurePlans ?? "Plány do dalšího období nejsou v podkladech samostatně uvedeny.",
  ];

  if (input.notes) {
    sections.push("", appendSentencePeriod(`Poznámky: ${input.notes}`));
  }

  return { ready: true, text: sections.join("\n") };
}

export function isSection14IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION14_INCOMPLETE_DRAFT_PREFIX);
}
