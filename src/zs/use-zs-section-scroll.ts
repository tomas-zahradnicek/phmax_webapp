import { useCallback } from "react";
import { useCalculatorSectionScroll } from "../use-calculator-section-scroll";
import { isZsPha1rHeroExample } from "./zs-pha1r-examples";
import { PHA1R_SECTION_ID } from "./zs-pha1r-ui";

export function resolveZsTabSection(tabKey: string, selectedExample = ""): string {
  if (tabKey === "pha" && isZsPha1rHeroExample(selectedExample)) return PHA1R_SECTION_ID;
  return tabKey === "phmax" ? "basic" : tabKey;
}

/** Scroll na sekci ZŠ s offsetem sticky docku; volitelně scroll po změně záložky. */
export function useZsSectionScroll(tab: "phmax" | "pha" | "php", selectedExample = "") {
  const resolveTabSection = useCallback(
    (tabKey: string) => resolveZsTabSection(tabKey, selectedExample),
    [selectedExample],
  );
  return useCalculatorSectionScroll(tab, { resolveTabSection });
}
