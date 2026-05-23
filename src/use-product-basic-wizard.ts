import { useCallback, useEffect, useState } from "react";
import { scrollToDataSection } from "./calculator-section-focus";
import {
  clampProductBasicWizardStep,
  productWizardScrollSection,
  readProductBasicWizardStep,
  type ProductBasicWizardStep,
  type ProductBasicWizardStepMeta,
} from "./product-basic-wizard";

export function useProductBasicWizard(opts: {
  lsKey: string;
  steps: readonly ProductBasicWizardStepMeta[];
  active: boolean;
}) {
  const { lsKey, steps, active } = opts;
  const [step, setStep] = useState<ProductBasicWizardStep>(() => readProductBasicWizardStep(lsKey));

  useEffect(() => {
    if (!active) return;
    try {
      localStorage.setItem(lsKey, String(step));
    } catch {
      /* ignore */
    }
  }, [active, lsKey, step]);

  const goToStep = useCallback(
    (next: ProductBasicWizardStep) => {
      setStep(next);
      window.requestAnimationFrame(() => {
        scrollToDataSection(productWizardScrollSection(steps, next));
      });
    },
    [steps],
  );

  const handleBack = useCallback(() => {
    goToStep(clampProductBasicWizardStep(step - 1));
  }, [goToStep, step]);

  const handleNext = useCallback(() => {
    if (step >= 3) {
      scrollToDataSection(steps[2]!.scrollSectionId);
      return;
    }
    goToStep(clampProductBasicWizardStep(step + 1));
  }, [goToStep, step, steps]);

  return { step, goToStep, handleBack, handleNext };
}
