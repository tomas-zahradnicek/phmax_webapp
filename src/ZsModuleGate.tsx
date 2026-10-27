import React from "react";
import type { CalculatorViewMode } from "./calculator-view-mode";
import { CollapsibleSection } from "./CollapsibleSection";

const ZS_BASIC_ALWAYS_OPEN = new Set(["setup", "basic", "phmax-summary", "overview"]);

/**
 * PHmax moduly kroku 3. Vnější `<details>` musí nést krok 3, jinak summary
 * zůstane klikací na krocích 1, 2, 4 a 5, zatímco tělo wizard CSS skryje.
 * PHAmax / PHPmax sem nepatří.
 */
const ZS_PHMAX_WIZARD_STEP_3 = new Set([
  "sec16",
  "extras",
  "psych",
  "health",
  "minority",
  "gym",
  "mixed",
  "special",
]);

type ZsModuleGateProps = {
  sectionId: string;
  title: string;
  viewMode: CalculatorViewMode;
  /** V základním režimu nechat modul rozbalený (např. aktivní záložka PHAmax/PHPmax). */
  defaultOpenInBasic?: boolean;
  wizardStep?: number;
  statusText?: string;
  children: React.ReactNode;
};

/** V základním režimu sbalí doplňkové moduly; setup, basic a souhrny zůstávají otevřené. */
export function ZsModuleGate({
  sectionId,
  title,
  viewMode,
  defaultOpenInBasic = false,
  wizardStep,
  statusText,
  children,
}: ZsModuleGateProps) {
  if (viewMode === "expert" || ZS_BASIC_ALWAYS_OPEN.has(sectionId)) {
    return <>{children}</>;
  }
  const resolvedWizardStep = wizardStep ?? (ZS_PHMAX_WIZARD_STEP_3.has(sectionId) ? 3 : undefined);
  return (
    <CollapsibleSection
      summary={title}
      defaultOpen={defaultOpenInBasic || sectionId === "basic"}
      level="advanced"
      wizardStep={resolvedWizardStep}
      statusText={statusText}
    >
      {children}
    </CollapsibleSection>
  );
}
