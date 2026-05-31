import React from "react";
import { BasicComparePreview } from "../BasicComparePreview";
import { CalculatorWorkflowDock, type WorkflowDockStep } from "../CalculatorWorkflowDock";
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { CompareProductVariantsResult } from "../phmax-product-compare";

export type PvWorkflowDockPanelProps = {
  pvVerdictTone: "ok" | "warning" | "danger" | "neutral";
  phmaxTotalDisplay: React.ReactNode;
  phaSum: number;
  workplaceCount: number;
  pvVerdictLabel: string;
  pvVerdictDetail: string;
  pvBasicWizardActive: boolean;
  pvWorkflowSteps: readonly WorkflowDockStep[];
  viewMode: CalculatorViewMode;
  pvComparePreview: CompareProductVariantsResult | null;
  selectedNamedId: string;
  pvHasInputIssue: boolean;
  onGoToIssue: () => void;
  savePvSnapshotManually: () => void;
  handleExportCsv: () => void;
  handleCompareWithNamedSnapshot: () => void;
};

export function PvWorkflowDockPanel({
  pvVerdictTone,
  phmaxTotalDisplay,
  phaSum,
  workplaceCount,
  pvVerdictLabel,
  pvVerdictDetail,
  pvBasicWizardActive,
  pvWorkflowSteps,
  viewMode,
  pvComparePreview,
  selectedNamedId,
  pvHasInputIssue,
  onGoToIssue,
  savePvSnapshotManually,
  handleExportCsv,
  handleCompareWithNamedSnapshot,
}: PvWorkflowDockPanelProps) {
  return (
    <CalculatorWorkflowDock
      tone={pvVerdictTone}
      primaryLabel="PHmax celkem"
      primaryValue={phmaxTotalDisplay}
      statusBadge={pvVerdictLabel}
      stats={[
        { label: "PHAmax celkem", value: phaSum > 0 ? phaSum : "–" },
        { label: "Pracoviště ve výpočtu", value: workplaceCount },
      ]}
      verdictLabel={pvVerdictLabel}
      verdictDetail={pvVerdictDetail}
      workflowSteps={pvBasicWizardActive ? [] : pvWorkflowSteps}
      viewMode={viewMode}
      footer={
        viewMode === "basic" ? (
          <BasicComparePreview
            result={pvComparePreview}
            inactive={!selectedNamedId}
            emptyHint="Vyberte pojmenovanou zálohu v horní liště pro rychlé porovnání PHmax."
          />
        ) : null
      }
      actions={[
        ...(pvHasInputIssue ? [{ label: "Přejít k chybě", onClick: onGoToIssue }] : []),
        { label: "Uložit scénář", onClick: savePvSnapshotManually },
        { label: "Export CSV", onClick: handleExportCsv },
        { label: "Porovnat se zálohou", onClick: handleCompareWithNamedSnapshot },
      ]}
    />
  );
}
