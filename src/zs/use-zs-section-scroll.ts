import { useCalculatorSectionScroll } from "../use-calculator-section-scroll";

function resolveZsTabSection(tabKey: string) {
  return tabKey === "phmax" ? "basic" : tabKey;
}

/** Scroll na sekci ZŠ s offsetem sticky docku; volitelně scroll po změně záložky. */
export function useZsSectionScroll(tab: "phmax" | "pha" | "php") {
  return useCalculatorSectionScroll(tab, { resolveTabSection: resolveZsTabSection });
}
