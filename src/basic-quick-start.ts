/** Sdílená struktura kroků „Rychlý start“ v základním režimu (PV, ŠD, SŠ, NV75). */
export type BasicQuickStartStep = {
  title: string;
  text: string;
  ctaLabel?: string;
  ctaTargetId?: string;
};

export const BASIC_QUICK_START_EXAMPLE_CTA_LABEL = "Přejít na ukázkový příklad";

export function basicQuickStartHeading(productLabel: string): string {
  return `Rychlý start pro ${productLabel}`;
}

/** Tři kroky: výběr režimu → ukázkový příklad → ověření výsledku. */
export function buildBasicQuickStartSteps(options: {
  selectTitle: string;
  selectText: string;
  exampleTargetId: string;
  exampleText: string;
  verifyTitle: string;
  verifyText: string;
}): readonly BasicQuickStartStep[] {
  return [
    { title: options.selectTitle, text: options.selectText },
    {
      title: "Načtěte ukázkový příklad nahoře",
      text: options.exampleText,
      ctaLabel: BASIC_QUICK_START_EXAMPLE_CTA_LABEL,
      ctaTargetId: options.exampleTargetId,
    },
    { title: options.verifyTitle, text: options.verifyText },
  ];
}
