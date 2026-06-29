import type { Section07GeneratorInput } from "./vyrocni-zprava-section07-generator-input";
import { appendSentencePeriod } from "./vyrocni-zprava-text-formatting-helpers";
import { formatCzechInteger } from "./vyrocni-zprava-number-formatting-helpers";

export const SECTION07_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 07 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section07DraftResult = {
  ready: boolean;
  text: string;
};

function joinSentences(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function buildIncompleteDraft(input: Section07GeneratorInput): string {
  const sections = [SECTION07_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
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

function formatNumber(value: number | undefined): string {
  return value === undefined ? "neuvedeno" : formatCzechInteger(value);
}

function buildPreventionProgrammes(input: Section07GeneratorInput): string {
  const programmes = input.prevention.preventionProgrammes.filter(
    (item) => item.title || item.targetGroup || item.description || item.dateOrPeriod || item.provider,
  );
  if (programmes.length === 0) {
    return "Preventivní aktivity nejsou v podkladech konkrétně rozepsány.";
  }
  return programmes
    .map((item) => {
      const title = item.title || "Aktivita bez názvu";
      const details = [
        item.targetGroup ? `cílová skupina: ${item.targetGroup}` : undefined,
        item.description ? `popis: ${item.description}` : undefined,
        item.dateOrPeriod ? `období: ${item.dateOrPeriod}` : undefined,
        item.provider ? `poskytovatel: ${item.provider}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");
      return details ? `- ${title} (${details})` : `- ${title}`;
    })
    .join("\n");
}

function buildRiskIncidents(input: Section07GeneratorInput): string {
  const incidents = input.riskBehaviourIncidents.filter(
    (item) => item.type || item.count !== undefined || item.adoptedMeasures || item.note,
  );
  if (incidents.length === 0) {
    return "V podkladech nejsou uvedeny agregované výskyty rizikového chování.";
  }
  return incidents
    .map((item) => {
      const type = item.type || "Neuvedený typ";
      const measures = item.adoptedMeasures ? ` ${appendSentencePeriod(`přijatá opatření: ${item.adoptedMeasures}`)}` : "";
      const note = item.note ? ` ${appendSentencePeriod(`Poznámka: ${item.note}`)}` : "";
      return `- ${type}: počet řešených případů ${item.count ?? "neuvedeno"}.${measures}${note}`.trim();
    })
    .join("\n");
}

function buildSupportNeeds(input: Section07GeneratorInput): string {
  const s = input.pupilsWithSupportNeeds;
  const lines = [
    `Počet žáků se SVP celkem: ${formatNumber(s.pupilsWithSvpTotal)}.`,
    `Počet žáků s podpůrnými opatřeními: ${formatNumber(s.pupilsWithSupportMeasures)}.`,
    `Počet žáků s IVP: ${formatNumber(s.pupilsWithIndividualEducationPlan)}.`,
    `Počet žáků s pedagogickou intervencí: ${formatNumber(s.pupilsWithPedagogicalIntervention)}.`,
    `Počet žáků s podporou asistenta pedagoga: ${formatNumber(s.pupilsWithTeachingAssistantSupport)}.`,
    `Počet nadaných žáků: ${formatNumber(s.pupilsGifted)}.`,
    `Počet mimořádně nadaných žáků: ${formatNumber(s.pupilsExceptionallyGifted)}.`,
  ];
  if (s.note) lines.push(appendSentencePeriod(`Poznámka: ${s.note}`));
  return lines.join("\n");
}

function buildSupportConditions(input: Section07GeneratorInput): string {
  const c = input.supportConditions;
  const parts = [
    c.counsellingWorkplaceDescription
      ? appendSentencePeriod(`Popis práce školního poradenského pracoviště: ${c.counsellingWorkplaceDescription}`)
      : undefined,
    c.cooperationWithPppSpc ? appendSentencePeriod(`Spolupráce s PPP/SPC: ${c.cooperationWithPppSpc}`) : undefined,
    c.supportMeasuresDescription ? appendSentencePeriod(`Popis podpůrných opatření: ${c.supportMeasuresDescription}`) : undefined,
    c.inclusionMeasures ? appendSentencePeriod(`Inkluzivní opatření: ${c.inclusionMeasures}`) : undefined,
    c.giftedSupportDescription
      ? appendSentencePeriod(`Podpora nadaných a mimořádně nadaných žáků: ${c.giftedSupportDescription}`)
      : undefined,
    c.teachingAssistantSupportDescription
      ? appendSentencePeriod(`Podpora asistenty pedagoga: ${c.teachingAssistantSupportDescription}`)
      : undefined,
    c.materialAndOrganizationalConditions
      ? appendSentencePeriod(`Materiální a organizační podmínky: ${c.materialAndOrganizationalConditions}`)
      : undefined,
    c.evaluation ? appendSentencePeriod(`Vyhodnocení podpory: ${c.evaluation}`) : undefined,
  ];
  return parts.length > 0
    ? parts.join("\n")
    : "Podmínky pro vzdělávání a zajištění podpory nejsou v podkladech podrobně rozepsány.";
}

function buildLanguagePreparation(input: Section07GeneratorInput): string {
  const l = input.languagePreparation;
  const providedLabel =
    l.languagePreparationProvided === "ANO"
      ? "ano"
      : l.languagePreparationProvided === "NE"
        ? "ne"
        : l.languagePreparationProvided === "NEUVEDENO"
          ? "neuvedeno"
        : "nerelevantní";
  const lines = [
    `Počet žáků s nárokem na jazykovou přípravu: ${formatNumber(l.pupilsWithLanguagePreparationEntitlement)}.`,
    `Poskytování jazykové přípravy: ${providedLabel}.`,
  ];
  if (l.description) lines.push(appendSentencePeriod(`Popis zajištění jazykové přípravy: ${l.description}`));
  if (l.provider) lines.push(appendSentencePeriod(`Poskytovatel: ${l.provider}`));
  if (l.note) lines.push(appendSentencePeriod(`Poznámka: ${l.note}`));
  return lines.join("\n");
}

/** Deterministický návrh kapitoly 07 z validovaných vstupů – bez volání AI a bez domýšlení údajů. */
export function generateSection07Draft(input: Section07GeneratorInput): Section07DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const intro = joinSentences([
    input.schoolYear ? `Ve školním roce ${input.schoolYear}` : undefined,
    input.school.name ? `pro ${input.school.name}` : undefined,
    "jsou níže uvedeny pouze údaje poskytnuté školou v agregované podobě.",
  ]);

  const sections = [
    "07 Údaje o prevenci a přijatých opatřeních k řešení sociálně patologických jevů, rizikového chování a zajištění podpory dětí, žáků a studentů se speciálními vzdělávacími potřebami, nadaných, mimořádně nadaných a s nárokem na poskytování jazykové přípravy",
    "",
    intro,
    "",
    "7.1 Prevence sociálně patologických jevů a rizikového chování",
    appendSentencePeriod(`Popis preventivní strategie školy: ${input.prevention.preventionStrategyDescription ?? "neuvedeno"}`),
    input.prevention.preventionTeam
      ? appendSentencePeriod(`Preventivní tým / odpovědné osoby: ${input.prevention.preventionTeam}`)
      : undefined,
    input.prevention.cooperation ? appendSentencePeriod(`Spolupráce s institucemi: ${input.prevention.cooperation}`) : undefined,
    input.prevention.evaluation ? appendSentencePeriod(`Vyhodnocení prevence: ${input.prevention.evaluation}`) : undefined,
    buildPreventionProgrammes(input),
    "",
    "7.2 Počet výskytu rizikového chování, které škola řešila, a přijatá opatření",
    "V této části jsou uvedeny pouze souhrnné počty řešených případů a přijatá opatření bez individuálních údajů:",
    buildRiskIncidents(input),
    "",
    "7.3 Počty žáků se speciálními vzdělávacími potřebami",
    buildSupportNeeds(input),
    "",
    "7.4 Podmínky pro vzdělávání a zajištění podpory",
    buildSupportConditions(input),
    "",
    "7.5 Zajištění podpory žáků s nárokem na poskytování jazykové přípravy",
    buildLanguagePreparation(input),
    "",
    `Souhrnné vyhodnocení kapitoly: ${input.summaryEvaluation}`,
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

export function isSection07IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION07_INCOMPLETE_DRAFT_PREFIX);
}
