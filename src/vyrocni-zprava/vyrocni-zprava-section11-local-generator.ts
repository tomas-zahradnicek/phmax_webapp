import { formatCzkAmount } from "./vyrocni-zprava-section11-finance-helpers";
import type { Section11GeneratorInput } from "./vyrocni-zprava-section11-generator-input";

export const SECTION11_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 11 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section11DraftResult = {
  ready: boolean;
  text: string;
};

function buildIncompleteDraft(input: Section11GeneratorInput): string {
  const sections = [SECTION11_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
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

function buildRevenueSection(input: Section11GeneratorInput): string {
  const r = input.revenue;
  const lines = [
    `Příspěvek ze státního rozpočtu: ${formatCzkAmount(r.stateBudgetContribution)}.`,
    `Příspěvek zřizovatele: ${formatCzkAmount(r.founderContribution)}.`,
    `Dotace a projekty: ${formatCzkAmount(r.grantsAndProjects)}.`,
    `Vlastní příjmy: ${formatCzkAmount(r.ownRevenue)}.`,
    `Dary: ${formatCzkAmount(r.donations)}.`,
    `Ostatní příjmy: ${formatCzkAmount(r.otherRevenue)}.`,
    `Příjmy/výnosy celkem (uvedeno školou): ${formatCzkAmount(r.totalRevenue)}.`,
  ];
  if (input.suggestedTotals.revenueSubtotal !== undefined) {
    lines.push(`Orientační součet zadaných položek příjmů: ${formatCzkAmount(input.suggestedTotals.revenueSubtotal)}.`);
  }
  if (r.note) lines.push(`Poznámka k příjmům/výnosům: ${r.note}.`);
  return lines.join("\n");
}

function buildExpensesSection(input: Section11GeneratorInput): string {
  const e = input.expenses;
  const lines = [
    `Mzdové náklady: ${formatCzkAmount(e.salaryCosts)}.`,
    `Zákonné odvody: ${formatCzkAmount(e.statutoryContributions)}.`,
    `Provozní náklady: ${formatCzkAmount(e.operatingCosts)}.`,
    `Energie: ${formatCzkAmount(e.energyCosts)}.`,
    `Opravy a údržba: ${formatCzkAmount(e.repairsAndMaintenance)}.`,
    `Vybavení a materiál: ${formatCzkAmount(e.equipmentAndMaterials)}.`,
    `Služby: ${formatCzkAmount(e.services)}.`,
    `Výdaje projektů a dotací: ${formatCzkAmount(e.grantsAndProjectsExpenses)}.`,
    `Ostatní výdaje: ${formatCzkAmount(e.otherExpenses)}.`,
    `Výdaje/náklady celkem (uvedeno školou): ${formatCzkAmount(e.totalExpenses)}.`,
  ];
  if (input.suggestedTotals.expensesSubtotal !== undefined) {
    lines.push(`Orientační součet zadaných položek výdajů: ${formatCzkAmount(input.suggestedTotals.expensesSubtotal)}.`);
  }
  if (e.note) lines.push(`Poznámka k výdajům/nákladům: ${e.note}.`);
  return lines.join("\n");
}

function buildGrantsSection(input: Section11GeneratorInput): string {
  const rows = input.grantsAndSubsidies.filter(
    (item) => item.title || item.provider || item.amount !== undefined || item.purpose || item.usedAmount !== undefined || item.note,
  );
  if (rows.length === 0) return "V podkladech nejsou uvedeny konkrétní dotace, granty ani projekty.";
  return rows
    .map((item) => {
      const title = item.title || "Dotace/projekt bez názvu";
      const details = [
        item.provider ? `poskytovatel: ${item.provider}` : undefined,
        item.amount !== undefined ? `částka: ${formatCzkAmount(item.amount)}` : undefined,
        item.purpose ? `účel: ${item.purpose}` : undefined,
        item.usedAmount !== undefined ? `čerpáno: ${formatCzkAmount(item.usedAmount)}` : undefined,
        item.note ? `poznámka: ${item.note}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");
      return `- ${title}${details ? ` (${details})` : ""}`;
    })
    .join("\n");
}

function buildSupplementarySection(input: Section11GeneratorInput): string {
  const s = input.supplementaryActivity;
  const statusLabel = s.carriedOut === "ANO" ? "ANO" : s.carriedOut === "NE" ? "NE" : "NEUVEDENO";
  const lines = [
    `Doplňková činnost vykonávána: ${statusLabel}.`,
    s.description ? `Popis doplňkové činnosti: ${s.description}.` : undefined,
    s.revenue !== undefined ? `Výnosy doplňkové činnosti: ${formatCzkAmount(s.revenue)}.` : undefined,
    s.expenses !== undefined ? `Náklady doplňkové činnosti: ${formatCzkAmount(s.expenses)}.` : undefined,
    s.result !== undefined ? `Výsledek doplňkové činnosti: ${formatCzkAmount(s.result)}.` : undefined,
    s.note ? `Poznámka: ${s.note}.` : undefined,
  ].filter(Boolean);
  return lines.join("\n");
}

function buildInvestmentsSection(input: Section11GeneratorInput): string {
  const rows = input.investmentsAndRepairs.filter(
    (item) => item.title || item.amount !== undefined || item.fundingSource || item.description || item.note,
  );
  if (rows.length === 0) return "V podkladech nejsou uvedeny konkrétní investice, opravy ani větší nákupy.";
  return rows
    .map((item) => {
      const title = item.title || "Akce/pořízení bez názvu";
      const details = [
        item.amount !== undefined ? `částka: ${formatCzkAmount(item.amount)}` : undefined,
        item.fundingSource ? `zdroj financování: ${item.fundingSource}` : undefined,
        item.description ? `popis: ${item.description}` : undefined,
        item.note ? `poznámka: ${item.note}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");
      return `- ${title}${details ? ` (${details})` : ""}`;
    })
    .join("\n");
}

/** Deterministický návrh kapitoly 11 z validovaných vstupů – bez volání AI a bez domýšlení údajů. */
export function generateSection11Draft(input: Section11GeneratorInput): Section11DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const e = input.economicResult;
  const sections = [
    "11 Základní údaje o hospodaření školy",
    "",
    `Vykazované období: ${input.reportingPeriod ?? "neuvedeno"}.`,
    "",
    "11.1 Přehled příjmů a výdajů školy",
    buildRevenueSection(input),
    "",
    buildExpensesSection(input),
    "",
    "11.2 Hospodářský výsledek",
    `Hospodářský výsledek: ${formatCzkAmount(e.profitOrLoss)}.`,
    e.mainActivityResult !== undefined ? `Výsledek hlavní činnosti: ${formatCzkAmount(e.mainActivityResult)}.` : undefined,
    e.supplementaryActivityResult !== undefined
      ? `Výsledek doplňkové činnosti: ${formatCzkAmount(e.supplementaryActivityResult)}.`
      : undefined,
    e.reserveFundAllocation !== undefined ? `Příděl do rezervního fondu: ${formatCzkAmount(e.reserveFundAllocation)}.` : undefined,
    input.suggestedTotals.profitOrLossFromTotals !== undefined
      ? `Orientační výsledek z uvedených celkových příjmů a výdajů: ${formatCzkAmount(input.suggestedTotals.profitOrLossFromTotals)}.`
      : undefined,
    e.note ? `Poznámka k hospodářskému výsledku: ${e.note}.` : undefined,
    "",
    "11.3 Dotace, granty a projekty",
    buildGrantsSection(input),
    "",
    "11.4 Doplňková činnost",
    buildSupplementarySection(input),
    "",
    "11.5 Investice, opravy a větší nákupy",
    buildInvestmentsSection(input),
    "",
    "11.6 Souhrnný komentář k hospodaření školy",
    input.summaryCommentary ?? "Souhrnný komentář nebyl uveden.",
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

export function isSection11IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION11_INCOMPLETE_DRAFT_PREFIX);
}
