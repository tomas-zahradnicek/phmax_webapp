import type { SchoolProfile } from "../school-profile/school-profile-types";
import {
  calculateExpensesSubtotal,
  calculateProfitOrLoss,
  calculateRevenueSubtotal,
} from "./vyrocni-zprava-section11-finance-helpers";
import type {
  AnnualReportSection11Data,
  AnnualReportSection11GrantOrSubsidy,
  AnnualReportSection11InvestmentOrRepair,
  Section11SupplementaryActivityStatus,
} from "./vyrocni-zprava-section11-types";

export const VYROCNI_ZPRAVA_SECTION11_LS_KEY = "vyrocni-zprava-section11-data-v1";

export type Section11Readiness = {
  status: "CHYBI_UDAJE" | "PRIPRAVENO";
  missingData: string[];
  recommendedData: string[];
  availableData: string[];
  warnings: string[];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" ? pickFilledString(value) : undefined;
}

function sanitizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return value;
}

function sanitizeSupplementaryStatus(value: unknown): Section11SupplementaryActivityStatus | undefined {
  return value === "ANO" || value === "NE" || value === "NEUVEDENO" ? value : undefined;
}

function normalizeGrantRow(raw: unknown): AnnualReportSection11GrantOrSubsidy | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    title: sanitizeOptionalText(item.title) ?? "",
    provider: sanitizeOptionalText(item.provider),
    amount: sanitizeOptionalNumber(item.amount),
    purpose: sanitizeOptionalText(item.purpose),
    usedAmount: sanitizeOptionalNumber(item.usedAmount),
    note: sanitizeOptionalText(item.note),
  };
}

function normalizeInvestmentRow(raw: unknown): AnnualReportSection11InvestmentOrRepair | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    title: sanitizeOptionalText(item.title) ?? "",
    amount: sanitizeOptionalNumber(item.amount),
    fundingSource: sanitizeOptionalText(item.fundingSource),
    description: sanitizeOptionalText(item.description),
    note: sanitizeOptionalText(item.note),
  };
}

function hasAnyRevenueValue(revenue: AnnualReportSection11Data["revenue"]): boolean {
  return Boolean(
    revenue.stateBudgetContribution !== undefined ||
      revenue.founderContribution !== undefined ||
      revenue.grantsAndProjects !== undefined ||
      revenue.ownRevenue !== undefined ||
      revenue.donations !== undefined ||
      revenue.otherRevenue !== undefined ||
      revenue.totalRevenue !== undefined,
  );
}

function hasAnyExpensesValue(expenses: AnnualReportSection11Data["expenses"]): boolean {
  return Boolean(
    expenses.salaryCosts !== undefined ||
      expenses.statutoryContributions !== undefined ||
      expenses.operatingCosts !== undefined ||
      expenses.energyCosts !== undefined ||
      expenses.repairsAndMaintenance !== undefined ||
      expenses.equipmentAndMaterials !== undefined ||
      expenses.services !== undefined ||
      expenses.grantsAndProjectsExpenses !== undefined ||
      expenses.otherExpenses !== undefined ||
      expenses.totalExpenses !== undefined,
  );
}

function hasGrantAnyValue(row: AnnualReportSection11GrantOrSubsidy): boolean {
  return Boolean(
    pickFilledString(row.title) ||
      pickFilledString(row.provider) ||
      row.amount !== undefined ||
      pickFilledString(row.purpose) ||
      row.usedAmount !== undefined ||
      pickFilledString(row.note),
  );
}

function hasInvestmentAnyValue(row: AnnualReportSection11InvestmentOrRepair): boolean {
  return Boolean(
    pickFilledString(row.title) ||
      row.amount !== undefined ||
      pickFilledString(row.fundingSource) ||
      pickFilledString(row.description) ||
      pickFilledString(row.note),
  );
}

function checkNegative(warnings: string[], label: string, value: number | undefined): void {
  if (value !== undefined && value < 0) {
    warnings.push(`${label}: záporná hodnota vyžaduje ověření.`);
  }
}

export function createDefaultSection11GrantRow(): AnnualReportSection11GrantOrSubsidy {
  return {
    title: "",
    provider: "",
    amount: undefined,
    purpose: "",
    usedAmount: undefined,
    note: "",
  };
}

export function createDefaultSection11InvestmentRow(): AnnualReportSection11InvestmentOrRepair {
  return {
    title: "",
    amount: undefined,
    fundingSource: "",
    description: "",
    note: "",
  };
}

