const SESSION_KEY = "phmax-focus-module-inputs";
const ROW_KEY = "phmax-focus-module-row-id";

export type ModuleInputsFocusHint = {
  rowId?: number;
};

/** Po navigaci z dashboardu – modul má po načtení posunout na první problematickou sekci / řádek. */
export function requestFocusModuleInputs(hint?: ModuleInputsFocusHint): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    if (hint?.rowId != null && Number.isFinite(hint.rowId)) {
      sessionStorage.setItem(ROW_KEY, String(hint.rowId));
    } else {
      sessionStorage.removeItem(ROW_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function consumeFocusModuleInputs(): ModuleInputsFocusHint | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    if (sessionStorage.getItem(SESSION_KEY) !== "1") return null;
    sessionStorage.removeItem(SESSION_KEY);
    const rowRaw = sessionStorage.getItem(ROW_KEY);
    sessionStorage.removeItem(ROW_KEY);
    const rowId = rowRaw != null ? Number(rowRaw) : undefined;
    return {
      ...(rowId != null && Number.isFinite(rowId) ? { rowId } : {}),
    };
  } catch {
    return null;
  }
}
