const SESSION_KEY = "phmax-focus-module-inputs";

/** Po navigaci z dashboardu – modul má po načtení posunout na první problematickou sekci. */
export function requestFocusModuleInputs(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeFocusModuleInputs(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    if (sessionStorage.getItem(SESSION_KEY) !== "1") return false;
    sessionStorage.removeItem(SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}
