/** Scroll a focus na prvek podle id (ukázky, vstupy). */
export function focusCalculatorElementById(id: string): void {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLElement)) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus();
}