export function createDefaultSection11Data(): AnnualReportSection11Data {
  return {
    reportingPeriod: "",
    revenue: {
      stateBudgetContribution: undefined,
      founderContribution: undefined,
      grantsAndProjects: undefined,
      ownRevenue: undefined,
      donations: undefined,
      otherRevenue: undefined,
      totalRevenue: undefined,
      note: "",
    },
    expenses: {
      salaryCosts: undefined,
      statutoryContributions: undefined,
      operatingCosts: undefined,
      energyCosts: undefined,
      repairsAndMaintenance: undefined,
      equipmentAndMaterials: undefined,
      services: undefined,
      grantsAndProjectsExpenses: undefined,
      otherExpenses: undefined,
      totalExpenses: undefined,
      note: "",
    },
    economicResult: {
      profitOrLoss: undefined,
      mainActivityResult: undefined,
      supplementaryActivityResult: undefined,
      reserveFundAllocation: undefined,
      note: "",
    },
    grantsAndSubsidies: [],
    supplementaryActivity: {
      carriedOut: "NEUVEDENO",
      description: "",
      revenue: undefined,
      expenses: undefined,
      result: undefined,
      note: "",
    },
    investmentsAndRepairs: [],
    summaryCommentary: "",
    notes: "",
  };
}

export function normalizeSection11Data(raw: unknown): AnnualReportSection11Data | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const revenue = item.revenue && typeof item.revenue === "object" ? (item.revenue as Record<string, unknown>) : {};
  const expenses = item.expenses && typeof item.expenses === "object" ? (item.expenses as Record<string, unknown>) : {};
  const economicResult =
    item.economicResult && typeof item.economicResult === "object" ? (item.economicResult as Record<string, unknown>) : {};
  const supplementaryActivity =
    item.supplementaryActivity && typeof item.supplementaryActivity === "object"
      ? (item.supplementaryActivity as Record<string, unknown>)
      : {};

  return {
    reportingPeriod: sanitizeOptionalText(item.reportingPeriod) ?? "",
    revenue: {
      stateBudgetContribution: sanitizeOptionalNumber(revenue.stateBudgetContribution),
      founderContribution: sanitizeOptionalNumber(revenue.founderContribution),
      grantsAndProjects: sanitizeOptionalNumber(revenue.grantsAndProjects),
      ownRevenue: sanitizeOptionalNumber(revenue.ownRevenue),
      donations: sanitizeOptionalNumber(revenue.donations),
      otherRevenue: sanitizeOptionalNumber(revenue.otherRevenue),
      totalRevenue: sanitizeOptionalNumber(revenue.totalRevenue),
      note: sanitizeOptionalText(revenue.note) ?? "",
    },
    expenses: {
      salaryCosts: sanitizeOptionalNumber(expenses.salaryCosts),
      statutoryContributions: sanitizeOptionalNumber(expenses.statutoryContributions),
      operatingCosts: sanitizeOptionalNumber(expenses.operatingCosts),
      energyCosts: sanitizeOptionalNumber(expenses.energyCosts),
      repairsAndMaintenance: sanitizeOptionalNumber(expenses.repairsAndMaintenance),
      equipmentAndMaterials: sanitizeOptionalNumber(expenses.equipmentAndMaterials),
      services: sanitizeOptionalNumber(expenses.services),
      grantsAndProjectsExpenses: sanitizeOptionalNumber(expenses.grantsAndProjectsExpenses),
      otherExpenses: sanitizeOptionalNumber(expenses.otherExpenses),
      totalExpenses: sanitizeOptionalNumber(expenses.totalExpenses),
      note: sanitizeOptionalText(expenses.note) ?? "",
    },
    economicResult: {
      profitOrLoss: sanitizeOptionalNumber(economicResult.profitOrLoss),
      mainActivityResult: sanitizeOptionalNumber(economicResult.mainActivityResult),
      supplementaryActivityResult: sanitizeOptionalNumber(economicResult.supplementaryActivityResult),
      reserveFundAllocation: sanitizeOptionalNumber(economicResult.reserveFundAllocation),
      note: sanitizeOptionalText(economicResult.note) ?? "",
    },
    grantsAndSubsidies: Array.isArray(item.grantsAndSubsidies)
      ? item.grantsAndSubsidies
          .map(normalizeGrantRow)
          .filter((row): row is AnnualReportSection11GrantOrSubsidy => row !== null)
      : [],
    supplementaryActivity: {
      carriedOut: sanitizeSupplementaryStatus(supplementaryActivity.carriedOut) ?? "NEUVEDENO",
      description: sanitizeOptionalText(supplementaryActivity.description) ?? "",
      revenue: sanitizeOptionalNumber(supplementaryActivity.revenue),
      expenses: sanitizeOptionalNumber(supplementaryActivity.expenses),
      result: sanitizeOptionalNumber(supplementaryActivity.result),
      note: sanitizeOptionalText(supplementaryActivity.note) ?? "",
    },
    investmentsAndRepairs: Array.isArray(item.investmentsAndRepairs)
      ? item.investmentsAndRepairs
          .map(normalizeInvestmentRow)
          .filter((row): row is AnnualReportSection11InvestmentOrRepair => row !== null)
      : [],
    summaryCommentary: sanitizeOptionalText(item.summaryCommentary) ?? "",
    notes: sanitizeOptionalText(item.notes) ?? "",
  };
}

