import type { CrossPhmaxSummary } from "../phmax-dashboard-cross-phmax";
import type { DashboardLastExportRecord } from "../phmax-dashboard-last-export";
import type { ProductView } from "../ProductViewPills";

export type DashboardSchoolProfileModuleChip = {
  id: Exclude<ProductView, "dash">;
  label: string;
  active: boolean;
  needsAttention: boolean;
  phmaxLabel: string;
};

export type DashboardSchoolProfileModel = {
  tone: "ok" | "warning" | "neutral";
  scenarioLabel: string;
  modulesInUse: number;
  modulesOk: number;
  attentionCount: number;
  totalPhmax: number | null;
  totalPhmaxIncomplete: boolean;
  namedBackupsTotal: number;
  lastExportLabel: string;
  moduleChips: DashboardSchoolProfileModuleChip[];
  lead: string | null;
};

type BuildDashboardSchoolProfileInput = {
  moduleLabels: Record<Exclude<ProductView, "dash">, string>;
  rows: ReadonlyArray<{
    id: Exclude<ProductView, "dash">;
    hasData: boolean;
    namedBackups: number;
    primaryKpi: { value: string };
    verdict: { tone: string } | null;
  }>;
  crossPhmax: CrossPhmaxSummary;
  scenarioLabel: string;
  attentionCount: number;
  modulesOk: number;
  lastExport: DashboardLastExportRecord | null;
  formatLastExport: (record: DashboardLastExportRecord | null) => string;
  hasUnusedModules: boolean;
};

function dashboardVerdictNeedsAttention(verdict: { tone: string } | null): boolean {
  return verdict?.tone === "warning" || verdict?.tone === "danger";
}

export function buildDashboardSchoolProfile(input: BuildDashboardSchoolProfileInput): DashboardSchoolProfileModel {
  const modulesInUse = input.rows.filter((row) => row.hasData).length;
  const tone: DashboardSchoolProfileModel["tone"] =
    input.attentionCount > 0 ? "warning" : modulesInUse === 0 ? "neutral" : "ok";

  let lead: string | null = null;
  if (tone === "warning") {
    lead = "Opravte označené moduly před použitím souhrnného PHmax.";
  } else if (tone === "ok" && input.attentionCount === 0) {
    lead = input.hasUnusedModules
      ? "Vyplněné moduly jsou v pořádku. Ostatní moduly vyplňujte jen pokud je vaše škola provozuje."
      : "Škola připravena – vyplněné moduly bez chyb.";
  }

  return {
    tone,
    scenarioLabel: input.scenarioLabel.trim() || "Bez názvu scénáře",
    modulesInUse,
    modulesOk: input.modulesOk,
    attentionCount: input.attentionCount,
    totalPhmax: input.crossPhmax.totalPhmax,
    totalPhmaxIncomplete: input.crossPhmax.hasIncomplete,
    namedBackupsTotal: input.rows.reduce((sum, row) => sum + row.namedBackups, 0),
    lastExportLabel: input.formatLastExport(input.lastExport),
    moduleChips: input.rows.map((row) => ({
      id: row.id,
      label: input.moduleLabels[row.id],
      active: row.hasData,
      needsAttention: row.hasData && dashboardVerdictNeedsAttention(row.verdict),
      phmaxLabel: row.primaryKpi.value,
    })),
    lead,
  };
}
