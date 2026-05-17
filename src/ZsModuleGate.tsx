import React from "react";
import type { CalculatorViewMode } from "./calculator-view-mode";
import { CollapsibleSection } from "./CollapsibleSection";

const ZS_BASIC_ALWAYS_OPEN = new Set(["setup", "basic", "phmax-summary", "overview"]);

type ZsModuleGateProps = {
  sectionId: string;
  title: string;
  viewMode: CalculatorViewMode;
  /** V základním režimu nechat modul rozbalený (např. aktivní záložka PHAmax/PHPmax). */
  defaultOpenInBasic?: boolean;
  children: React.ReactNode;
};

/** V základním režimu sbalí doplňkové moduly; setup, basic a souhrny zůstávají otevřené. */
export function ZsModuleGate({
  sectionId,
  title,
  viewMode,
  defaultOpenInBasic = false,
  children,
}: ZsModuleGateProps) {
  if (viewMode === "expert" || ZS_BASIC_ALWAYS_OPEN.has(sectionId)) {
    return <>{children}</>;
  }
  return (
    <CollapsibleSection
      summary={title}
      defaultOpen={defaultOpenInBasic || sectionId === "basic"}
      level="advanced"
    >
      {children}
    </CollapsibleSection>
  );
}
