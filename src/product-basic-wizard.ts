export type ProductBasicWizardStep = 1 | 2 | 3;

export type ProductBasicWizardStepMeta = {
  step: ProductBasicWizardStep;
  label: string;
  lead: string;
  scrollSectionId: string;
};

export const PRODUCT_BASIC_WIZARD_STEP_COUNT = 3;

export function readProductBasicWizardStep(lsKey: string): ProductBasicWizardStep {
  try {
    const raw = localStorage.getItem(lsKey);
    const n = Number(raw);
    if (n >= 1 && n <= PRODUCT_BASIC_WIZARD_STEP_COUNT) return n as ProductBasicWizardStep;
  } catch {
    /* ignore */
  }
  return 1;
}

export function clampProductBasicWizardStep(step: number): ProductBasicWizardStep {
  if (step <= 1) return 1;
  if (step >= PRODUCT_BASIC_WIZARD_STEP_COUNT) return PRODUCT_BASIC_WIZARD_STEP_COUNT;
  return step as ProductBasicWizardStep;
}

export function productWizardScrollSection(
  steps: readonly ProductBasicWizardStepMeta[],
  step: ProductBasicWizardStep,
): string {
  return steps[step - 1]!.scrollSectionId;
}

/** Třídy pill tlačítka kroku průvodce (sdílené PV/SŠ/NV75/ZŠ). */
export function basicWizardStepButtonClass(itemStep: number, currentStep: number): string {
  const done = itemStep < currentStep;
  const active = itemStep === currentStep;
  const ahead = itemStep > currentStep;
  const aheadNext = itemStep === currentStep + 1;
  return [
    "zs-basic-wizard__step",
    active ? "zs-basic-wizard__step--active" : "",
    done ? "zs-basic-wizard__step--done" : "",
    ahead ? "zs-basic-wizard__step--ahead" : "",
    aheadNext ? "zs-basic-wizard__step--ahead-next" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
