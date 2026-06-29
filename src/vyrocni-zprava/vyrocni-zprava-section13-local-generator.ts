import type { Section13GeneratorInput } from "./vyrocni-zprava-section13-generator-input";
import { appendSentencePeriod } from "./vyrocni-zprava-text-formatting-helpers";

export const SECTION13_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 13 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section13DraftResult = {
  ready: boolean;
  text: string;
};

function buildIncompleteDraft(input: Section13GeneratorInput): string {
  const sections = [SECTION13_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
  if (input.recommendedData.length > 0) {
    sections.push("", "Doporučené doplňující údaje (neblokují vytvoření kapitoly):");
    sections.push(...input.recommendedData.map((item) => `- ${item}`));
  }
  return sections.join("\n");
}

export function generateSection13Draft(input: Section13GeneratorInput): Section13DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return { ready: false, text: buildIncompleteDraft(input) };
  }

  const sections = [
    "13 Spolupráce s rodiči a partnery",
    "",
    "13.1 Spolupráce se zákonnými zástupci",
    input.parentCooperation ?? "Spolupráce se zákonnými zástupci není v podkladech uvedena.",
    "",
    "13.2 Spolupráce se zřizovatelem",
    input.founderCooperation ?? "Spolupráce se zřizovatelem není v podkladech uvedena.",
    "",
    "13.3 Další partneři školy",
    input.partners ?? "Další partneři školy nejsou v podkladech uvedeni.",
  ];

  if (input.summaryEvaluation) {
    sections.push("", appendSentencePeriod(`Souhrnné vyhodnocení kapitoly: ${input.summaryEvaluation}`));
  }
  if (input.notes) {
    sections.push("", appendSentencePeriod(`Poznámky: ${input.notes}`));
  }

  return { ready: true, text: sections.join("\n") };
}

export function isSection13IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION13_INCOMPLETE_DRAFT_PREFIX);
}
