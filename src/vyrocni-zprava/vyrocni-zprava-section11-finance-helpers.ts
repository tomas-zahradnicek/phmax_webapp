import type { AnnualReportSection11Data } from "./vyrocni-zprava-section11-types";
import { formatCzechCzk } from "./vyrocni-zprava-number-formatting-helpers";

type Revenue = AnnualReportSection11Data["revenue"];
type Expenses = AnnualReportSection11Data["expenses"];

function isUsableNumber(value: number | undefined): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

export function calculateRevenueSubtotal(revenue: Revenue): number | undefined {
  const values = [
    revenue.stateBudgetContribution,
    revenue.founderContribution,
    revenue.grantsAndProjects,
    revenue.ownRevenue,
    revenue.donations,
    revenue.otherRevenue,
  ].filter(isUsableNumber);
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

export function calculateExpensesSubtotal(expenses: Expenses): number | undefined {
  const values = [
    expenses.salaryCosts,
    expenses.statutoryContributions,
    expenses.operatingCosts,
    expenses.energyCosts,
    expenses.repairsAndMaintenance,
    expenses.equipmentAndMaterials,
    expenses.services,
    expenses.grantsAndProjectsExpenses,
    expenses.otherExpenses,
  ].filter(isUsableNumber);
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

export function calculateProfitOrLoss(totalRevenue?: number, totalExpenses?: number): number | undefined {
  if (!isUsableNumber(totalRevenue) || !isUsableNumber(totalExpenses)) return undefined;
  return totalRevenue - totalExpenses;
}

export function formatCzkAmount(value: number | undefined): string {
  return formatCzechCzk(value);
}
