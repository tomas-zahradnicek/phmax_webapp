import type { Section09GeneratorInput } from "./vyrocni-zprava-section09-generator-input";
import { appendSentencePeriod } from "./vyrocni-zprava-text-formatting-helpers";

export const SECTION09_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 09 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section09DraftResult = {
  ready: boolean;
  text: string;
};

function buildIncompleteDraft(input: Section09GeneratorInput): string {
  const sections = [SECTION09_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
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

function formatPublicEvent(value: "ANO" | "NE" | "CASTECNE" | undefined): string {
  if (value === "ANO") return "ANO";
  if (value === "NE") return "NE";
  if (value === "CASTECNE") return "ČÁSTEČNĚ";
  return "neuvedeno";
}

function buildEvents(events: Section09GeneratorInput["schoolEvents"]): string {
  const rows = events.filter(
    (item) =>
      item.dateOrPeriod ||
      item.title ||
      item.eventType ||
      item.targetGroup ||
      item.description ||
      item.location ||
      item.partner ||
      item.publicEvent ||
      item.note,
  );
  if (rows.length === 0) return "V podkladech nejsou uvedeny konkrétní akce školy.";
  return rows
    .map((item) => {
      const title = item.title || "Akce bez názvu";
      const details = [
        item.dateOrPeriod ? `datum/období: ${item.dateOrPeriod}` : undefined,
        item.eventType ? `typ akce: ${item.eventType}` : undefined,
        item.targetGroup ? `určeno pro: ${item.targetGroup}` : undefined,
        item.description ? `popis: ${item.description}` : undefined,
        item.location ? `místo: ${item.location}` : undefined,
        item.partner ? `partner: ${item.partner}` : undefined,
        `veřejná akce: ${formatPublicEvent(item.publicEvent)}`,
        item.note ? `poznámka: ${item.note}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");
      return `- ${title}${details ? ` (${details})` : ""}`;
    })
    .join("\n");
}

function buildCompetitions(competitions: Section09GeneratorInput["competitions"]): string {
  const rows = competitions.filter(
    (item) => item.dateOrPeriod || item.title || item.subjectOrArea || item.participants || item.result || item.level || item.note,
  );
  if (rows.length === 0) return "V podkladech nejsou uvedeny konkrétní soutěže.";
  return rows
    .map((item) => {
      const title = item.title || "Soutěž bez názvu";
      const details = [
        item.dateOrPeriod ? `datum/období: ${item.dateOrPeriod}` : undefined,
        item.subjectOrArea ? `oblast/předmět: ${item.subjectOrArea}` : undefined,
        item.participants ? `účastníci: ${item.participants}` : undefined,
        item.result ? `výsledek/umístění: ${item.result}` : undefined,
        item.level ? `úroveň soutěže: ${item.level}` : undefined,
        item.note ? `poznámka: ${item.note}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");
      return `- ${title}${details ? ` (${details})` : ""}`;
    })
    .join("\n");
}

function buildProjects(projects: Section09GeneratorInput["projectsAndCooperation"]): string {
  const rows = projects.filter(
    (item) => item.title || item.type || item.partner || item.period || item.description || item.output || item.note,
  );
  if (rows.length === 0) return "V podkladech nejsou uvedeny konkrétní projekty nebo spolupráce.";
  return rows
    .map((item) => {
      const title = item.title || "Projekt/spolupráce bez názvu";
      const details = [
        item.type ? `typ: ${item.type}` : undefined,
        item.partner ? `partner: ${item.partner}` : undefined,
        item.period ? `období: ${item.period}` : undefined,
        item.description ? `popis: ${item.description}` : undefined,
        item.output ? `výstup: ${item.output}` : undefined,
        item.note ? `poznámka: ${item.note}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");
      return `- ${title}${details ? ` (${details})` : ""}`;
    })
    .join("\n");
}

function buildPresentationSummary(presentation: Section09GeneratorInput["publicPresentation"]): string {
  const parts = [
    presentation.description ? appendSentencePeriod(`Popis prezentace školy: ${presentation.description}`) : undefined,
    presentation.website ? appendSentencePeriod(`Web školy: ${presentation.website}`) : undefined,
    presentation.socialMedia ? appendSentencePeriod(`Sociální sítě / online komunikace: ${presentation.socialMedia}`) : undefined,
    presentation.mediaOutputs ? appendSentencePeriod(`Mediální výstupy: ${presentation.mediaOutputs}`) : undefined,
    presentation.cooperationWithCommunity
      ? appendSentencePeriod(`Spolupráce s obcí, zřizovatelem a veřejností: ${presentation.cooperationWithCommunity}`)
      : undefined,
    presentation.note ? appendSentencePeriod(`Poznámka: ${presentation.note}`) : undefined,
  ].filter(Boolean);

  if (parts.length === 0) {
    return "Údaje o prezentaci školy na veřejnosti nejsou v podkladech samostatně rozepsány.";
  }
  return parts.join("\n");
}

/** Deterministický návrh kapitoly 09 z validovaných vstupů – bez volání AI a bez domýšlení údajů. */
export function generateSection09Draft(input: Section09GeneratorInput): Section09DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const intro = input.schoolYear
    ? `Ve školním roce ${input.schoolYear} jsou níže uvedeny pouze údaje poskytnuté školou o aktivitách a její prezentaci na veřejnosti.`
    : "Níže jsou uvedeny pouze údaje poskytnuté školou o aktivitách a její prezentaci na veřejnosti.";

  const sections = [
    "09 Údaje o aktivitách a prezentaci školy na veřejnosti",
    "",
    intro,
    "",
    "9.1 Akce školy",
    buildEvents(input.schoolEvents),
    "",
    "9.2 Účast žáků na soutěžích",
    buildCompetitions(input.competitions),
    "",
    "9.3 Projekty, spolupráce a prezentace školy na veřejnosti",
    buildProjects(input.projectsAndCooperation),
    buildPresentationSummary(input.publicPresentation),
    "",
    "9.4 Mimořádné výsledky a úspěchy žáků",
    input.extraordinaryAchievements
      ? appendSentencePeriod(`Mimořádné výsledky a úspěchy žáků: ${input.extraordinaryAchievements}`)
      : "Mimořádné výsledky a úspěchy žáků nejsou v podkladech samostatně uvedeny.",
    "",
    appendSentencePeriod(`Souhrnné vyhodnocení kapitoly: ${input.summaryEvaluation}`),
  ].filter((item): item is string => Boolean(item));

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

export function isSection09IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION09_INCOMPLETE_DRAFT_PREFIX);
}
