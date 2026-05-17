export const ZS_BASIC_WIZARD_LS_KEY = "phmax-zs-basic-wizard-step";

export type ZsBasicWizardStep = 1 | 2 | 3 | 4;

export const ZS_BASIC_WIZARD_STEPS: ReadonlyArray<{
  step: ZsBasicWizardStep;
  label: string;
  lead: string;
}> = [
  {
    step: 1,
    label: "Typ školy",
    lead: "Vyberte režim výpočtu podle typu školy. Volitelně načtěte situaci z rozcestníku.",
  },
  {
    step: 2,
    label: "Třídy",
    lead: "Zadejte počty tříd a žáků pro běžné třídy ZŠ (řádky B1–B8 metodiky).",
  },
  {
    step: 3,
    label: "Výjimky",
    lead: "Doplňte § 16/9, ZŠ speciální, psychiatrii, gymnasium a další moduly, pokud je škola používá.",
  },
  {
    step: 4,
    label: "Souhrn",
    lead: "Zkontrolujte souhrn PHmax a celkový přehled. Poté můžete přepnout na PHAmax nebo PHPmax.",
  },
];

const EXCEPTION_SECTION_IDS = [
  "sec16",
  "special",
  "psych",
  "health",
  "minority",
  "gym",
  "mixed",
  "extras",
] as const;

export function readZsBasicWizardStep(): ZsBasicWizardStep {
  try {
    const raw = localStorage.getItem(ZS_BASIC_WIZARD_LS_KEY);
    const n = Number(raw);
    if (n >= 1 && n <= 4) return n as ZsBasicWizardStep;
  } catch {
    /* ignore */
  }
  return 1;
}

export function clampZsBasicWizardStep(step: number): ZsBasicWizardStep {
  if (step <= 1) return 1;
  if (step >= 4) return 4;
  return step as ZsBasicWizardStep;
}

export function resolveZsWizardScrollSection(
  step: ZsBasicWizardStep,
  visibleExceptionSectionIds: readonly string[],
): string {
  if (step === 1) return "setup";
  if (step === 2) return "basic";
  if (step === 4) return "phmax-summary";
  for (const id of EXCEPTION_SECTION_IDS) {
    if (visibleExceptionSectionIds.includes(id)) return id;
  }
  return "phmax-summary";
}

export function isZsWizardExceptionSection(sectionId: string): boolean {
  return (EXCEPTION_SECTION_IDS as readonly string[]).includes(sectionId);
}
