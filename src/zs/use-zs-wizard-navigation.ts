import { useCallback, useMemo } from "react";
import type { FormSection } from "../config/calculator-config";
import {
  phmaxPaneFromWizardStep,
  wizardStepFromPhmaxPane,
  type PhmaxZsPhmaxPane,
} from "../PhmaxZsPhmaxSubNav";
import {
  clampZsBasicWizardStep,
  resolveZsWizardScrollSection,
  type ZsBasicWizardStep,
} from "../zs-basic-wizard";
import { buildZsWizardVisibleExceptionIds, ZS_WIZARD_CHOICE_OPTIONS } from "./zs-wizard-choices";

type UseZsWizardNavigationInput = {
  tab: "phmax" | "pha" | "php";
  viewMode: "basic" | "expert";
  zsBasicWizardActive: boolean;
  zsWizardStep: ZsBasicWizardStep;
  setZsWizardStep: (step: ZsBasicWizardStep) => void;
  phmaxSubTab: PhmaxZsPhmaxPane;
  setPhmaxSubTab: (pane: PhmaxZsPhmaxPane) => void;
  hasSection: (section: FormSection) => boolean;
  goToSection: (sectionId: string) => void;
};

export function useZsWizardNavigation({
  tab,
  viewMode,
  zsBasicWizardActive,
  zsWizardStep,
  setZsWizardStep,
  phmaxSubTab,
  setPhmaxSubTab,
  hasSection,
  goToSection,
}: UseZsWizardNavigationInput) {
  const zsWizardVisibleExceptionIds = useMemo(
    () => buildZsWizardVisibleExceptionIds(hasSection),
    [hasSection],
  );
  const zsWizardHasExceptions = zsWizardVisibleExceptionIds.length > 0;

  const effectivePhmaxPane: PhmaxZsPhmaxPane =
    zsBasicWizardActive && zsWizardStep >= 2 ? phmaxPaneFromWizardStep(zsWizardStep) : phmaxSubTab;
  const showPhmaxSubNav = tab === "phmax" && (!zsBasicWizardActive || zsWizardStep >= 2);
  const phmaxPaneShellClass =
    tab === "phmax" && (!zsBasicWizardActive || zsWizardStep >= 2)
      ? ` phmax-zs-pane-active-${effectivePhmaxPane}`
      : "";

  const zsShowPhmaxExceptionsToc =
    tab === "phmax" &&
    (viewMode === "expert" || zsWizardHasExceptions || (zsBasicWizardActive && zsWizardStep >= 3));

  const goToZsWizardStep = useCallback(
    (step: ZsBasicWizardStep) => {
      setZsWizardStep(step);
      if (step >= 2) {
        setPhmaxSubTab(phmaxPaneFromWizardStep(step));
      }
      window.requestAnimationFrame(() => {
        goToSection(resolveZsWizardScrollSection(step, zsWizardVisibleExceptionIds));
      });
    },
    [setZsWizardStep, setPhmaxSubTab, goToSection, zsWizardVisibleExceptionIds],
  );

  const handlePhmaxSubTabChange = useCallback(
    (pane: PhmaxZsPhmaxPane) => {
      setPhmaxSubTab(pane);
      if (zsBasicWizardActive) {
        goToZsWizardStep(wizardStepFromPhmaxPane(pane));
        return;
      }
      const target =
        pane === "classes"
          ? "basic"
          : pane === "exceptions"
            ? zsWizardVisibleExceptionIds[0] ?? "sec16"
            : "phmax-summary";
      goToSection(target);
    },
    [goToZsWizardStep, setPhmaxSubTab, zsBasicWizardActive, goToSection, zsWizardVisibleExceptionIds],
  );

  const handleZsWizardBack = useCallback(() => {
    goToZsWizardStep(clampZsBasicWizardStep(zsWizardStep - 1));
  }, [goToZsWizardStep, zsWizardStep]);

  const handleZsWizardNext = useCallback(() => {
    if (zsWizardStep >= 5) {
      goToSection("overview");
      return;
    }
    if (zsWizardStep === 3 && !zsWizardHasExceptions) {
      goToZsWizardStep(4);
      return;
    }
    goToZsWizardStep(clampZsBasicWizardStep(zsWizardStep + 1));
  }, [goToZsWizardStep, zsWizardStep, goToSection, zsWizardHasExceptions]);

  return {
    zsWizardVisibleExceptionIds,
    zsWizardHasExceptions,
    zsWizardChoiceOptions: ZS_WIZARD_CHOICE_OPTIONS,
    effectivePhmaxPane,
    showPhmaxSubNav,
    phmaxPaneShellClass,
    zsShowPhmaxExceptionsToc,
    goToZsWizardStep,
    handlePhmaxSubTabChange,
    handleZsWizardBack,
    handleZsWizardNext,
  };
}
