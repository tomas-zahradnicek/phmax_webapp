import { useCallback, useState } from "react";
import { showUiToast, type UiToastOptions } from "./ui-toast";

/** Stav hlášky + toast při každé neprázdné zprávě. */
export function useUiNotice(
  initial = "",
): readonly [string, (message: string, options?: UiToastOptions) => void] {
  const [notice, setNotice] = useState(initial);
  const publish = useCallback((message: string, options?: UiToastOptions) => {
    setNotice(message);
    if (message.trim()) showUiToast(message, options);
  }, []);
  return [notice, publish] as const;
}
