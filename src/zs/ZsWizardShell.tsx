import React from "react";
import { MODE_CONFIG, type CalculatorMode } from "../config/calculator-config";
import type { FormSection } from "../config/calculator-config";
import { ZsBasicWizard } from "../ZsBasicWizard";
import { ZsPhaPhpBasicGuide } from "../ZsPhaPhpBasicGuide";
import type { ZsBasicWizardStep } from "../zs-basic-wizard";
import type { ZsWizardChoiceKey } from "./zs-wizard-choices";

export type ZsWizardShellProps = {
  zsBasicWizardActive: boolean;
  zsWizardStep: ZsBasicWizardStep;
  mode: CalculatorMode;
  zsWizardHasExceptions: boolean;
  wizardChoice: ZsWizardChoiceKey | "";
  wizardOptions: ReadonlyArray<{ value: string; label: string; title: string }>;
  showInputIssueFix: boolean;
  onScrollToIssue: () => void;
  onWizardChoice: (value: ZsWizardChoiceKey | "") => void;
  onStepChange: (step: ZsBasicWizardStep) => void;
  onBack: () => void;
  onNext: () => void;
  viewMode: "basic" | "expert";
  tab: "phmax" | "pha" | "php";
  totalPha: number;
  totalPhp: number;
  visibleSections: readonly FormSection[];
  hasSection: (section: FormSection) => boolean;
  onOpenPhmaxWizard: () => void;
};

export function ZsWizardShell({
  zsBasicWizardActive,
  zsWizardStep,
  mode,
  zsWizardHasExceptions,
  wizardChoice,
  wizardOptions,
  showInputIssueFix,
  onScrollToIssue,
  onWizardChoice,
  onStepChange,
  onBack,
  onNext,
  viewMode,
  tab,
  totalPha,
  totalPhp,
  visibleSections,
  hasSection,
  onOpenPhmaxWizard,
}: ZsWizardShellProps) {
  if (zsBasicWizardActive) {
    return (
      <ZsBasicWizard
        step={zsWizardStep}
        modeLabel={MODE_CONFIG[mode].label}
        hasExceptionModules={zsWizardHasExceptions}
        wizardChoice={wizardChoice}
        wizardOptions={wizardOptions}
        inputIssueFix={showInputIssueFix ? { onFix: onScrollToIssue } : undefined}
        onWizardChoice={(value) => onWizardChoice(value as ZsWizardChoiceKey | "")}
        onStepChange={onStepChange}
        onBack={onBack}
        onNext={onNext}
      />
    );
  }

  if (viewMode === "basic" && tab === "pha") {
    return (
      <ZsPhaPhpBasicGuide
        tab="pha"
        totalValue={totalPha}
        moduleApplies={visibleSections.some((s) => s.startsWith("pha_rvp") || s === "pha_disability_flags")}
        onOpenPhmaxWizard={onOpenPhmaxWizard}
      />
    );
  }

  if (viewMode === "basic" && tab === "php") {
    return (
      <ZsPhaPhpBasicGuide
        tab="php"
        totalValue={totalPhp}
        moduleApplies={hasSection("php_years") || hasSection("php_options")}
        onOpenPhmaxWizard={onOpenPhmaxWizard}
      />
    );
  }

  return null;
}
