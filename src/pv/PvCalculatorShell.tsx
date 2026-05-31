import React from "react";
import { CalculatorProductShell } from "../CalculatorProductShell";
import type { PageTocSection } from "../PageTableOfContents";
import { PvWorkflowDockPanel, type PvWorkflowDockPanelProps } from "./PvWorkflowDockPanel";

type StickyProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  primaryLabel: string;
  primaryValue: React.ReactNode;
  statusText: string;
  tone: "ok" | "warning" | "danger" | "neutral";
  onSave: () => void;
  onExport: () => void;
};

export type PvCalculatorShellProps = {
  workspaceDockLabel: string;
  sticky: StickyProps;
  dock: PvWorkflowDockPanelProps;
  main: React.ReactNode;
  afterWorkspace?: React.ReactNode;
  footer: React.ReactNode;
  tocSections: readonly PageTocSection[];
};

export function PvCalculatorShell({
  workspaceDockLabel,
  sticky,
  dock,
  main,
  afterWorkspace,
  footer,
  tocSections,
}: PvCalculatorShellProps) {
  return (
    <CalculatorProductShell
      sticky={{
        anchorRef: sticky.anchorRef,
        primaryLabel: sticky.primaryLabel,
        primaryValue: sticky.primaryValue,
        statusText: sticky.statusText,
        tone: sticky.tone,
        onSave: sticky.onSave,
        onExport: sticky.onExport,
      }}
      workspaceVariant="input-heavy"
      workspaceDockLabel={workspaceDockLabel}
      dock={<PvWorkflowDockPanel {...dock} />}
      main={main}
      afterWorkspace={afterWorkspace}
      footer={footer}
      tocSections={tocSections}
    />
  );
}
