import type { PageTocSection } from "../PageTableOfContents";
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { ZsBasicWizardStep } from "../zs-basic-wizard";

const ZS_PHMAX_WIZARD_TOC_STEP: Record<string, ZsBasicWizardStep> = {
  setup: 1,
  basic: 2,
  "zs-phmax-exceptions": 3,
  "phmax-summary": 4,
  overview: 5,
};

/** Krok pěti krokového průvodce PHmax pro id z TOC. Neznámé id vrací null. */
export function zsPhmaxWizardStepForTocSection(sectionId: string): ZsBasicWizardStep | null {
  return ZS_PHMAX_WIZARD_TOC_STEP[sectionId] ?? null;
}

export type BuildZsTocSectionsInput = {
  viewMode: CalculatorViewMode;
  tab: "phmax" | "pha" | "php";
  zsShowPhmaxExceptionsToc: boolean;
};

export function buildZsTocSections(input: BuildZsTocSectionsInput): readonly PageTocSection[] {
  const { viewMode, tab, zsShowPhmaxExceptionsToc } = input;
  const sections: PageTocSection[] = [];
  if (viewMode === "expert") {
    sections.push({ id: "guide", label: "Úvod a nápověda" });
  }
  sections.push({ id: "setup", label: "Typ školy a režim" });
  if (tab === "phmax") {
    sections.push({ id: "basic", label: "Běžné třídy" });
    if (zsShowPhmaxExceptionsToc) {
      sections.push({ id: "zs-phmax-exceptions", label: "Výjimky PHmax" });
    }
    sections.push({ id: "phmax-summary", label: "Souhrn PHmax" });
  } else if (tab === "pha") {
    sections.push({ id: "pha", label: "PHAmax" });
    sections.push({ id: "pha1r", label: "PHA1Rmax" });
  } else {
    sections.push({ id: "php", label: "PHPmax" });
  }
  sections.push({ id: "overview", label: "Celkový přehled" });
  return sections;
}
