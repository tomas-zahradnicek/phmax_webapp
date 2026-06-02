import {
  clampProductBasicWizardStep,
  productWizardScrollSection,
  readProductBasicWizardStep,
  type ProductBasicWizardStep,
  type ProductBasicWizardStepMeta,
} from "./product-basic-wizard";

export const SS_BASIC_WIZARD_LS_KEY = "phmax-ss-basic-wizard-step";
export const SS_HERO_EXAMPLE_SELECT_ID = "ss-hero-example-select";

export type SsBasicWizardStep = ProductBasicWizardStep;

export const SS_BASIC_WIZARD_STEPS: readonly ProductBasicWizardStepMeta[] = [
  {
    step: 1,
    label: "Ukázka",
    lead: "Volitelně vyberte ukázku v horní liště, nebo přejděte na Vstupy a vyplňte řádky evidence podle své školy.",
    scrollSectionId: "ss-vstupy",
  },
  {
    step: 2,
    label: "Vstupy",
    lead: "Vyplňte řádky evidence tříd – kód oboru, průměr žáků, formu studia a režim výpočtu.",
    scrollSectionId: "ss-vstupy",
  },
  {
    step: 3,
    label: "Výsledek",
    lead: "Zkontrolujte součet PHmax, varování u řádků a případně exportujte scénář.",
    scrollSectionId: "ss-vysledek",
  },
];

export const readSsBasicWizardStep = (): SsBasicWizardStep => readProductBasicWizardStep(SS_BASIC_WIZARD_LS_KEY);
export const clampSsBasicWizardStep = clampProductBasicWizardStep;
export const ssWizardScrollSection = (step: SsBasicWizardStep): string =>
  productWizardScrollSection(SS_BASIC_WIZARD_STEPS, step);
