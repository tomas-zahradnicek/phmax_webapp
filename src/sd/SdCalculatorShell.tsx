import React from "react";
import { CalculatorProductShell } from "../CalculatorProductShell";
import type { PageTocSection } from "../PageTableOfContents";
import { SdWorkflowDockPanel, type SdWorkflowDockPanelProps } from "./SdWorkflowDockPanel";

type StickyProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  primaryLabel: string;
  primaryValue: React.ReactNode;
  statusText: string;
  tone: "ok" | "warning" | "danger" | "neutral";
  onSave: () => void;
  onExport: () => void;
};

export type SdCalculatorShellProps = {
  workspaceDockLabel: string;
  sticky: StickyProps;
  dock: SdWorkflowDockPanelProps;
  main: React.ReactNode;
  afterWorkspace?: React.ReactNode;
  footer: React.ReactNode;
  tocSections: readonly PageTocSection[];
};

export function SdCalculatorShell({
  workspaceDockLabel,
  sticky,
  dock,
  main,
  afterWorkspace,
  footer,
  tocSections,
}: SdCalculatorShellProps) {
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
      workspaceDockLabel={workspaceDockLabel}
      dock={<SdWorkflowDockPanel {...dock} />}
      main={main}
      afterWorkspace={afterWorkspace}
      footer={footer}
      tocSections={tocSections}
    />
  );
}
