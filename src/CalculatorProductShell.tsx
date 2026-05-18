import React from "react";
import { CALCULATOR_WORKSPACE_DOCK_LABEL } from "./calculator-ui-constants";
import { CalculatorStickyContextBar } from "./CalculatorStickyContextBar";
import { CalculatorWorkspaceLayout } from "./CalculatorWorkspaceLayout";
import { PageTableOfContents, type PageTocSection } from "./PageTableOfContents";

type CalculatorProductShellProps = {
  /** Sticky lišta pod hero (volitelná). */
  sticky?: React.ComponentProps<typeof CalculatorStickyContextBar>;
  /** Obsah před workspace (nápověda, rychlý start, wizard). */
  beforeWorkspace?: React.ReactNode;
  /** Obsah po workspace (metodika, legislativa). */
  afterWorkspace?: React.ReactNode;
  workspaceVariant?: "default" | "input-heavy";
  workspaceDockLabel?: string;
  main: React.ReactNode;
  dock: React.ReactNode;
  /** ZŠ vzor: sticky obal docku s tabs v hlavičce. */
  dockSticky?: boolean;
  dockStickyId?: string;
  dockStickyRef?: React.Ref<HTMLDivElement>;
  footer?: React.ReactNode;
  tocSections?: readonly PageTocSection[];
};

/**
 * MASTER šablona produktové stránky (vzor ZŠ / PV / ŠD):
 * sticky kontext → workspace (formulář vlevo, dock vpravo) → patička → TOC.
 */
export function CalculatorProductShell({
  sticky,
  beforeWorkspace,
  afterWorkspace,
  workspaceVariant = "default",
  workspaceDockLabel = CALCULATOR_WORKSPACE_DOCK_LABEL,
  main,
  dock,
  dockSticky = false,
  dockStickyId = "workspace-results-dock",
  dockStickyRef,
  footer,
  tocSections,
}: CalculatorProductShellProps) {
  const dockNode = dockSticky ? (
    <div ref={dockStickyRef} className="workspace-sticky calculator-workspace-dock" id={dockStickyId}>
      {dock}
    </div>
  ) : (
    dock
  );

  return (
    <>
      {sticky ? <CalculatorStickyContextBar {...sticky} /> : null}
      {beforeWorkspace}
      <CalculatorWorkspaceLayout
        variant={workspaceVariant}
        dockLabel={workspaceDockLabel}
        main={main}
        dock={dockNode}
      />
      {afterWorkspace}
      {footer}
      {tocSections && tocSections.length > 0 ? <PageTableOfContents sections={tocSections} /> : null}
    </>
  );
}
