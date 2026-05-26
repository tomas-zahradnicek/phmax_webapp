import { useEffect } from "react";
import { consumeFocusModuleInputs } from "./phmax-focus-inputs-hint";

/** Po příchodu z dashboardu posune stránku k první problematické sekci vstupů. */
export function useFocusInputsOnMount(scrollToInputs: () => void): void {
  useEffect(() => {
    if (!consumeFocusModuleInputs()) return;
    const timer = window.setTimeout(scrollToInputs, 450);
    return () => window.clearTimeout(timer);
  }, [scrollToInputs]);
}
