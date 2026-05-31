import React from "react";
import { CalculatorProductShell } from "../CalculatorProductShell";
import type { PageTocSection } from "../PageTableOfContents";
import { ZsWorkflowDockPanel, type ZsWorkflowDockPanelProps } from "./ZsWorkflowDockPanel";

type StickyProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  primaryLabel: string;
  primaryValue: React.ReactNode;
  statusText: string;
  tone: "ok" | "warning" | "danger" | "neutral";
  onSave: () => void;
  onExport: () => void;
};

export type ZsCalculatorShellProps = {
  workspaceStickyRef: React.RefObject<HTMLElement | null>;
  workspaceDockLabel: string;
  sticky: StickyProps;
  dock: ZsWorkflowDockPanelProps;
  main: React.ReactNode;
  afterWorkspace?: React.ReactNode;
  footer: React.ReactNode;
  tocSections: readonly PageTocSection[];
};

export function ZsCalculatorShell({
  workspaceStickyRef,
  workspaceDockLabel,
  sticky,
  dock,
  main,
  afterWorkspace,
  footer,
  tocSections,
}: ZsCalculatorShellProps) {
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
      dockSticky
      dockStickyRef={workspaceStickyRef as React.Ref<HTMLDivElement>}
      dock={<ZsWorkflowDockPanel {...dock} />}
      main={main}
      afterWorkspace={afterWorkspace}
      footer={footer}
      tocSections={tocSections}
    />
  );
}
