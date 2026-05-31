import { scrollToDataSection, scrollToFirstNeedsAttentionSection } from "../calculator-section-focus";
import type { ModuleInputsFocusHint } from "../phmax-focus-inputs-hint";

/** Scroll/fokus ŠD z dashboardu nebo banneru – oddělení nebo sekce vstupů. */
export function createSdScrollToInputs(): (hint?: ModuleInputsFocusHint) => void {
  return (hint?: ModuleInputsFocusHint) => {
    if (hint?.rowId != null) {
      const rowEl = document.querySelector(`[data-sd-dept-id="${hint.rowId}"]`);
      if (rowEl instanceof HTMLElement) {
        scrollToDataSection(hint.sectionId ?? "sd-vstupy");
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
    scrollToFirstNeedsAttentionSection(["sd-vstupy"]);
  };
}
