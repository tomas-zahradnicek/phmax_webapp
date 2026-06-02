import React from "react";
import { MODE_CONFIG, type CalculatorMode } from "../config/calculator-config";
import type { FormSection } from "../config/calculator-config";
import { ZsBasicWizard } from "../ZsBasicWizard";
import { ZsPhaBasicWizard } from "../ZsPhaBasicWizard";
import { ZsPhpBasicWizard } from "../ZsPhpBasicWizard";
import type { ZsBasicWizardStep } from "../zs-basic-wizard";
import type { ProductBasicWizardStep } from "../product-basic-wizard";
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
  phaWizardStep: ProductBasicWizardStep;
  onPhaWizardStepChange: (step: ProductBasicWizardStep) => void;
  onPhaWizardBack: () => void;
  onPhaWizardNext: () => void;
  phpWizardStep: ProductBasicWizardStep;
  onPhpWizardStepChange: (step: ProductBasicWizardStep) => void;
  onPhpWizardBack: () => void;
  onPhpWizardNext: () => void;
  visibleSections: readonly FormSection[];
  hasSection: (section: FormSection) => boolean;
  onStartEmptyForm?: () => void;
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
  phaWizardStep,
  onPhaWizardStepChange,
  onPhaWizardBack,
  onPhaWizardNext,
  phpWizardStep,
  onPhpWizardStepChange,
  onPhpWizardBack,
  onPhpWizardNext,
  visibleSections,
  hasSection,
  onStartEmptyForm,
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
        onStartEmptyForm={onStartEmptyForm}
      />
    );
  }

  if (viewMode === "basic" && tab === "pha") {
    return (
      <ZsPhaBasicWizard
        step={phaWizardStep}
        moduleApplies={visibleSections.some((s) => s.startsWith("pha_rvp") || s === "pha_disability_flags")}
        onStartEmptyForm={onStartEmptyForm}
        onStepChange={onPhaWizardStepChange}
        onBack={onPhaWizardBack}
        onNext={onPhaWizardNext}
      />
    );
  }

  if (viewMode === "basic" && tab === "php") {
    return (
      <ZsPhpBasicWizard
        step={phpWizardStep}
        moduleApplies={hasSection("php_years") || hasSection("php_options")}
        onStartEmptyForm={onStartEmptyForm}
        onStepChange={onPhpWizardStepChange}
        onBack={onPhpWizardBack}
        onNext={onPhpWizardNext}
      />
    );
  }

  return null;
}
