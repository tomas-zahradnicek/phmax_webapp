import type { Section01GeneratorInput } from "./vyrocni-zprava-section01-generator-input";
import { appendSentencePeriod, normalizeOptionalText } from "./vyrocni-zprava-text-formatting-helpers";

export const SECTION01_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 01 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section01DraftResult = {
  ready: boolean;
  text: string;
};

function normalizeForCompare(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]/g, "")
    .trim();
}

function buildIntroParagraph(input: Section01GeneratorInput): string {
  const schoolYear = input.schoolYear.trim();
  const name = input.schoolProfile.name;
  if (schoolYear && name) {
    return `Ve školním roce ${schoolYear} jsou uvedeny základní údaje o škole ${name} podle struktury výroční zprávy.`;
  }
  if (schoolYear) {
    return `Ve školním roce ${schoolYear} jsou uvedeny základní údaje o škole podle struktury výroční zprávy.`;
  }
  if (name) {
    return `Jsou uvedeny základní údaje o škole ${name} podle struktury výroční zprávy.`;
  }
  return "Jsou uvedeny základní údaje o škole podle struktury výroční zprávy.";
}

function buildSection11(input: Section01GeneratorInput): string {
  const lines = [`Oficiální název školy: ${input.schoolProfile.name}.`];
  if (input.schoolProfile.schoolType) {
    lines.push(`Typ školy: ${input.schoolProfile.schoolType}.`);
  }
  if (input.schoolProfile.ico) lines.push(`IČO: ${input.schoolProfile.ico}.`);
  if (input.schoolProfile.redIzo) lines.push(`RED IZO: ${input.schoolProfile.redIzo}.`);
  if (input.schoolProfile.izo) lines.push(`IZO: ${input.schoolProfile.izo}.`);
  return lines.join("\n");
}

function buildSection12(input: Section01GeneratorInput): string {
  const parts = [input.schoolProfile.address, input.schoolProfile.municipality, input.schoolProfile.region].filter(Boolean);
  return `Sídlo školy: ${parts.join(", ")}.`;
}

function buildSection13(input: Section01GeneratorInput): string {
  const lines: string[] = [];
  const schoolCharacteristic = normalizeOptionalText(input.sectionInputs.schoolCharacteristic);
  if (schoolCharacteristic) {
    lines.push(appendSentencePeriod(schoolCharacteristic));
  }
  if (input.sectionInputs.schoolParts) {
    lines.push(appendSentencePeriod(`Součásti školy: ${input.sectionInputs.schoolParts}`));
  }
  if (input.sectionInputs.schoolCapacity) {
    lines.push(appendSentencePeriod(`Kapacita školy / součástí školy: ${input.sectionInputs.schoolCapacity}`));
  }
  if (lines.length === 0) {
    return "Pro tuto podkapitolu nejsou v podkladech uvedeny doplňující údaje.";
  }
  return lines.join("\n");
}

function buildSection14(input: Section01GeneratorInput): string {
  return `Zřizovatelem školy je ${input.schoolProfile.founder}.`;
}

function buildSection15(input: Section01GeneratorInput): string {
  const lines: string[] = [];
  const leadershipInfo = input.sectionInputs.leadershipInfo;
  const principalName = input.schoolProfile.principalName;
  const leadershipMentionsPrincipal =
    leadershipInfo && principalName
      ? normalizeForCompare(leadershipInfo).includes(normalizeForCompare(principalName))
      : false;

  if (!leadershipMentionsPrincipal) {
    lines.push(`Ředitel školy: ${principalName}.`);
  }
  if (leadershipInfo) {
    lines.push(appendSentencePeriod(leadershipInfo));
  }
  return lines.join("\n");
}

function buildSection16(input: Section01GeneratorInput): string {
  const lines = [`Webová adresa školy: ${input.schoolProfile.website}.`];
  const remoteAccessInfo = input.sectionInputs.remoteAccessInfo;
  const website = input.schoolProfile.website;
  const isDuplicateRemoteInfo =
    remoteAccessInfo && website
      ? normalizeForCompare(remoteAccessInfo) === normalizeForCompare(website) ||
        normalizeForCompare(remoteAccessInfo).includes(normalizeForCompare(website))
      : false;
  if (remoteAccessInfo && !isDuplicateRemoteInfo) {
    lines.push(appendSentencePeriod(remoteAccessInfo));
  }
  lines.push(`E-mail školy: ${input.schoolProfile.email}.`);
  if (input.schoolProfile.phone) lines.push(`Telefon: ${input.schoolProfile.phone}.`);
  if (input.schoolProfile.dataBox) lines.push(`Datová schránka: ${input.schoolProfile.dataBox}.`);
  return lines.join("\n");
}

function buildSection18(input: Section01GeneratorInput): string {
  if (input.sectionInputs.materialTechnicalConditions) {
    return appendSentencePeriod(input.sectionInputs.materialTechnicalConditions);
  }
  return "Pro tuto podkapitolu nejsou v podkladech uvedeny doplňující údaje.";
}

function buildSection17(input: Section01GeneratorInput): string {
  if (input.sectionInputs.schoolCouncilInfo) {
    return appendSentencePeriod(input.sectionInputs.schoolCouncilInfo);
  }
  return "Pro tuto podkapitolu nejsou v podkladech uvedeny doplňující údaje.";
}

function buildIncompleteDraft(input: Section01GeneratorInput): string {
  const missingLines = input.missingData.map((item) => `- ${item}`);
  const sections = [`${SECTION01_INCOMPLETE_DRAFT_PREFIX}`, ...missingLines];

  if (input.recommendedData.length > 0) {
    sections.push("", "Doporučené doplňující údaje (negenerují blokaci kapitoly):");
    sections.push(...input.recommendedData.map((item) => `- ${item}`));
  }

  return sections.join("\n");
}

/** Deterministický návrh kapitoly 01 z validovaných vstupů – bez volání AI. */
export function generateSection01Draft(input: Section01GeneratorInput): Section01DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const sections = [
    "01 Základní údaje o škole",
    "",
    buildIntroParagraph(input),
    "",
    "1.1 Název školy",
    buildSection11(input),
    "",
    "1.2 Sídlo školy",
    buildSection12(input),
    "",
    "1.3 Charakteristika školy",
    buildSection13(input),
    "",
    "1.4 Zřizovatel školy",
    buildSection14(input),
    "",
    "1.5 Údaje o vedení školy",
    buildSection15(input),
    "",
    "1.6 Adresa pro dálkový přístup",
    buildSection16(input),
    "",
    "1.7 Údaje o školské radě",
    buildSection17(input),
    "",
    "1.8 Materiálně-technické podmínky",
    buildSection18(input),
  ];

  return {
    ready: true,
    text: sections.join("\n"),
  };
}

export function isSection01IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION01_INCOMPLETE_DRAFT_PREFIX);
}