/** Vyhodnotí připravenost kapitoly 11 pouze z ručně zadaných údajů bez inferencí z jiných modulů. */
export function getSection11Readiness(params: {
  section11Data: AnnualReportSection11Data;
  schoolProfile: SchoolProfile;
}): Section11Readiness {
  const d = params.section11Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = pickFilledString(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  if (!pickFilledString(d.reportingPeriod)) {
    missingData.push("Období, za které jsou údaje o hospodaření uváděny");
  } else {
    availableData.push("Vykazované období hospodaření");
  }

  if (!hasAnyRevenueValue(d.revenue)) {
    missingData.push("Alespoň jedna hodnota příjmů/výnosů nebo celkové příjmy/výnosy");
  } else {
    availableData.push("Údaje o příjmech/výnosech");
  }
  if (!hasAnyExpensesValue(d.expenses)) {
    missingData.push("Alespoň jedna hodnota výdajů/nákladů nebo celkové výdaje/náklady");
  } else {
    availableData.push("Údaje o výdajích/nákladech");
  }

  const summaryCommentary = pickFilledString(d.summaryCommentary);
  if (!summaryCommentary) {
    missingData.push("Souhrnný komentář k hospodaření školy");
  } else {
    availableData.push("Souhrnný komentář k hospodaření školy");
    if (summaryCommentary.length < 80) {
      warnings.push("Souhrnný komentář je velmi stručný. Zvažte doplnění kontextu k hospodaření školy.");
    }
  }

  if (d.revenue.totalRevenue === undefined) recommendedData.push("Příjmy / výnosy celkem");
  if (d.expenses.totalExpenses === undefined) recommendedData.push("Výdaje / náklady celkem");
  if (d.economicResult.profitOrLoss === undefined) recommendedData.push("Hospodářský výsledek");
  if (d.revenue.founderContribution === undefined) recommendedData.push("Příspěvek zřizovatele");
  if (d.revenue.stateBudgetContribution === undefined) recommendedData.push("Příspěvek ze státního rozpočtu");
  if (d.revenue.grantsAndProjects === undefined) recommendedData.push("Dotace a projekty (příjmy)");
  if (!d.supplementaryActivity.carriedOut || d.supplementaryActivity.carriedOut === "NEUVEDENO") {
    recommendedData.push("Informace o doplňkové činnosti");
  }
  if (d.grantsAndSubsidies.length === 0) recommendedData.push("Přehled dotací, grantů a projektů");
  if (d.investmentsAndRepairs.length === 0) recommendedData.push("Přehled investic, oprav a větších nákupů");
  if (!pickFilledString(d.notes)) recommendedData.push("Poznámky");

  const revenueSubtotal = calculateRevenueSubtotal(d.revenue);
  const expensesSubtotal = calculateExpensesSubtotal(d.expenses);
  const calculatedProfitOrLoss = calculateProfitOrLoss(d.revenue.totalRevenue, d.expenses.totalExpenses);

  if (revenueSubtotal !== undefined && d.revenue.totalRevenue !== undefined && revenueSubtotal !== d.revenue.totalRevenue) {
    warnings.push("Celkové příjmy/výnosy neodpovídají součtu zadaných příjmových položek.");
  }
  if (expensesSubtotal !== undefined && d.expenses.totalExpenses !== undefined && expensesSubtotal !== d.expenses.totalExpenses) {
    warnings.push("Celkové výdaje/náklady neodpovídají součtu zadaných výdajových položek.");
  }
  if (
    calculatedProfitOrLoss !== undefined &&
    d.economicResult.profitOrLoss !== undefined &&
    calculatedProfitOrLoss !== d.economicResult.profitOrLoss
  ) {
    warnings.push("Hospodářský výsledek neodpovídá rozdílu celkových příjmů/výnosů a výdajů/nákladů.");
  }

  if (d.supplementaryActivity.carriedOut === "ANO") {
    if (!pickFilledString(d.supplementaryActivity.description)) {
      warnings.push("Doplňková činnost je označena jako vykonávaná, ale chybí její popis.");
    }
    if (d.supplementaryActivity.result === undefined) {
      warnings.push("Doplňková činnost je označena jako vykonávaná, ale chybí uvedení výsledku.");
    }
  }

  d.grantsAndSubsidies.forEach((row, index) => {
    if (!hasGrantAnyValue(row)) return;
    if (!pickFilledString(row.title)) warnings.push(`Dotace/projekt ${index + 1}: chybí název.`);
    if (row.amount !== undefined && row.usedAmount !== undefined && row.usedAmount > row.amount) {
      warnings.push(`Dotace/projekt ${index + 1}: čerpaná částka je vyšší než uvedená částka.`);
    }
  });

  d.investmentsAndRepairs.forEach((row, index) => {
    if (!hasInvestmentAnyValue(row)) return;
    if (!pickFilledString(row.title)) warnings.push(`Investice/oprava ${index + 1}: chybí název akce/pořízení.`);
  });

  checkNegative(warnings, "Příspěvek ze státního rozpočtu", d.revenue.stateBudgetContribution);
  checkNegative(warnings, "Příspěvek zřizovatele", d.revenue.founderContribution);
  checkNegative(warnings, "Dotace a projekty (příjmy)", d.revenue.grantsAndProjects);
  checkNegative(warnings, "Vlastní příjmy", d.revenue.ownRevenue);
  checkNegative(warnings, "Dary", d.revenue.donations);
  checkNegative(warnings, "Ostatní příjmy", d.revenue.otherRevenue);
  checkNegative(warnings, "Příjmy/výnosy celkem", d.revenue.totalRevenue);

  checkNegative(warnings, "Mzdové náklady", d.expenses.salaryCosts);
  checkNegative(warnings, "Zákonné odvody", d.expenses.statutoryContributions);
  checkNegative(warnings, "Provozní náklady", d.expenses.operatingCosts);
  checkNegative(warnings, "Energie", d.expenses.energyCosts);
  checkNegative(warnings, "Opravy a údržba", d.expenses.repairsAndMaintenance);
  checkNegative(warnings, "Vybavení a materiál", d.expenses.equipmentAndMaterials);
  checkNegative(warnings, "Služby", d.expenses.services);
  checkNegative(warnings, "Výdaje projektů a dotací", d.expenses.grantsAndProjectsExpenses);
  checkNegative(warnings, "Ostatní výdaje", d.expenses.otherExpenses);
  checkNegative(warnings, "Výdaje/náklady celkem", d.expenses.totalExpenses);

  checkNegative(warnings, "Hospodářský výsledek", d.economicResult.profitOrLoss);
  checkNegative(warnings, "Výsledek hlavní činnosti", d.economicResult.mainActivityResult);
  checkNegative(warnings, "Výsledek doplňkové činnosti", d.economicResult.supplementaryActivityResult);
  checkNegative(warnings, "Příděl do rezervního fondu", d.economicResult.reserveFundAllocation);

  checkNegative(warnings, "Výnosy doplňkové činnosti", d.supplementaryActivity.revenue);
  checkNegative(warnings, "Náklady doplňkové činnosti", d.supplementaryActivity.expenses);
  checkNegative(warnings, "Výsledek doplňkové činnosti", d.supplementaryActivity.result);

  d.grantsAndSubsidies.forEach((row, index) => {
    checkNegative(warnings, `Dotace/projekt ${index + 1} - částka`, row.amount);
    checkNegative(warnings, `Dotace/projekt ${index + 1} - čerpáno`, row.usedAmount);
  });
  d.investmentsAndRepairs.forEach((row, index) => {
    checkNegative(warnings, `Investice/oprava ${index + 1} - částka`, row.amount);
  });

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
    warnings,
  };
}
