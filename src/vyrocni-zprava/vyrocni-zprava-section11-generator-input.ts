import type { SchoolProfile } from "../school-profile/school-profile-types";
import {
  calculateExpensesSubtotal,
  calculateProfitOrLoss,
  calculateRevenueSubtotal,
} from "./vyrocni-zprava-section11-finance-helpers";
import { getSection11Readiness, type Section11Readiness } from "./vyrocni-zprava-section11-data-logic";
import type { AnnualReportSection11Data } from "./vyrocni-zprava-section11-types";

export type Section11GeneratorInput = {
  schoolYear: string;
  school: {
    name?: string;
    schoolType?: string;
  };
  reportingPeriod?: string;
  revenue: AnnualReportSection11Data["revenue"];
  expenses: AnnualReportSection11Data["expenses"];
  economicResult: AnnualReportSection11Data["economicResult"];
  grantsAndSubsidies: AnnualReportSection11Data["grantsAndSubsidies"];
  supplementaryActivity: AnnualReportSection11Data["supplementaryActivity"];
  investmentsAndRepairs: AnnualReportSection11Data["investmentsAndRepairs"];
  summaryCommentary?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section11Readiness["status"];
  suggestedTotals: {
    revenueSubtotal?: number;
    expensesSubtotal?: number;
    profitOrLossFromTotals?: number;
  };
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Sestaví validovaný vstup pro generování kapitoly 11 – bez doplňování chybějících faktů. */
export function buildSection11GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section11Data: AnnualReportSection11Data;
}): Section11GeneratorInput {
  const readiness = getSection11Readiness({
    section11Data: params.section11Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    school: {
      name: pickFilledString(params.schoolProfile.name),
      schoolType: pickFilledString(params.schoolProfile.schoolType),
    },
    reportingPeriod: pickFilledString(params.section11Data.reportingPeriod),
    revenue: {
      ...params.section11Data.revenue,
      note: pickFilledString(params.section11Data.revenue.note),
    },
    expenses: {
      ...params.section11Data.expenses,
      note: pickFilledString(params.section11Data.expenses.note),
    },
    economicResult: {
      ...params.section11Data.economicResult,
      note: pickFilledString(params.section11Data.economicResult.note),
    },
    grantsAndSubsidies: params.section11Data.grantsAndSubsidies.map((item) => ({
      title: pickFilledString(item.title) ?? "",
      provider: pickFilledString(item.provider),
      amount: item.amount,
      purpose: pickFilledString(item.purpose),
      usedAmount: item.usedAmount,
      note: pickFilledString(item.note),
    })),
    supplementaryActivity: {
      ...params.section11Data.supplementaryActivity,
      description: pickFilledString(params.section11Data.supplementaryActivity.description),
      note: pickFilledString(params.section11Data.supplementaryActivity.note),
    },
    investmentsAndRepairs: params.section11Data.investmentsAndRepairs.map((item) => ({
      title: pickFilledString(item.title) ?? "",
      amount: item.amount,
      fundingSource: pickFilledString(item.fundingSource),
      description: pickFilledString(item.description),
      note: pickFilledString(item.note),
    })),
    summaryCommentary: pickFilledString(params.section11Data.summaryCommentary),
    notes: pickFilledString(params.section11Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
    suggestedTotals: {
      revenueSubtotal: calculateRevenueSubtotal(params.section11Data.revenue),
      expensesSubtotal: calculateExpensesSubtotal(params.section11Data.expenses),
      profitOrLossFromTotals: calculateProfitOrLoss(
        params.section11Data.revenue.totalRevenue,
        params.section11Data.expenses.totalExpenses,
      ),
    },
  };
}

export { getSection11Readiness };
