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

/** Jednorázový scroll k první problematické sekci (volat z tlačítka nebo po validaci). */
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
