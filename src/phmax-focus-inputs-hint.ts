const SESSION_KEY = "phmax-focus-module-inputs";
const ROW_KEY = "phmax-focus-module-row-id";
const ROW_KEY_STR = "phmax-focus-module-row-key";
const SECTION_KEY = "phmax-focus-module-section-id";

export type ModuleInputsFocusHint = {
  rowId?: number;
  rowKey?: string;
  sectionId?: string;
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
    if (hint?.rowKey) {
      sessionStorage.setItem(ROW_KEY_STR, hint.rowKey);
    } else {
      sessionStorage.removeItem(ROW_KEY_STR);
    }
    if (hint?.sectionId) {
      sessionStorage.setItem(SECTION_KEY, hint.sectionId);
    } else {
      sessionStorage.removeItem(SECTION_KEY);
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
    const rowKey = sessionStorage.getItem(ROW_KEY_STR) ?? undefined;
    sessionStorage.removeItem(ROW_KEY_STR);
    const sectionId = sessionStorage.getItem(SECTION_KEY) ?? undefined;
    sessionStorage.removeItem(SECTION_KEY);
    const rowId = rowRaw != null ? Number(rowRaw) : undefined;
    return {
      ...(rowId != null && Number.isFinite(rowId) ? { rowId } : {}),
      ...(rowKey ? { rowKey } : {}),
      ...(sectionId ? { sectionId } : {}),
    };
  } catch {
    return null;
  }
}
