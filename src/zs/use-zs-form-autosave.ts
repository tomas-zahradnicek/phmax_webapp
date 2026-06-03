import { useCallback, useEffect, useState, type DependencyList } from "react";
import { ZS_AUTOSAVE_STORAGE_KEY } from "./zs-form-snapshot";

export function useZsFormAutosave(
  buildSnapshot: () => Record<string, unknown>,
  deps: DependencyList,
  options?: { persistEnabled?: boolean },
): {
  lastSavedAt: string;
  setLastSavedAt: (value: string) => void;
  persistSnapshot: () => void;
} {
  const [lastSavedAt, setLastSavedAt] = useState("");
  const persistEnabled = options?.persistEnabled !== false;

  const persistSnapshot = useCallback(() => {
    localStorage.setItem(ZS_AUTOSAVE_STORAGE_KEY, JSON.stringify(buildSnapshot()));
    setLastSavedAt(new Date().toLocaleString("cs-CZ"));
  }, [buildSnapshot]);

  useEffect(() => {
    if (!persistEnabled) return;
    try {
      persistSnapshot();
    } catch (error) {
      console.error("Nepodařilo se uložit průběžná data.", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosave při změně formuláře ZŠ
  }, deps);

  return { lastSavedAt, setLastSavedAt, persistSnapshot };
}
