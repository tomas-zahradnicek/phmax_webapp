import type { PageTocSection } from "../PageTableOfContents";
import type { CalculatorViewMode } from "../calculator-view-mode";

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
  } else {
    sections.push({ id: "php", label: "PHPmax" });
  }
  sections.push({ id: "overview", label: "Celkový přehled" });
  return sections;
}
