import { scrollToDataSection, scrollToFirstNeedsAttentionSection } from "../calculator-section-focus";
import type { ModuleInputsFocusHint } from "../phmax-focus-inputs-hint";

/** Scroll/fokus NV75 z dashboardu nebo banneru – řádek nebo sekce vstupů. */
export function createNv75ScrollToInputs(fallbackSectionIds: readonly string[] = ["nv75-vstupy"]): (
  hint?: ModuleInputsFocusHint,
) => void {
  return (hint?: ModuleInputsFocusHint) => {
    if (hint?.rowId != null) {
      const rowEl = document.querySelector(`[data-nv75-row-id="${hint.rowId}"]`);
      if (rowEl instanceof HTMLElement) {
        scrollToDataSection(hint.sectionId ?? fallbackSectionIds[0] ?? "nv75-vstupy");
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
    scrollToFirstNeedsAttentionSection(fallbackSectionIds);
  };
}
