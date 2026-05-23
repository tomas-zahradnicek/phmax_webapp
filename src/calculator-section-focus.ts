/** Scroll na sekci formuláře (data-section) s offsetem pod sticky dockem. */
export function scrollToDataSection(sectionId: string, offsetPx = 96): void {
  const element = document.querySelector(`[data-section="${sectionId}"]`);
  if (!(element instanceof HTMLElement)) return;
  const top = element.getBoundingClientRect().top + window.scrollY - offsetPx;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function sectionNeedsAttentionClass(hasIssue: boolean): string {
  return hasIssue ? " card--needs-attention" : "";
}

/** Jednorázový scroll k první sekci podle pořadí id. */
export function focusFirstDataSection(sectionIds: readonly string[]): boolean {
  for (const id of sectionIds) {
    const el = document.querySelector(`[data-section="${id}"]`);
    if (el instanceof HTMLElement) {
      scrollToDataSection(id);
      return true;
    }
  }
  return false;
}

/** Scroll k první sekci s `.card--needs-attention` (nebo k výchozí sekci). */
export function scrollToFirstNeedsAttentionSection(
  fallbackSectionIds: readonly string[] = [],
  offsetPx = 96,
): boolean {
  const attention = document.querySelector<HTMLElement>(".card--needs-attention[data-section]");
  if (attention?.dataset.section) {
    scrollToDataSection(attention.dataset.section, offsetPx);
    return true;
  }
  const anyAttention = document.querySelector<HTMLElement>(".card--needs-attention");
  if (anyAttention) {
    const top = anyAttention.getBoundingClientRect().top + window.scrollY - offsetPx;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    return true;
  }
  return focusFirstDataSection(fallbackSectionIds);
}
