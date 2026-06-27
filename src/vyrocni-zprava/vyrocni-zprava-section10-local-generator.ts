import type { Section10GeneratorInput } from "./vyrocni-zprava-section10-generator-input";

export const SECTION10_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 10 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section10DraftResult = {
  ready: boolean;
  text: string;
};

function buildIncompleteDraft(input: Section10GeneratorInput): string {
  const sections = [SECTION10_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
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

function buildInspectionRows(inspections: Section10GeneratorInput["inspections"]): string {
  const rows = inspections.filter(
    (item) =>
      item.dateOrPeriod ||
      item.inspectionType ||
      item.subject ||
      item.reportReference ||
      item.reportUrl ||
      item.mainFindings ||
      item.conclusions ||
      item.adoptedMeasures ||
      item.note,
  );
  if (rows.length === 0) {
    return "V podkladech nejsou uvedeny konkrétní záznamy inspekční činnosti.";
  }
  return rows
    .map((item, index) => {
      const label = `Záznam ${index + 1}`;
      const details = [
        item.dateOrPeriod ? `datum/období: ${item.dateOrPeriod}` : undefined,
        item.inspectionType ? `typ inspekční činnosti: ${item.inspectionType}` : undefined,
        item.subject ? `předmět inspekční činnosti: ${item.subject}` : undefined,
        item.reportReference ? `označení zprávy: ${item.reportReference}` : undefined,
        item.reportUrl ? `odkaz na zprávu: ${item.reportUrl}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");

      const findings = item.mainFindings ? `Hlavní zjištění: ${item.mainFindings}.` : undefined;
      const conclusions = item.conclusions ? `Závěry: ${item.conclusions}.` : undefined;
      const measures = item.adoptedMeasures ? `Přijatá opatření: ${item.adoptedMeasures}.` : undefined;
      const note = item.note ? `Poznámka: ${item.note}.` : undefined;

      return [`- ${label}${details ? ` (${details})` : ""}`, findings, conclusions, measures, note]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
}

/** Deterministický návrh kapitoly 10 z validovaných vstupů – bez volání AI a bez domýšlení údajů. */
export function generateSection10Draft(input: Section10GeneratorInput): Section10DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  if (input.inspectionActivityStatus === "NEPROBEHLA") {
    const noInspectionText =
      input.noInspectionStatement ??
      input.summaryEvaluation ??
      "Podle zadaných údajů ve sledovaném školním roce neproběhla inspekční činnost České školní inspekce.";
    const sections = [
      "10 Údaje o výsledcích inspekční činnosti provedené Českou školní inspekcí",
      "",
      "10.1 Inspekční činnost provedená Českou školní inspekcí",
      "Podle uživatelem zadaných údajů ve sledovaném školním roce neproběhla inspekční činnost České školní inspekce.",
      "",
      "10.2 Výsledky inspekční činnosti a přijatá opatření",
      noInspectionText,
    ];

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

  const intro = input.schoolYear
    ? `Ve školním roce ${input.schoolYear} jsou níže uvedeny pouze údaje zadané školou k inspekční činnosti České školní inspekce.`
    : "Níže jsou uvedeny pouze údaje zadané školou k inspekční činnosti České školní inspekce.";

  const sections = [
    "10 Údaje o výsledcích inspekční činnosti provedené Českou školní inspekcí",
    "",
    intro,
    "",
    "10.1 Inspekční činnost provedená Českou školní inspekcí",
    buildInspectionRows(input.inspections),
    "",
    "10.2 Výsledky inspekční činnosti a přijatá opatření",
    input.summaryEvaluation ?? "Souhrnné vyhodnocení nebylo uvedeno.",
  ];

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

export function isSection10IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION10_INCOMPLETE_DRAFT_PREFIX);
}
