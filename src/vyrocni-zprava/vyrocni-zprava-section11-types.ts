export type Section11SupplementaryActivityStatus = "ANO" | "NE" | "NEUVEDENO";

export type AnnualReportSection11GrantOrSubsidy = {
  title: string;
  provider?: string;
  amount?: number;
  purpose?: string;
  usedAmount?: number;
  note?: string;
};

export type AnnualReportSection11InvestmentOrRepair = {
  title: string;
  amount?: number;
  fundingSource?: string;
  description?: string;
  note?: string;
};

export type AnnualReportSection11Data = {
  reportingPeriod?: string;
  revenue: {
    stateBudgetContribution?: number;
    founderContribution?: number;
    grantsAndProjects?: number;
    ownRevenue?: number;
    donations?: number;
    otherRevenue?: number;
    totalRevenue?: number;
    note?: string;
  };
  expenses: {
    salaryCosts?: number;
    statutoryContributions?: number;
    operatingCosts?: number;
    energyCosts?: number;
    repairsAndMaintenance?: number;
    equipmentAndMaterials?: number;
    services?: number;
    grantsAndProjectsExpenses?: number;
    otherExpenses?: number;
    totalExpenses?: number;
    note?: string;
  };
  economicResult: {
    profitOrLoss?: number;
    mainActivityResult?: number;
    supplementaryActivityResult?: number;
    reserveFundAllocation?: number;
    note?: string;
  };
  grantsAndSubsidies: AnnualReportSection11GrantOrSubsidy[];
  supplementaryActivity: {
    carriedOut?: Section11SupplementaryActivityStatus;
    description?: string;
    revenue?: number;
    expenses?: number;
    result?: number;
    note?: string;
  };
  investmentsAndRepairs: AnnualReportSection11InvestmentOrRepair[];
  summaryCommentary?: string;
  notes?: string;
};

export type Section11StorageEnvelope = {
  version: 1;
  data: AnnualReportSection11Data;
  savedAt: string | null;
};
