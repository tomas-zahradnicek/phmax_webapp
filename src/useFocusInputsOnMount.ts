import { useEffect } from "react";
import { consumeFocusModuleInputs, type ModuleInputsFocusHint } from "./phmax-focus-inputs-hint";

/** Po příchodu z dashboardu posune stránku k první problematické sekci vstupů. */
export function useFocusInputsOnMount(scrollToInputs: (hint?: ModuleInputsFocusHint) => void): void {
  useEffect(() => {
    const hint = consumeFocusModuleInputs();
    if (!hint) return;
    const timer = window.setTimeout(() => scrollToInputs(hint), 450);
    return () => window.clearTimeout(timer);
  }, [scrollToInputs]);
}
