import { scrollToDataSection, scrollToFirstNeedsAttentionSection } from "../calculator-section-focus";
import type { ModuleInputsFocusHint } from "../phmax-focus-inputs-hint";

/** Scroll/fokus PV z dashboardu nebo banneru – řádek nebo sekce vstupů. */
export function createPvScrollToInputs(): (hint?: ModuleInputsFocusHint) => void {
  return (hint?: ModuleInputsFocusHint) => {
    if (hint?.rowKey) {
      const rowEl = document.querySelector(`[data-pv-row-id="${hint.rowKey}"]`);
      if (rowEl instanceof HTMLElement) {
        scrollToDataSection(hint.sectionId ?? "pv-vstupy");
        window.requestAnimationFrame(() => {
          rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
          const focusable = rowEl.querySelector<HTMLElement>("input, select, textarea, button");
          focusable?.focus({ preventScroll: true });
        });
        return;
      }
    }
    if (hint?.sectionId) {
      scrollToDataSection(hint.sectionId);
      return;
    }
    scrollToFirstNeedsAttentionSection(["pv-vstupy"]);
  };
}
