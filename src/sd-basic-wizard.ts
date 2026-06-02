export const SD_BASIC_WIZARD_LS_KEY = "phmax-sd-basic-wizard-step";

export const SD_HERO_EXAMPLE_SELECT_ID = "sd-hero-example-select";

export type SdBasicWizardStep = 1 | 2 | 3;

export const SD_BASIC_WIZARD_STEP_COUNT = 3;

export const SD_BASIC_WIZARD_STEPS: ReadonlyArray<{
  step: SdBasicWizardStep;
  label: string;
  lead: string;
  scrollSectionId: string;
}> = [
  {
    step: 1,
    label: "Ukázka",
    lead: "Volitelně načtěte ukázku v horní liště, nebo rovnou vyplňte vlastní údaje v kroku Vstupy.",
    scrollSectionId: "sd-vstupy",
  },
  {
    step: 2,
    label: "Vstupy",
    lead: "Zvolte souhrnný nebo detailní režim a doplňte počet účastníků a oddělení.",
    scrollSectionId: "sd-vstupy",
  },
  {
    step: 3,
    label: "Výsledek",
    lead: "Zkontrolujte PHmax, případné krácení dle § 10 odst. 2 a exportujte nebo uložte scénář.",
    scrollSectionId: "sd-vysledek",
  },
];

export function readSdBasicWizardStep(): SdBasicWizardStep {
  try {
    const raw = localStorage.getItem(SD_BASIC_WIZARD_LS_KEY);
    const n = Number(raw);
    if (n >= 1 && n <= SD_BASIC_WIZARD_STEP_COUNT) return n as SdBasicWizardStep;
  } catch {
    /* ignore */
  }
  return 1;
}

export function clampSdBasicWizardStep(step: number): SdBasicWizardStep {
  if (step <= 1) return 1;
  if (step >= SD_BASIC_WIZARD_STEP_COUNT) return SD_BASIC_WIZARD_STEP_COUNT;
  return step as SdBasicWizardStep;
}

export function sdWizardScrollSection(step: SdBasicWizardStep): string {
  return SD_BASIC_WIZARD_STEPS[step - 1]!.scrollSectionId;
}
