import React from "react";
import { BasicComparePreview } from "../BasicComparePreview";
import { CalculatorWorkflowDock, type WorkflowDockStep } from "../CalculatorWorkflowDock";
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { CompareProductVariantsResult } from "../phmax-product-compare";
import type { SdDepartmentInput } from "../phmax-sd-logic";

export type SdWorkflowDockPanelProps = {
  sdVerdictTone: "ok" | "warning" | "danger" | "neutral";
  sdPhmaxDisplay: React.ReactNode;
  pupils: number;
  inputMode: "summary" | "detail";
  detailDepartments: readonly SdDepartmentInput[];
  effectiveDepts: number;
  reductionApplied: boolean;
  reductionFactor: number;
  sdVerdictLabel: string;
  sdVerdictDetail: string;
  sdBasicWizardActive: boolean;
  sdWorkflowSteps: readonly WorkflowDockStep[];
  viewMode: CalculatorViewMode;
  sdComparePreview: CompareProductVariantsResult | null;
  selectedNamedId: string;
  sdHasInputIssue: boolean;
  onGoToIssue: () => void;
  saveSdSnapshotManually: () => void;
  handleExportCsv: () => void;
  handleCompareWithNamedSnapshot: () => void;
};

export function SdWorkflowDockPanel({
  sdVerdictTone,
  sdPhmaxDisplay,
  pupils,
  inputMode,
  detailDepartments,
  effectiveDepts,
  reductionApplied,
  reductionFactor,
  sdVerdictLabel,
  sdVerdictDetail,
  sdBasicWizardActive,
  sdWorkflowSteps,
  viewMode,
  sdComparePreview,
  selectedNamedId,
  sdHasInputIssue,
  onGoToIssue,
  saveSdSnapshotManually,
  handleExportCsv,
  handleCompareWithNamedSnapshot,
}: SdWorkflowDockPanelProps) {
  return (
    <CalculatorWorkflowDock
      tone={sdVerdictTone}
      primaryLabel="PHmax"
      primaryValue={sdPhmaxDisplay}
      stats={[
        { label: "Účastníci (1. st.)", value: pupils },
        {
          label: "Oddělení",
          value: inputMode === "detail" ? detailDepartments.length : effectiveDepts,
        },
        {
          label: "Krácení § 10 odst. 2",
          value: reductionApplied
            ? `ano (${(Math.round(reductionFactor * 1000) / 10).toLocaleString("cs-CZ")} %)`
            : "ne",
        },
      ]}
      statusBadge={sdVerdictLabel}
      verdictLabel={sdVerdictLabel}
      verdictDetail={sdVerdictDetail}
      workflowSteps={sdBasicWizardActive ? [] : sdWorkflowSteps}
      viewMode={viewMode}
      footer={
        viewMode === "basic" ? (
          <BasicComparePreview
            result={sdComparePreview}
            inactive={!selectedNamedId}
            emptyHint="Vyberte pojmenovanou zálohu v horní liště pro rychlé porovnání PHmax."
          />
        ) : null
      }
      actions={[
        ...(sdHasInputIssue ? [{ label: "Přejít k chybě", onClick: onGoToIssue }] : []),
        { label: "Uložit scénář", onClick: saveSdSnapshotManually },
        { label: "Export CSV", onClick: handleExportCsv },
        { label: "Porovnat se zálohou", onClick: handleCompareWithNamedSnapshot },
      ]}
    />
  );
}
