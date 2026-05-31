import { scrollToDataSection, scrollToFirstNeedsAttentionSection } from "../calculator-section-focus";
import type { ModuleInputsFocusHint } from "../phmax-focus-inputs-hint";

/** Scroll/fokus SŠ z dashboardu nebo banneru – řádek nebo sekce evidence. */
export function createSsScrollToInputs(): (hint?: ModuleInputsFocusHint) => void {
  return (hint?: ModuleInputsFocusHint) => {
    if (hint?.rowId != null) {
      const rowEl = document.querySelector(`[data-ss-row-id="${hint.rowId}"]`);
      if (rowEl instanceof HTMLElement) {
        scrollToDataSection(hint.sectionId ?? "ss-vstupy");
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
    scrollToFirstNeedsAttentionSection(["ss-vstupy"]);
  };
}
