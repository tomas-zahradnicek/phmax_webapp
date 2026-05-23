import { useEffect } from "react";
import { consumeFocusExampleSelect, focusHeroExampleSelect } from "./phmax-focus-example-hint";

/** Po příchodu z dashboardu posune fokus na hero select ukázkového příkladu. */
export function useFocusExampleOnMount(selectId: string): void {
  useEffect(() => {
    if (!consumeFocusExampleSelect()) return;
    const timer = window.setTimeout(() => focusHeroExampleSelect(selectId), 450);
    return () => window.clearTimeout(timer);
  }, [selectId]);
}
