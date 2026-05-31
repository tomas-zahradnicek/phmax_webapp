import React from "react";
import { CalculatorWorkflowDock } from "../CalculatorWorkflowDock";
import type { CalculatorViewMode } from "../calculator-view-mode";
import { MODE_CONFIG, formatModeRežimStatValue, type CalculatorMode } from "../config/calculator-config";
import { formatZsLayContextLine } from "../calculator-ui-constants";
import type { ZsWorkflowStep } from "./zs-form-validation";

export type ZsWorkflowDockPanelProps = {
  tab: "phmax" | "pha" | "php";
  setTab: (tab: "phmax" | "pha" | "php") => void;
  mode: CalculatorMode;
  incompleteSections: number;
  zsTabPrimaryLabel: string;
  zsTabPrimaryValue: React.ReactNode;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  zsVerdictTone: "ok" | "warning" | "danger" | "neutral";
  zsVerdictLabel: string;
  zsVerdictDetail: string;
  zsDockIssueSummaries: readonly string[];
  zsBasicWizardActive: boolean;
  zsWorkflowSteps: readonly ZsWorkflowStep[];
  viewMode: CalculatorViewMode;
  firstIssueSection: string;
  goToSection: (section: string) => void;
  saveSnapshotManually: () => void;
  handleExportCsv: () => void;
  handleCompareZsWithNamedSnapshot: () => void;
};

export function ZsWorkflowDockPanel({
  tab,
  setTab,
  mode,
  incompleteSections,
  zsTabPrimaryLabel,
  zsTabPrimaryValue,
  totalPhmax,
  totalPha,
  totalPhp,
  zsVerdictTone,
  zsVerdictLabel,
  zsVerdictDetail,
  zsDockIssueSummaries,
  zsBasicWizardActive,
  zsWorkflowSteps,
  viewMode,
  firstIssueSection,
  goToSection,
  saveSnapshotManually,
  handleExportCsv,
  handleCompareZsWithNamedSnapshot,
}: ZsWorkflowDockPanelProps) {
  return (
    <CalculatorWorkflowDock
      header={
        <>
          <div className="tabs tabs--sticky tabs--sticky-sdlike">
            <button type="button" className={tab === "phmax" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("phmax")}>
              PHmax
            </button>
            <button type="button" className={tab === "pha" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("pha")}>
              PHAmax
            </button>
            <button type="button" className={tab === "php" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("php")}>
              PHPmax
            </button>
          </div>
          <p className="muted-text workflow-dock__context-line">
            {formatZsLayContextLine(MODE_CONFIG[mode].label, tab, incompleteSections)}
          </p>
        </>
      }
      tone={zsVerdictTone}
      primaryLabel={zsTabPrimaryLabel}
      primaryValue={zsTabPrimaryValue}
      statusBadge={zsVerdictLabel}
      stats={[
        { label: "PHmax", value: totalPhmax },
        { label: "PHAmax", value: totalPha },
        { label: "PHPmax", value: totalPhp },
        { label: "Režim", value: formatModeRežimStatValue(MODE_CONFIG[mode].label) },
      ]}
      verdictLabel={zsVerdictLabel}
      verdictDetail={zsDockIssueSummaries.length > 0 ? "" : zsVerdictDetail}
      issueSummaries={zsDockIssueSummaries}
      workflowSteps={zsBasicWizardActive ? [] : zsWorkflowSteps}
      viewMode={viewMode}
      actions={[
        ...(firstIssueSection
          ? [{ label: "Přejít k chybě", onClick: () => goToSection(firstIssueSection) }]
          : []),
        { label: "Uložit scénář", onClick: saveSnapshotManually },
        { label: "Export CSV", onClick: handleExportCsv },
        { label: "Porovnat se zálohou", onClick: handleCompareZsWithNamedSnapshot },
      ]}
    />
  );
}
