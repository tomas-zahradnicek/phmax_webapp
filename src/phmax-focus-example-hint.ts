const SESSION_KEY = "phmax-focus-example-select";

/** Po navigaci z dashboardu – stránka má po načtení posunout fokus na hero select ukázky. */
export function requestFocusExampleSelect(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeFocusExampleSelect(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    if (sessionStorage.getItem(SESSION_KEY) !== "1") return false;
    sessionStorage.removeItem(SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}

export function focusHeroExampleSelect(selectId: string): void {
  const el = document.getElementById(selectId);
  if (!(el instanceof HTMLElement)) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus();
}
