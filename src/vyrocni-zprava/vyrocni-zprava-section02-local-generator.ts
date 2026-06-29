import type { Section02GeneratorInput } from "./vyrocni-zprava-section02-generator-input";
import { appendSentencePeriod } from "./vyrocni-zprava-text-formatting-helpers";

export const SECTION02_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 02 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section02DraftResult = {
  ready: boolean;
  text: string;
};

function buildIntroParagraph(input: Section02GeneratorInput): string {
  const year = input.schoolYear;
  if (year) {
    return `Škola ve školním roce ${year} vyučovala obory vzdělání v souladu se zápisem ve školském rejstříku. Přehled oborů je uveden níže.`;
  }
  return "Škola vyučovala obory vzdělání v souladu se zápisem ve školském rejstříku. Přehled oborů je uveden níže.";
}

function buildEducationFieldsTable(input: Section02GeneratorInput): string {
  const lines = [
    "Pořadí | Kód oboru | Název oboru / vzdělávacího programu | Forma vzdělávání | Stupeň vzdělání | Poznámka",
    "--- | --- | --- | --- | --- | ---",
  ];

  input.educationFields.forEach((field, index) => {
    lines.push(
      `${index + 1} | ${field.code ?? "—"} | ${field.name} | ${field.form ?? "—"} | ${field.level ?? "—"} | ${field.note ?? "—"}`,
    );
  });

  return lines.join("\n");
}

function buildRegistryParagraph(input: Section02GeneratorInput): string | null {
  if (!input.registrySource && !input.registryVerifiedAt) return null;
  const lines = ["Údaje byly ověřeny podle dostupných údajů ve školském rejstříku."];
  if (input.registrySource) lines.push(appendSentencePeriod(`Zdroj ověření: ${input.registrySource}`));
  if (input.registryVerifiedAt) lines.push(appendSentencePeriod(`Datum ověření: ${input.registryVerifiedAt}`));
  return lines.join("\n");
}

function buildIncompleteDraft(input: Section02GeneratorInput): string {
  const sections = [SECTION02_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
  if (input.recommendedData.length > 0) {
    sections.push("", "Doporučené doplňující údaje (negenerují blokaci kapitoly):");
    sections.push(...input.recommendedData.map((item) => `- ${item}`));
  }
  return sections.join("\n");
}

/** Deterministický návrh kapitoly 02 z validovaných vstupů – bez volání AI. */
export function generateSection02Draft(input: Section02GeneratorInput): Section02DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const sections = [
    "02 Přehled oborů vzdělání, které škola vyučuje v souladu se zápisem ve školském rejstříku",
    "",
    buildIntroParagraph(input),
    "",
    buildEducationFieldsTable(input),
  ];

  const registryParagraph = buildRegistryParagraph(input);
  if (registryParagraph) sections.push("", registryParagraph);

  if (input.notes) sections.push("", appendSentencePeriod(`Poznámka: ${input.notes}`));

  return {
    ready: true,
    text: sections.join("\n"),
  };
}

export function isSection02IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION02_INCOMPLETE_DRAFT_PREFIX);
}
