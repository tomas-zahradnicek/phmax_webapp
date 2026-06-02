import {
  clampProductBasicWizardStep,
  productWizardScrollSection,
  readProductBasicWizardStep,
  type ProductBasicWizardStep,
  type ProductBasicWizardStepMeta,
} from "./product-basic-wizard";

export const NV75_BASIC_WIZARD_LS_KEY = "phmax-nv75-basic-wizard-step";
export const NV75_HERO_EXAMPLE_SELECT_ID = "nv75-hero-example-select";

export type Nv75BasicWizardStep = ProductBasicWizardStep;

export const NV75_BASIC_WIZARD_STEPS: readonly ProductBasicWizardStepMeta[] = [
  {
    step: 1,
    label: "Ukázka",
    lead: "Volitelně načtěte metodický příklad v comboboxu Příkladové výpočty, nebo rovnou vyplňte vlastní řádky v kroku Vstupy.",
    scrollSectionId: "nv75-vstupy",
  },
  {
    step: 2,
    label: "Vstupy",
    lead: "Doplňte činnosti, pravidlo §4b a kontext praktické školy podle vaší situace.",
    scrollSectionId: "nv75-vstupy",
  },
  {
    step: 3,
    label: "Výsledek",
    lead: "Zkontrolujte banku odpočtů, varování a uložte nebo exportujte scénář.",
    scrollSectionId: "nv75-vysledek",
  },
];

export const readNv75BasicWizardStep = (): Nv75BasicWizardStep =>
  readProductBasicWizardStep(NV75_BASIC_WIZARD_LS_KEY);
export const clampNv75BasicWizardStep = clampProductBasicWizardStep;
export const nv75WizardScrollSection = (step: Nv75BasicWizardStep): string =>
  productWizardScrollSection(NV75_BASIC_WIZARD_STEPS, step);
